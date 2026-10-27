import re
from typing import List, Dict, Any, Optional
from app.models.schemas import (
    SetupGuide, SetupStep, VivaQuestion,
    RepoMetadata, TechnologyAnalysis, ParsedFileInfo
)
from app.services.gemini_service import gemini_service

class VivaService:
    def generate_setup_guide(
        self,
        metadata: RepoMetadata,
        tech: TechnologyAnalysis,
        files: List[Any],
        manifest_contents: Dict[str, str]
    ) -> SetupGuide:
        """
        Synthesizes realistic setup prerequisites, installation, execution and testing commands.
        """
        prerequisites: List[str] = ["Git (for repository cloning)"]
        env_vars: List[str] = []
        install_steps: List[SetupStep] = []
        run_steps: List[SetupStep] = []
        test_steps: List[SetupStep] = []

        file_paths = {f.path for f in files}

        # Check for .env.example / .env.sample
        for p in file_paths:
            if p in (".env.example", ".env.sample", ".env.template"):
                if p in manifest_contents:
                    for line in manifest_contents[p].splitlines():
                        if "=" in line and not line.strip().startswith("#"):
                            env_vars.append(line.split("=")[0].strip())
                if not env_vars:
                    env_vars.append("PORT=8000")
                    env_vars.append("DATABASE_URL=...")

        # Clone step
        install_steps.append(SetupStep(
            title="1. Clone Repository",
            command=f"git clone {metadata.html_url}.git\ncd {metadata.name}",
            description="Clone the remote repository to your local machine and navigate into the root directory."
        ))

        # Python setup
        if tech.primary_language == "Python" or any("requirements" in p for p in file_paths):
            prerequisites.append("Python 3.10+ and pip")
            install_steps.append(SetupStep(
                title="2. Create & Activate Virtual Environment",
                command="python -m venv venv\n# On Windows:\n.\\venv\\Scripts\\activate\n# On Linux/macOS:\nsource venv/bin/activate",
                description="Set up an isolated Python virtual environment to manage dependencies."
            ))

            req_file = "requirements.txt" if "requirements.txt" in file_paths else "pyproject.toml"
            install_steps.append(SetupStep(
                title="3. Install Python Dependencies",
                command=f"pip install -r {req_file}" if req_file.endswith(".txt") else "pip install .",
                description="Install all declared application packages and libraries."
            ))

            # Run step
            is_fastapi = any(t.name == "FastAPI" for t in tech.technologies)
            is_flask = any(t.name == "Flask" for t in tech.technologies)
            is_django = any(t.name == "Django" for t in tech.technologies)

            if is_fastapi:
                run_steps.append(SetupStep(
                    title="Launch FastAPI Application",
                    command="uvicorn main:app --reload --host 127.0.0.1 --port 8000",
                    description="Starts the ASGI development server with hot-reload enabled."
                ))
            elif is_flask:
                run_steps.append(SetupStep(
                    title="Launch Flask Server",
                    command="flask run --port=5000",
                    description="Starts the Flask WSGI development server."
                ))
            elif is_django:
                run_steps.append(SetupStep(
                    title="Run Django Migrations & Server",
                    command="python manage.py migrate\npython manage.py runserver",
                    description="Applies database migrations and runs the Django HTTP development server."
                ))
            else:
                run_steps.append(SetupStep(
                    title="Execute Application Entry Point",
                    command="python main.py",
                    description="Runs the primary Python script."
                ))

            test_steps.append(SetupStep(
                title="Run Unit & Integration Tests",
                command="pytest",
                description="Executes the test suite using pytest."
            ))

        # Node.js / JavaScript / TypeScript setup
        if tech.primary_language in ("JavaScript", "TypeScript", "JavaScript (React)", "TypeScript (React)") or "package.json" in file_paths:
            prerequisites.append("Node.js 18.0+ and npm / pnpm / yarn")

            install_steps.append(SetupStep(
                title="Install Node Dependencies",
                command="npm install",
                description="Installs all npm packages declared in package.json."
            ))

            is_vite = any(t.name == "Vite" for t in tech.technologies)
            is_next = any(t.name == "Next.js" for t in tech.technologies)

            if is_vite or is_next:
                run_steps.append(SetupStep(
                    title="Start Development Server",
                    command="npm run dev",
                    description="Launches the local development server with Hot Module Replacement (HMR)."
                ))
            else:
                run_steps.append(SetupStep(
                    title="Start Application",
                    command="npm start",
                    description="Executes the startup script specified in package.json."
                ))

            test_steps.append(SetupStep(
                title="Execute Test Suite",
                command="npm test",
                description="Runs JavaScript/TypeScript tests."
            ))

        # Docker setup
        if any(p in file_paths for p in ["Dockerfile", "docker-compose.yml"]):
            prerequisites.append("Docker & Docker Compose")
            if "docker-compose.yml" in file_paths:
                run_steps.append(SetupStep(
                    title="Run with Docker Compose (Alternative)",
                    command="docker-compose up --build",
                    description="Builds and runs all containerized application services in the background."
                ))

        return SetupGuide(
            prerequisites=list(set(prerequisites)),
            environment_variables=env_vars,
            install_steps=install_steps,
            run_steps=run_steps,
            test_steps=test_steps
        )

    def generate_viva_questions(
        self,
        metadata: RepoMetadata,
        tech: TechnologyAnalysis,
        parsed_files: List[ParsedFileInfo]
    ) -> List[VivaQuestion]:
        """
        Generates realistic, technical MCA viva and project defense questions tailored to the repository.
        """
        questions: List[VivaQuestion] = []
        qid = 1

        primary_lang = tech.primary_language
        tech_names = [t.name for t in tech.technologies]

        # 1. Architecture Question
        questions.append(VivaQuestion(
            id=qid,
            category="Architecture & Design",
            difficulty="Basic",
            question=f"Can you explain the high-level architecture and file organization of this {primary_lang} project?",
            answer_hint=(
                f"Explain the directory layout, separating entry points from business logic and configuration. "
                f"Highlight that the project contains {tech.total_files} files with modular separation: "
                f"source modules handle core operations, manifests manage dependencies, and entry points initialize execution."
            ),
            relevant_files=[pf.path for pf in parsed_files[:3]]
        ))
        qid += 1

        # 2. Technology Choice Question
        if tech_names:
            main_framework = tech_names[0]
            questions.append(VivaQuestion(
                id=qid,
                category="Technology Justification",
                difficulty="Intermediate",
                question=f"Why was {main_framework} chosen for this repository, and what are its advantages over alternatives?",
                answer_hint=(
                    f"Discuss key characteristics of {main_framework} such as performance, asynchronous capabilities, "
                    f"community ecosystem, and developer productivity compared to older or heavier frameworks."
                ),
                relevant_files=[t.source_file for t in tech.technologies if t.name == main_framework]
            ))
            qid += 1

        # 3. Code Implementation Question (based on actual functions/classes)
        entry_file = next((pf for pf in parsed_files if pf.is_entry_point), parsed_files[0] if parsed_files else None)
        if entry_file and (entry_file.functions or entry_file.classes):
            sample_item = entry_file.classes[0].name if entry_file.classes else entry_file.functions[0].name
            is_class = bool(entry_file.classes)
            questions.append(VivaQuestion(
                id=qid,
                category="Implementation Details",
                difficulty="Intermediate",
                question=f"In `{entry_file.path}`, what is the responsibility of the {'class' if is_class else 'function'} `{sample_item}`?",
                answer_hint=(
                    f"Detail what inputs `{sample_item}` accepts and its role in the module workflow. "
                    f"Mention how it encapsulates logic and whether it interacts with external services or stores state."
                ),
                relevant_files=[entry_file.path]
            ))
            qid += 1

        # 4. Asynchronous / Concurrency Question
        has_async = any(any(f.is_async for f in pf.functions) for pf in parsed_files)
        if has_async or any(t.name in ("FastAPI", "Uvicorn", "Node.js", "Express.js", "Asyncio") for t in tech.technologies):
            questions.append(VivaQuestion(
                id=qid,
                category="Performance & Concurrency",
                difficulty="Advanced",
                question="How does this codebase handle asynchronous operations and concurrent I/O requests without blocking the event loop?",
                answer_hint=(
                    "Explain the single-threaded asynchronous event loop (e.g., Python asyncio / Node.js libuv). "
                    "Discuss non-blocking I/O operations (`async/await`, HTTP requests, DB queries) allowing high throughput with low memory overhead."
                ),
                relevant_files=[pf.path for pf in parsed_files if any(f.is_async for f in pf.functions)][:2]
            ))
            qid += 1

        # 5. Dependency & Package Management
        manifest_files = list(set(t.source_file for t in tech.technologies))
        if manifest_files:
            questions.append(VivaQuestion(
                id=qid,
                category="Software Engineering",
                difficulty="Basic",
                question=f"How are external dependencies managed in this project via `{manifest_files[0]}`?",
                answer_hint=(
                    f"Explain semantic versioning (`^`, `~`, `>=`), lock files for deterministic builds, "
                    f"and how isolation is maintained (e.g., virtual environments or node_modules) to prevent dependency conflicts."
                ),
                relevant_files=manifest_files[:2]
            ))
            qid += 1

        # 6. Security & Input Validation
        has_pydantic = any(t.name == "Pydantic" for t in tech.technologies)
        questions.append(VivaQuestion(
            id=qid,
            category="Security & Validation",
            difficulty="Intermediate",
            question="What security measures and input validation mechanisms should be in place for this application?",
            answer_hint=(
                "Highlight schema validation (e.g. Pydantic / TypeScript types), parameter sanitization to prevent injection attacks, "
                "proper environment variable handling for sensitive secrets, and rate limiting."
            ),
            relevant_files=[pf.path for pf in parsed_files if "schema" in pf.path.lower() or "model" in pf.path.lower()][:2]
        ))
        qid += 1

        # 7. Testing & Quality Assurance
        has_tests = any("test" in pf.path.lower() for pf in parsed_files) or tech.category_counts.get("test", 0) > 0
        questions.append(VivaQuestion(
            id=qid,
            category="Testing & QA",
            difficulty="Basic",
            question="What testing strategy is suitable for this codebase, and how are unit tests structured?",
            answer_hint=(
                f"{'The repository already includes test suites' if has_tests else 'Unit tests should be created'} "
                "using standard frameworks (pytest/Jest). Explain mocking external dependencies, assertions, and test coverage calculation."
            ),
            relevant_files=[pf.path for pf in parsed_files if "test" in pf.path.lower()][:2]
        ))
        qid += 1

        # 8. Scalability & Cloud Deployment
        has_docker = any("Docker" in t.name for t in tech.technologies)
        questions.append(VivaQuestion(
            id=qid,
            category="Scalability & Deployment",
            difficulty="Advanced",
            question="If traffic increases 100x, how would you scale this repository in production?",
            answer_hint=(
                f"{'Leverage the existing Docker containerization' if has_docker else 'Containerize using Docker'} "
                "and deploy behind a load balancer (e.g. NGINX) with horizontal pod autoscaling (Kubernetes), "
                "implement redis caching for hot data, and separate database read replicas."
            ),
            relevant_files=["Dockerfile"] if has_docker else []
        ))

        return questions

viva_service = VivaService()
