import json
import re
import os
from typing import List, Dict, Any, Tuple, Optional
from app.models.schemas import FileItem, LanguageStat, DetectedTech, TechnologyAnalysis

# Language extension mapping
EXTENSION_LANGUAGE_MAP = {
    ".py": "Python",
    ".js": "JavaScript",
    ".jsx": "JavaScript (React)",
    ".ts": "TypeScript",
    ".tsx": "TypeScript (React)",
    ".java": "Java",
    ".c": "C",
    ".cpp": "C++",
    ".cc": "C++",
    ".cxx": "C++",
    ".h": "C/C++ Header",
    ".hpp": "C++ Header",
    ".cs": "C#",
    ".go": "Go",
    ".rs": "Rust",
    ".php": "PHP",
    ".rb": "Ruby",
    ".swift": "Swift",
    ".kt": "Kotlin",
    ".scala": "Scala",
    ".html": "HTML",
    ".css": "CSS",
    ".scss": "SCSS",
    ".sass": "Sass",
    ".sql": "SQL",
    ".sh": "Shell",
    ".bash": "Shell",
    ".ps1": "PowerShell",
    ".md": "Markdown",
    ".json": "JSON",
    ".xml": "XML",
    ".yaml": "YAML",
    ".yml": "YAML",
    ".toml": "TOML",
}

# Known technology signatures in package.json
PACKAGE_JSON_TECH_MAP = {
    # Frontend frameworks
    "react": ("React", "Frontend", "UI library for building user interfaces"),
    "react-dom": ("React DOM", "Frontend", "React package for working with the DOM"),
    "vue": ("Vue.js", "Frontend", "Progressive JavaScript Framework"),
    "@angular/core": ("Angular", "Frontend", "Component-based web framework"),
    "next": ("Next.js", "Frontend", "React framework for full-stack web applications"),
    "nuxt": ("Nuxt", "Frontend", "Intuitive Vue Framework"),
    "svelte": ("Svelte", "Frontend", "Cybernetically enhanced web apps"),
    # Backend frameworks
    "express": ("Express.js", "Backend", "Fast, minimalist web framework for Node.js"),
    "@nestjs/core": ("NestJS", "Backend", "Progressive Node.js framework for scalable server-side apps"),
    "fastify": ("Fastify", "Backend", "Fast and low overhead web framework for Node.js"),
    "koa": ("Koa", "Backend", "Next generation web framework for Node.js"),
    # Styling & UI
    "tailwindcss": ("Tailwind CSS", "Styling/UI", "Utility-first CSS framework"),
    "@mui/material": ("Material UI", "Styling/UI", "Comprehensive React component library"),
    "bootstrap": ("Bootstrap", "Styling/UI", "HTML, CSS, and JS library"),
    "styled-components": ("styled-components", "Styling/UI", "Visual primitives for the component age"),
    # Database / ORM
    "prisma": ("Prisma", "Database/ORM", "Next-generation Node.js and TypeScript ORM"),
    "@prisma/client": ("Prisma Client", "Database/ORM", "Auto-generated database client"),
    "mongoose": ("Mongoose", "Database/ORM", "MongoDB object modeling for Node.js"),
    "pg": ("PostgreSQL Client (pg)", "Database/ORM", "Non-blocking PostgreSQL client for Node.js"),
    "mysql2": ("MySQL Client (mysql2)", "Database/ORM", "MySQL client for Node.js"),
    "typeorm": ("TypeORM", "Database/ORM", "ORM for TypeScript and JavaScript"),
    # Testing
    "jest": ("Jest", "Testing", "Delightful JavaScript Testing Framework"),
    "vitest": ("Vitest", "Testing", "Next generation testing framework powered by Vite"),
    "cypress": ("Cypress", "Testing", "Fast, easy and reliable testing for anything that runs in a browser"),
    "@playwright/test": ("Playwright", "Testing", "Reliable end-to-end testing for modern web apps"),
    # Build & Tooling
    "vite": ("Vite", "Build/DevOps", "Next Generation Frontend Tooling"),
    "webpack": ("Webpack", "Build/DevOps", "Static module bundler for modern JavaScript applications"),
    "typescript": ("TypeScript", "Tooling", "Typed superset of JavaScript that compiles to plain JavaScript"),
    "eslint": ("ESLint", "Tooling", "Find and fix problems in your JavaScript code"),
    # State Management
    "redux": ("Redux", "State Management", "Predictable state container for JavaScript apps"),
    "@reduxjs/toolkit": ("Redux Toolkit", "State Management", "Standard way to write Redux logic"),
    "zustand": ("Zustand", "State Management", "Small, fast and scalable bearbones state-management"),
}

# Known technology signatures in Python requirements
PYTHON_TECH_MAP = {
    # Backend
    "fastapi": ("FastAPI", "Backend", "High performance web framework for building APIs with Python"),
    "uvicorn": ("Uvicorn", "Backend", "Lightning-fast ASGI server implementation"),
    "flask": ("Flask", "Backend", "Lightweight WSGI web application framework"),
    "django": ("Django", "Backend", "High-level Python web framework that encourages rapid development"),
    "starlette": ("Starlette", "Backend", "Lightweight ASGI framework/toolkit"),
    "tornado": ("Tornado", "Backend", "Python web framework and asynchronous networking library"),
    # AI / ML / Data Science
    "torch": ("PyTorch", "AI/ML", "Tensors and Dynamic neural networks in Python"),
    "tensorflow": ("TensorFlow", "AI/ML", "End-to-end open source machine learning platform"),
    "transformers": ("Hugging Face Transformers", "AI/ML", "State-of-the-art Machine Learning for Pytorch, TensorFlow, and JAX"),
    "scikit-learn": ("Scikit-Learn", "AI/ML", "Machine learning library for Python"),
    "pandas": ("Pandas", "Data Processing", "Powerful data structures for data analysis"),
    "numpy": ("NumPy", "Data Processing", "Fundamental package for scientific computing with Python"),
    "google-generativeai": ("Google Gemini SDK", "AI/ML", "Google Generative AI SDK for Gemini models"),
    "google-genai": ("Google GenAI SDK", "AI/ML", "Unified Google GenAI SDK for Gemini models"),
    "openai": ("OpenAI SDK", "AI/ML", "Official Python library for the OpenAI API"),
    "langchain": ("LangChain", "AI/ML", "Framework for developing applications powered by language models"),
    # Database / ORM
    "sqlalchemy": ("SQLAlchemy", "Database/ORM", "The Python SQL Toolkit and Object Relational Mapper"),
    "psycopg2": ("PostgreSQL Driver (psycopg2)", "Database/ORM", "PostgreSQL database adapter for Python"),
    "asyncpg": ("asyncpg", "Database/ORM", "Fast asynchronous PostgreSQL client library for Python"),
    "pymongo": ("PyMongo", "Database/ORM", "Python driver for MongoDB"),
    "alembic": ("Alembic", "Database/ORM", "Database migration tool for SQLAlchemy"),
    # Testing
    "pytest": ("Pytest", "Testing", "Framework that makes building simple and scalable tests easy"),
    "unittest": ("Unittest", "Testing", "Built-in Python unit testing framework"),
    "playwright": ("Playwright Python", "Testing", "Python library to automate Chromium, Firefox and WebKit"),
    # Validation & Utilities
    "pydantic": ("Pydantic", "Tooling", "Data validation and settings management using Python type annotations"),
    "httpx": ("HTTPX", "Tooling", "Next generation HTTP client for Python"),
    "celery": ("Celery", "Distributed Systems", "Distributed task queue"),
}

class TechDetector:
    @staticmethod
    def classify_file(path: str, item_type: str, size: int) -> FileItem:
        """Categorizes file path into source, test, doc, config, build, asset, other."""
        lower_path = path.lower()
        filename = os.path.basename(path)
        _, ext = os.path.splitext(filename)
        ext = ext.lower()

        # Is directory
        if item_type == "tree":
            return FileItem(
                path=path,
                name=filename,
                type="tree",
                size=0,
                category="directory",
                language=None,
                extension=""
            )

        # Detect category
        category = "other"
        language = EXTENSION_LANGUAGE_MAP.get(ext)

        # Tests
        test_indicators = ["/tests/", "/test/", "/__tests__/", "/spec/", "test_", "_test.", ".test.", ".spec."]
        if any(ind in lower_path for ind in test_indicators):
            category = "test"
        # Documentation
        elif ext in [".md", ".rst", ".txt", ".pdf"] or lower_path.startswith("docs/") or "license" in lower_path or "readme" in lower_path:
            category = "doc"
        # Build & DevOps
        elif filename in ["Dockerfile", "docker-compose.yml", "docker-compose.yaml", "Makefile", "CMakeLists.txt", "pom.xml", "build.gradle", "Cargo.toml", "go.mod"] or ".github/workflows" in lower_path:
            category = "build"
        # Configuration
        elif ext in [".json", ".yaml", ".yml", ".toml", ".ini", ".env", ".gitignore", ".editorconfig", ".prettierrc", ".eslintrc"] or "config" in filename.lower() or filename.startswith("."):
            category = "config"
        # Assets
        elif ext in [".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp", ".woff", ".woff2", ".ttf", ".eot", ".mp3", ".mp4"]:
            category = "asset"
        # Source code
        elif language is not None and ext not in [".json", ".yaml", ".yml", ".toml", ".xml", ".md", ".txt"]:
            category = "source"

        return FileItem(
            path=path,
            name=filename,
            type="blob",
            size=size,
            category=category,
            language=language,
            extension=ext
        )

    def analyze_repository(
        self,
        raw_tree: List[Dict[str, Any]],
        manifest_contents: Dict[str, str]
    ) -> Tuple[List[FileItem], TechnologyAnalysis]:
        """
        Processes tree items, determines language breakdown, detects frameworks & libraries.
        """
        files: List[FileItem] = []
        lang_stats: Dict[str, Dict[str, Any]] = {}
        category_counts: Dict[str, int] = {
            "source": 0,
            "test": 0,
            "doc": 0,
            "config": 0,
            "build": 0,
            "asset": 0,
            "other": 0
        }
        total_files = 0
        total_dirs = 0
        total_bytes = 0

        for item in raw_tree:
            path = item.get("path", "")
            item_type = item.get("type", "blob")
            size = item.get("size", 0)

            classified = self.classify_file(path, item_type, size)
            files.append(classified)

            if classified.type == "tree":
                total_dirs += 1
            else:
                total_files += 1
                total_bytes += size
                cat = classified.category
                category_counts[cat] = category_counts.get(cat, 0) + 1

                # Language tracking (exclude docs/config from code languages)
                if classified.language and classified.category in ("source", "test"):
                    lang = classified.language
                    if lang not in lang_stats:
                        lang_stats[lang] = {"files": 0, "bytes": 0}
                    lang_stats[lang]["files"] += 1
                    lang_stats[lang]["bytes"] += size

        # Compute language percentages
        code_bytes = sum(s["bytes"] for s in lang_stats.values()) or 1
        languages: List[LanguageStat] = []
        for lang, s in sorted(lang_stats.items(), key=lambda x: x[1]["bytes"], reverse=True):
            pct = round((s["bytes"] / code_bytes) * 100, 1)
            languages.append(LanguageStat(
                name=lang,
                file_count=s["files"],
                total_bytes=s["bytes"],
                percentage=pct
            ))

        primary_language = languages[0].name if languages else "Plain Text"

        # Detect technologies from manifest contents & file presence
        technologies: List[DetectedTech] = []
        detected_names = set()

        # 1. Inspect package.json
        if "package.json" in manifest_contents:
            try:
                pkg_data = json.loads(manifest_contents["package.json"])
                deps = {**pkg_data.get("dependencies", {}), **pkg_data.get("devDependencies", {})}
                for dep, ver in deps.items():
                    if dep in PACKAGE_JSON_TECH_MAP and dep not in detected_names:
                        tech_name, tech_cat, tech_desc = PACKAGE_JSON_TECH_MAP[dep]
                        technologies.append(DetectedTech(
                            name=tech_name,
                            category=tech_cat,
                            version=str(ver).replace("^", "").replace("~", ""),
                            source_file="package.json",
                            description=tech_desc
                        ))
                        detected_names.add(dep)
            except Exception:
                pass

        # 2. Inspect requirements.txt / setup.py
        for py_manifest in ["requirements.txt", "requirements-dev.txt"]:
            if py_manifest in manifest_contents:
                content = manifest_contents[py_manifest]
                for line in content.splitlines():
                    clean_line = line.strip().split("#")[0]
                    if not clean_line:
                        continue
                    # Match package name and version
                    m = re.match(r"^([a-zA-Z0-9_\-\.]+)(?:[>=<~]+([a-zA-Z0-9_\-\.]+))?", clean_line)
                    if m:
                        pkg_name = m.group(1).lower()
                        ver = m.group(2)
                        if pkg_name in PYTHON_TECH_MAP and pkg_name not in detected_names:
                            tech_name, tech_cat, tech_desc = PYTHON_TECH_MAP[pkg_name]
                            technologies.append(DetectedTech(
                                name=tech_name,
                                category=tech_cat,
                                version=ver,
                                source_file=py_manifest,
                                description=tech_desc
                            ))
                            detected_names.add(pkg_name)

        # 3. Inspect Docker, CI/CD, and Build tools from file presence
        file_paths = {f.path for f in files}
        if any(p in file_paths for p in ["Dockerfile", "docker-compose.yml", "docker-compose.yaml"]):
            technologies.append(DetectedTech(
                name="Docker / Containerization",
                category="Build/DevOps",
                version=None,
                source_file="Dockerfile",
                description="Containerization platform for isolated application deployment"
            ))

        if any(".github/workflows" in p for p in file_paths):
            technologies.append(DetectedTech(
                name="GitHub Actions",
                category="Build/DevOps",
                version=None,
                source_file=".github/workflows",
                description="Automated CI/CD pipeline workflows"
            ))

        if any(p.endswith("pom.xml") for p in file_paths):
            technologies.append(DetectedTech(
                name="Maven",
                category="Build/DevOps",
                version=None,
                source_file="pom.xml",
                description="Java project management and build automation tool"
            ))

        if any(p.endswith("build.gradle") for p in file_paths):
            technologies.append(DetectedTech(
                name="Gradle",
                category="Build/DevOps",
                version=None,
                source_file="build.gradle",
                description="Build automation tool for multi-language development"
            ))

        if any(p.endswith("CMakeLists.txt") for p in file_paths):
            technologies.append(DetectedTech(
                name="CMake",
                category="Build/DevOps",
                version=None,
                source_file="CMakeLists.txt",
                description="Cross-platform build configuration system for C/C++"
            ))

        # Sort technologies by category
        technologies.sort(key=lambda t: (t.category, t.name))

        tech_analysis = TechnologyAnalysis(
            primary_language=primary_language,
            languages=languages,
            technologies=technologies,
            category_counts=category_counts,
            total_files=total_files,
            total_directories=total_dirs,
            total_bytes=total_bytes
        )

        return files, tech_analysis

tech_detector = TechDetector()
