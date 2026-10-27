from typing import Dict, List, Any
from fastapi import APIRouter, HTTPException, Query
from app.models.schemas import RepoInputRequest, FullRepoAnalysis, ParsedFileInfo
from app.services.github_service import github_service
from app.services.tech_detector import tech_detector
from app.services.code_parser import code_parser
from app.services.gemini_service import gemini_service
from app.services.viva_service import viva_service

router = APIRouter(prefix="/analyze", tags=["Repository Analysis"])

@router.post("", response_model=FullRepoAnalysis)
async def analyze_repository(request: RepoInputRequest):
    """
    Complete end-to-end repository analysis pipeline:
    1. Validates repository URL and retrieves metadata via GitHub REST API.
    2. Retrieves recursive Git tree and classifies all files.
    3. Detects programming languages, frameworks, manifests and dependencies.
    4. Performs static AST / syntactic parsing on key source files.
    5. Maps module relationships and dependency graph.
    6. Synthesizes setup guide and MCA viva examination questions.
    7. Generates AI architecture overview & project summary with Google Gemini.
    """
    owner, repo = github_service.parse_repo_url(request.url)
    token = request.github_token

    # 1. Fetch metadata
    metadata = await github_service.fetch_repo_metadata(owner, repo, token)

    # 2. Fetch recursive git tree
    raw_tree = await github_service.fetch_file_tree(owner, repo, metadata.default_branch, token)

    # 3. Identify and fetch key manifests
    manifest_names = [
        "package.json", "requirements.txt", "requirements-dev.txt",
        "pyproject.toml", "Pipfile", "setup.py", "pom.xml",
        "build.gradle", "Cargo.toml", "go.mod", "Dockerfile",
        "docker-compose.yml", ".env.example", ".env.sample"
    ]

    manifest_contents: Dict[str, str] = {}
    tree_paths = {item.get("path"): item for item in raw_tree}

    for m_name in manifest_names:
        if m_name in tree_paths:
            try:
                content = await github_service.fetch_file_content(
                    owner, repo, m_name, metadata.default_branch, token
                )
                manifest_contents[m_name] = content
            except Exception:
                pass

    # 4. Classify files & detect technologies
    files, tech_analysis = tech_detector.analyze_repository(raw_tree, manifest_contents)

    # 5. Select key source files to statically parse with AST (up to 20 representative files)
    supported_exts = (".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".cpp", ".c")
    candidate_source_files = [
        f for f in files
        if f.type == "blob"
        and f.path.endswith(supported_exts)
        and not f.path.startswith(("node_modules/", "venv/", ".git/", "dist/", "build/"))
        and f.size < 150000  # < 150 KB
    ]

    # Prioritize root entry points and key modules
    def sort_priority(item):
        p = item.path.lower()
        if any(term in p for term in ["main", "index", "app", "server"]):
            return 0
        if any(term in p for term in ["router", "controller", "api"]):
            return 1
        if any(term in p for term in ["service", "logic"]):
            return 2
        if any(term in p for term in ["model", "schema"]):
            return 3
        return 4

    candidate_source_files.sort(key=sort_priority)
    files_to_parse = candidate_source_files[:20]

    parsed_code: List[ParsedFileInfo] = []
    for f in files_to_parse:
        try:
            content = await github_service.fetch_file_content(
                owner, repo, f.path, metadata.default_branch, token
            )
            parsed_res = code_parser.parse_source_file(f.path, content)
            if parsed_res:
                parsed_code.append(parsed_res)
        except Exception:
            pass

    # 6. Build Module Dependency Graph
    dependency_graph = code_parser.build_dependency_graph(parsed_code)

    # 7. Generate Setup Guide & Viva Prep
    setup_guide = viva_service.generate_setup_guide(metadata, tech_analysis, files, manifest_contents)
    viva_questions = viva_service.generate_viva_questions(metadata, tech_analysis, parsed_code)

    # 8. Generate AI Project Summary (Google Gemini)
    ai_summary = await gemini_service.generate_project_summary(
        metadata=metadata,
        tech=tech_analysis,
        parsed_files=parsed_code,
        custom_key=request.gemini_api_key
    )

    return FullRepoAnalysis(
        metadata=metadata,
        files=files,
        technology=tech_analysis,
        parsed_code=parsed_code,
        dependency_graph=dependency_graph,
        setup_guide=setup_guide,
        viva_questions=viva_questions,
        ai_summary=ai_summary
    )

@router.get("/file-content")
async def get_file_content(
    owner: str = Query(...),
    repo: str = Query(...),
    path: str = Query(...),
    branch: str = Query("main"),
    token: str = Query(None)
):
    """Retrieves file content on-demand for the UI code viewer."""
    content = await github_service.fetch_file_content(owner, repo, path, branch, token)
    return {"path": path, "content": content}
