import React, { useState, useEffect } from 'react';
import {
  FileCode, Folder, Search, Filter, Copy, Check, Sparkles,
  ExternalLink, Loader2, ChevronRight, FileText, Settings, Wrench, Shield
} from 'lucide-react';
import { FullRepoAnalysis, FileItem, AIFileExplanation } from '../types';
import { fetchFileContent, explainFile } from '../services/api';

interface FileExplorerTabProps {
  analysis: FullRepoAnalysis;
  geminiApiKey?: string;
  githubToken?: string;
}

export const FileExplorerTab: React.FC<FileExplorerTabProps> = ({
  analysis,
  geminiApiKey,
  githubToken,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loadingContent, setLoadingContent] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // AI Explanation State
  const [explaining, setExplaining] = useState<boolean>(false);
  const [explanation, setExplanation] = useState<AIFileExplanation | null>(null);

  // Filter files
  const filteredFiles = analysis.files.filter((f) => {
    if (f.type === 'tree') return false; // Show files in explorer list
    const matchesCategory = categoryFilter === 'all' || f.category === categoryFilter;
    const matchesSearch = f.path.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Auto-select first source or readme file on load
  useEffect(() => {
    if (!selectedFile && filteredFiles.length > 0) {
      const defaultPick = filteredFiles.find(
        (f) => f.category === 'source' || f.name.toLowerCase().startsWith('readme')
      ) || filteredFiles[0];
      handleSelectFile(defaultPick);
    }
  }, [analysis]);

  const handleSelectFile = async (file: FileItem) => {
    setSelectedFile(file);
    setExplanation(null);
    setLoadingContent(true);
    try {
      const content = await fetchFileContent(
        analysis.metadata.owner,
        analysis.metadata.name,
        file.path,
        analysis.metadata.default_branch,
        githubToken
      );
      setFileContent(content);
    } catch (err) {
      setFileContent('// Could not load file content or file is binary/too large.');
    } finally {
      setLoadingContent(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExplainFile = async () => {
    if (!selectedFile || !fileContent) return;
    setExplaining(true);
    try {
      const parsed = analysis.parsed_code.find((p) => p.path === selectedFile.path);
      const res = await explainFile(selectedFile.path, fileContent, parsed, geminiApiKey);
      setExplanation(res);
    } catch (err: any) {
      alert(err.message || 'Failed to explain file.');
    } finally {
      setExplaining(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'source': return <FileCode className="w-4 h-4 text-indigo-400" />;
      case 'test': return <Shield className="w-4 h-4 text-emerald-400" />;
      case 'doc': return <FileText className="w-4 h-4 text-amber-400" />;
      case 'config': return <Settings className="w-4 h-4 text-sky-400" />;
      case 'build': return <Wrench className="w-4 h-4 text-purple-400" />;
      default: return <FileCode className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[700px]">
      {/* Left Column: File Tree / List */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col h-[700px] shadow-xl">
        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search files by path..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 mb-3 pb-2 border-b border-slate-800">
          {[
            { id: 'all', label: 'All' },
            { id: 'source', label: 'Source' },
            { id: 'test', label: 'Tests' },
            { id: 'config', label: 'Config' },
            { id: 'doc', label: 'Docs' },
            { id: 'build', label: 'Build' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                categoryFilter === cat.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {filteredFiles.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No files match the selected filter.
            </div>
          ) : (
            filteredFiles.map((file) => {
              const isSelected = selectedFile?.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => handleSelectFile(file)}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs transition ${
                    isSelected
                      ? 'bg-indigo-600/20 text-white border border-indigo-500/30'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                    {getCategoryIcon(file.category)}
                    <span className="truncate font-mono">{file.path}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 flex-shrink-0">
                    {Math.round(file.size / 1024) > 0 ? `${Math.round(file.size / 1024)} KB` : `${file.size} B`}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Code Viewer & AI Explainer */}
      <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[700px] shadow-xl overflow-hidden">
        {/* Code Header Bar */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0 pr-2">
            <FileCode className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span className="text-xs font-mono font-bold text-white truncate">
              {selectedFile?.path || 'Select a file'}
            </span>
            {selectedFile?.language && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                {selectedFile.language}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExplainFile}
              disabled={explaining || !selectedFile}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white shadow-md shadow-indigo-600/20 disabled:opacity-50 transition flex items-center space-x-1.5"
            >
              {explaining ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Explaining...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Explain File with AI</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopyCode}
              disabled={!fileContent}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              title="Copy code"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Code Content & AI Explanation Split */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* AI Explanation Drawer (if generated) */}
          {explanation && (
            <div className="p-4 bg-indigo-950/30 border-b border-indigo-500/20 max-h-60 overflow-y-auto space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-300">
                <span className="flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Gemini Explanation: {explanation.file_path}</span>
                </span>
                <button
                  onClick={() => setExplanation(null)}
                  className="text-slate-400 hover:text-white text-[11px]"
                >
                  ✕ Close
                </button>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed">
                {explanation.overview}
              </p>

              <div className="text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Role in project: </span>
                <span>{explanation.role_in_project}</span>
              </div>

              {explanation.functions_explained?.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-bold text-indigo-300">Key Functions:</div>
                  {explanation.functions_explained.map((f, i) => (
                    <div key={i} className="text-xs bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                      <span className="font-mono text-indigo-400 font-semibold">{f.name}: </span>
                      <span className="text-slate-300">{f.explanation}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Source Code View */}
          <div className="flex-1 p-4 bg-slate-950 overflow-auto font-mono text-xs select-text">
            {loadingContent ? (
              <div className="flex items-center justify-center h-full text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span>Loading source code...</span>
              </div>
            ) : (
              <pre className="text-slate-300 whitespace-pre leading-relaxed">
                {fileContent}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
