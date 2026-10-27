import { FullRepoAnalysis, AIFileExplanation, ParsedFileInfo } from '../types';

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const API_BASE = `${API_ORIGIN}/api`;

export async function analyzeRepository(
  url: string,
  githubToken?: string,
  geminiApiKey?: string
): Promise<FullRepoAnalysis> {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      github_token: githubToken?.trim() || undefined,
      gemini_api_key: geminiApiKey?.trim() || undefined,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Analysis failed with status ${res.status}`);
  }

  return res.json();
}

export async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  branch: string = 'main',
  token?: string
): Promise<string> {
  const params = new URLSearchParams({ owner, repo, path, branch });
  if (token) params.append('token', token);

  const res = await fetch(`${API_BASE}/analyze/file-content?${params.toString()}`);
  if (!res.ok) {
    throw new Error('Failed to load file content.');
  }

  const data = await res.json();
  return data.content;
}

export async function explainFile(
  filePath: string,
  codeContent: string,
  parsedInfo?: ParsedFileInfo,
  geminiApiKey?: string
): Promise<AIFileExplanation> {
  const res = await fetch(`${API_BASE}/ai/explain-file`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file_path: filePath,
      code_content: codeContent,
      parsed_info: parsedInfo,
      gemini_api_key: geminiApiKey?.trim() || undefined,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to explain file.');
  }

  return res.json();
}

export async function sendChatMessage(
  question: string,
  repoContext: FullRepoAnalysis,
  geminiApiKey?: string,
  chatHistory: Array<{ role: string; content: string }> = []
): Promise<{ answer: string; referenced_files: string[] }> {
  const res = await fetch(`${API_BASE}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      repo_context: repoContext,
      gemini_api_key: geminiApiKey?.trim() || undefined,
      chat_history: chatHistory,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to get AI response.');
  }

  return res.json();
}

export async function exportReport(
  type: 'markdown' | 'html',
  analysis: FullRepoAnalysis
): Promise<string> {
  const res = await fetch(`${API_BASE}/export/${type}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(analysis),
  });

  if (!res.ok) {
    throw new Error(`Failed to generate ${type} report.`);
  }

  return res.text();
}
