import React, { useState } from 'react';
import {
  FileCode, Cpu, Layers, Sparkles, ChevronDown, ChevronUp,
  Terminal, ArrowRight, ExternalLink, ShieldCheck, Box, Loader2
} from 'lucide-react';
import { FullRepoAnalysis, ParsedFileInfo, AIFileExplanation } from '../types';
import { fetchFileContent, explainFile } from '../services/api';

interface CodeAnalysisTabProps {
  analysis: FullRepoAnalysis;
  geminiApiKey?: string;
  githubToken?: string;
}

export const CodeAnalysisTab: React.FC<CodeAnalysisTabProps> = ({
  analysis,
  geminiApiKey,
  githubToken,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});
  const [selectedExplanation, setSelectedExplanation] = useState<AIFileExplanation | null>(null);
  const [explainingPath, setExplainingPath] = useState<string | null>(null);

  const toggleExpand = (path: string) => {
    setExpandedFiles((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const filtered = analysis.parsed_code.filter((p) =>
    p.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.classes.some((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    p.functions.some((f) => f.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleExplain = async (file: ParsedFileInfo) => {
    setExplainingPath(file.path);
    try {
      const content = await fetchFileContent(
        analysis.metadata.owner,
        analysis.metadata.name,
        file.path,
        analysis.metadata.default_branch,
        githubToken
      );
      const res = await explainFile(file.path, content, file, geminiApiKey);
      setSelectedExplanation(res);
    } catch (err: any) {
      alert(err.message || 'Failed to explain code.');
    } finally {
      setExplainingPath(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <span>Static Code & AST Analysis</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Syntactic decomposition of classes, functions, decorators, imports, and entry points.
          </p>
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter by class, function, or file name..."
          className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-80"
        />
      </div>

      {/* AI Explanation Modal / Card (if active) */}
      {selectedExplanation && (
        <div className="p-6 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 shadow-2xl relative animate-fadeIn space-y-4">
          <button
            onClick={() => setSelectedExplanation(null)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg bg-slate-800"
          >
            ✕ Dismiss
          </button>

          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              AI Analysis: <span className="font-mono text-indigo-300">{selectedExplanation.file_path}</span>
            </h3>
          </div>

          <p className="text-sm text-slate-200 leading-relaxed">
            {selectedExplanation.overview}
          </p>

          <div className="text-xs text-slate-300">
            <span className="font-semibold text-indigo-400">Role in system: </span>
            <span>{selectedExplanation.role_in_project}</span>
          </div>

          {selectedExplanation.functions_explained?.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="text-xs font-bold text-slate-200">Key Functions Explained:</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedExplanation.functions_explained.map((f, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-1">
                    <span className="font-mono font-bold text-indigo-400">{f.name}()</span>
                    <p className="text-slate-300 text-xs leading-relaxed">{f.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedExplanation.potential_improvements?.length > 0 && (
            <div className="pt-2">
              <div className="text-xs font-bold text-amber-300">Recommendations & Improvements:</div>
              <ul className="mt-1 space-y-1 text-xs text-slate-300">
                {selectedExplanation.potential_improvements.map((rec, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Files List Accordion */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-slate-900 rounded-2xl border border-slate-800 text-xs">
            No parsed files match your query.
          </div>
        ) : (
          filtered.map((file) => {
            const isExpanded = expandedFiles[file.path] !== false; // Default expanded
            const isExplaining = explainingPath === file.path;

            return (
              <div
                key={file.path}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all"
              >
                {/* Header */}
                <div className="p-4 bg-slate-950/60 flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0 pr-3">
                    <button
                      onClick={() => toggleExpand(file.path)}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <FileCode className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span className="font-mono text-sm font-bold text-white truncate">
                      {file.path}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                      {file.language} • {file.loc} LOC
                    </span>
                    {file.is_entry_point && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center space-x-1">
                        <Terminal className="w-3 h-3" />
                        <span>Entry Point</span>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleExplain(file)}
                    disabled={isExplaining}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition flex items-center space-x-1.5 flex-shrink-0"
                  >
                    {isExplaining ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Explain with AI</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-5 space-y-4 text-xs">
                    {file.entry_point_reason && (
                      <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-300 text-xs flex items-center space-x-2">
                        <Terminal className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <span><strong>Entry Point Reason:</strong> {file.entry_point_reason}</span>
                      </div>
                    )}

                    {/* Classes */}
                    {file.classes.length > 0 && (
                      <div className="space-y-2">
                        <div className="font-semibold text-slate-300 flex items-center space-x-1.5">
                          <Box className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Classes ({file.classes.length}):</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {file.classes.map((cls, idx) => (
                            <div key={idx} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="font-mono font-bold text-indigo-300">class {cls.name}</span>
                                <span className="text-[10px] text-slate-500">Line {cls.line_number}</span>
                              </div>
                              {cls.base_classes?.length > 0 && (
                                <div className="text-[11px] text-slate-400">
                                  Inherits: <span className="font-mono text-slate-300">{cls.base_classes.join(', ')}</span>
                                </div>
                              )}
                              {cls.docstring && (
                                <p className="text-[11px] text-slate-400 italic line-clamp-2">{cls.docstring}</p>
                              )}
                              {cls.methods.length > 0 && (
                                <div className="text-[11px] text-slate-400 pt-1">
                                  Methods: {cls.methods.map((m) => m.name).join(', ')}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Functions */}
                    {file.functions.length > 0 && (
                      <div className="space-y-2">
                        <div className="font-semibold text-slate-300 flex items-center space-x-1.5">
                          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Functions & Methods ({file.functions.length}):</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {file.functions.map((fn, idx) => (
                            <div key={idx} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-mono font-bold text-emerald-300 truncate">
                                  {fn.name}()
                                </span>
                                <span className="text-[10px] text-slate-500">L{fn.line_number}</span>
                              </div>
                              {fn.decorators.length > 0 && (
                                <div className="text-[10px] font-mono text-indigo-400">
                                  {fn.decorators.join(', ')}
                                </div>
                              )}
                              <div className="text-[11px] text-slate-400 font-mono truncate">
                                Args: ({fn.arguments.join(', ')})
                              </div>
                              {fn.return_type && (
                                <div className="text-[10px] text-slate-500 font-mono">
                                  Returns: {fn.return_type}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Imports */}
                    {file.imports.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="font-semibold text-slate-400 text-[11px]">
                          Imports ({file.imports.length}):
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {file.imports.map((imp, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-0.5 rounded-md font-mono text-[10px] ${
                                imp.is_internal
                                  ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {imp.module}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
