export interface RepoMetadata {
  owner: string;
  name: string;
  full_name: string;
  description?: string;
  default_branch: string;
  stars: number;
  forks: number;
  open_issues: number;
  license?: string;
  topics: string[];
  created_at?: string;
  updated_at?: string;
  size_kb: number;
  html_url: string;
  avatar_url?: string;
  has_readme: boolean;
  readme_content?: string;
}

export interface FileItem {
  path: string;
  name: string;
  type: 'blob' | 'tree';
  size: number;
  category: 'source' | 'test' | 'doc' | 'config' | 'build' | 'asset' | 'directory' | 'other';
  language?: string;
  extension: string;
}

export interface LanguageStat {
  name: string;
  file_count: number;
  total_bytes: number;
  percentage: number;
}

export interface DetectedTech {
  name: string;
  category: string;
  version?: string;
  source_file: string;
  description?: string;
}

export interface TechnologyAnalysis {
  primary_language: string;
  languages: LanguageStat[];
  technologies: DetectedTech[];
  category_counts: Record<string, number>;
  total_files: number;
  total_directories: number;
  total_bytes: number;
}

export interface FunctionInfo {
  name: string;
  line_number: number;
  arguments: string[];
  return_type?: string;
  docstring?: string;
  decorators: string[];
  is_async: boolean;
}

export interface ClassInfo {
  name: string;
  line_number: number;
  base_classes: string[];
  methods: FunctionInfo[];
  docstring?: string;
}

export interface ImportInfo {
  module: string;
  imported_names: string[];
  alias?: string;
  is_internal: boolean;
}

export interface ParsedFileInfo {
  path: string;
  language: string;
  classes: ClassInfo[];
  functions: FunctionInfo[];
  imports: ImportInfo[];
  exports: string[];
  is_entry_point: boolean;
  entry_point_reason?: string;
  loc: number;
}

export interface GraphNode {
  id: string;
  label: string;
  category: string;
  language?: string;
  functions_count: number;
  classes_count: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  relationship: string;
}

export interface DependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface AIProjectSummary {
  summary: string;
  architecture_overview: string;
  key_features: string[];
  core_modules: Array<{ name: string; responsibility: string }>;
  design_patterns: string[];
}

export interface AIFileExplanation {
  file_path: string;
  overview: string;
  role_in_project: string;
  functions_explained: Array<{ name: string; explanation: string }>;
  potential_improvements: string[];
}

export interface SetupStep {
  title: string;
  command?: string;
  description: string;
}

export interface SetupGuide {
  prerequisites: string[];
  environment_variables: string[];
  install_steps: SetupStep[];
  run_steps: SetupStep[];
  test_steps: SetupStep[];
}

export interface VivaQuestion {
  id: number;
  category: string;
  difficulty: 'Basic' | 'Intermediate' | 'Advanced';
  question: string;
  answer_hint: string;
  relevant_files: string[];
}

export interface FullRepoAnalysis {
  metadata: RepoMetadata;
  files: FileItem[];
  technology: TechnologyAnalysis;
  parsed_code: ParsedFileInfo[];
  dependency_graph: DependencyGraph;
  setup_guide: SetupGuide;
  viva_questions: VivaQuestion[];
  ai_summary?: AIProjectSummary;
}

export interface UserConfig {
  geminiApiKey: string;
  githubToken: string;
}
