from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

# --- Module 1: Repository Input & Metadata ---
class RepoInputRequest(BaseModel):
    url: str = Field(..., description="GitHub repository URL or owner/repo")
    github_token: Optional[str] = Field(None, description="Optional GitHub Personal Access Token to increase rate limit")
    gemini_api_key: Optional[str] = Field(None, description="Optional user Gemini API key")

class RepoMetadata(BaseModel):
    owner: str
    name: str
    full_name: str
    description: Optional[str] = None
    default_branch: str
    stars: int = 0
    forks: int = 0
    open_issues: int = 0
    license: Optional[str] = None
    topics: List[str] = []
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    size_kb: int = 0
    html_url: str
    avatar_url: Optional[str] = None
    has_readme: bool = False
    readme_content: Optional[str] = None

class FileItem(BaseModel):
    path: str
    name: str
    type: str  # "blob" (file) or "tree" (dir)
    size: int = 0
    category: str = "other"  # source, test, doc, config, build, asset, other
    language: Optional[str] = None
    extension: str = ""

# --- Module 2: File Structure & Technology Analysis ---
class LanguageStat(BaseModel):
    name: str
    file_count: int
    total_bytes: int
    percentage: float

class DetectedTech(BaseModel):
    name: str
    category: str  # Frontend, Backend, Database/ORM, Testing, Build/DevOps, Styling/UI, AI/ML, Tooling
    version: Optional[str] = None
    source_file: str
    description: Optional[str] = None

class TechnologyAnalysis(BaseModel):
    primary_language: str
    languages: List[LanguageStat]
    technologies: List[DetectedTech]
    category_counts: Dict[str, int]
    total_files: int
    total_directories: int
    total_bytes: int

# --- Module 3: Source Code & AST Analysis ---
class FunctionInfo(BaseModel):
    name: str
    line_number: int
    arguments: List[str] = []
    return_type: Optional[str] = None
    docstring: Optional[str] = None
    decorators: List[str] = []
    is_async: bool = False

class ClassInfo(BaseModel):
    name: str
    line_number: int
    base_classes: List[str] = []
    methods: List[FunctionInfo] = []
    docstring: Optional[str] = None

class ImportInfo(BaseModel):
    module: str
    imported_names: List[str] = []
    alias: Optional[str] = None
    is_internal: bool = False

class ParsedFileInfo(BaseModel):
    path: str
    language: str
    classes: List[ClassInfo] = []
    functions: List[FunctionInfo] = []
    imports: List[ImportInfo] = []
    exports: List[str] = []
    is_entry_point: bool = False
    entry_point_reason: Optional[str] = None
    loc: int = 0

class GraphNode(BaseModel):
    id: str
    label: str
    category: str  # Controller, Service, Model, Component, Util, Config
    language: Optional[str] = None
    functions_count: int = 0
    classes_count: int = 0

class GraphEdge(BaseModel):
    source: str
    target: str
    relationship: str = "imports"

class DependencyGraph(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]

# --- Module 4: AI Explanations ---
class AIProjectSummary(BaseModel):
    summary: str
    architecture_overview: str
    key_features: List[str] = []
    core_modules: List[Dict[str, str]] = []
    design_patterns: List[str] = []

class AIFileExplanation(BaseModel):
    file_path: str
    overview: str
    role_in_project: str
    functions_explained: List[Dict[str, str]] = []
    potential_improvements: List[str] = []

class AIChatRequest(BaseModel):
    question: str
    repo_context: Optional[Dict[str, Any]] = None
    gemini_api_key: Optional[str] = None
    chat_history: List[Dict[str, str]] = []

class AIChatResponse(BaseModel):
    answer: str
    referenced_files: List[str] = []

# --- Module 5: Setup Guide & Viva Prep ---
class SetupStep(BaseModel):
    title: str
    command: Optional[str] = None
    description: str

class SetupGuide(BaseModel):
    prerequisites: List[str]
    environment_variables: List[str] = []
    install_steps: List[SetupStep]
    run_steps: List[SetupStep]
    test_steps: List[SetupStep] = []

class VivaQuestion(BaseModel):
    id: int
    category: str  # Architecture, Implementation, Tech Choice, Performance/Security
    difficulty: str  # Basic, Intermediate, Advanced
    question: str
    answer_hint: str
    relevant_files: List[str] = []

# --- Complete Analysis Result Response ---
class FullRepoAnalysis(BaseModel):
    metadata: RepoMetadata
    files: List[FileItem]
    technology: TechnologyAnalysis
    parsed_code: List[ParsedFileInfo]
    dependency_graph: DependencyGraph
    setup_guide: SetupGuide
    viva_questions: List[VivaQuestion]
    ai_summary: Optional[AIProjectSummary] = None
