import React, { useState } from 'react';
import {
  Star, GitFork, AlertCircle, FileCode, Folder, Database,
  Layers, Sparkles, BookOpen, ChevronDown, ChevronUp, ExternalLink, Shield
} from 'lucide-react';
import { FullRepoAnalysis } from '../types';

interface OverviewTabProps {
  analysis: FullRepoAnalysis;
  onSelectTab: (tabId: string) => void;
}

const LANGUAGE_COLORS: Record<string, string> = {
  Python: '#3572A5',
  TypeScript: '#3178c6',
  'TypeScript (React)': '#2b7489',
  JavaScript: '#f1e05a',
  'JavaScript (React)': '#f1e05a',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Go: '#00ADD8',
  Rust: '#dea584',
};

export const OverviewTab: React.FC<OverviewTabProps> = ({ analysis, onSelectTab }) => {
  const [showReadme, setShowReadme] = useState(false);
  const { metadata, technology, ai_summary, parsed_code } = analysis;

  return (
    <div className="space-y-6">
      {/* Repository Hero Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            {metadata.avatar_url && (
              <img
                src={metadata.avatar_url}
                alt={metadata.owner}
                className="w-14 h-14 rounded-2xl border-2 border-indigo-500/30 shadow-md"
              />
            )}
            <div>
              <div className="flex items-center space-x-3 flex-wrap">
                <h2 className="text-2xl font-black text-white">{metadata.full_name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {technology.primary_language}
                </span>
                {metadata.license && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 flex items-center space-x-1">
                    <Shield className="w-3 h-3 text-slate-400" />
                    <span>{metadata.license}</span>
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-sm text-slate-300 max-w-3xl">
                {metadata.description || 'No description provided by repository owner.'}
              </p>
            </div>
          </div>

          <a
            href={metadata.html_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition self-start md:self-center"
          >
            <span>Open on GitHub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/60 flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Star className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base font-bold text-white">{metadata.stars.toLocaleString()}</div>
              <div className="text-xs text-slate-400">GitHub Stars</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/60 flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <GitFork className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base font-bold text-white">{metadata.forks.toLocaleString()}</div>
              <div className="text-xs text-slate-400">Forks</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/60 flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base font-bold text-white">{technology.total_files.toLocaleString()}</div>
              <div className="text-xs text-slate-400">Files ({Math.round(technology.total_bytes / 1024)} KB)</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/60 flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base font-bold text-white">{parsed_code.length}</div>
              <div className="text-xs text-slate-400">AST Parsed Modules</div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Architecture & Executive Summary */}
      {ai_summary && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 text-indigo-400">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">AI Architecture Overview & Insights</h3>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Gemini Powered
            </span>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            {ai_summary.summary}
          </p>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
              System Architecture & Separation of Concerns
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {ai_summary.architecture_overview}
            </p>
          </div>

          {/* Key Implemented Features & Design Patterns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {ai_summary.key_features?.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-2">
                <div className="text-xs font-bold text-slate-200">Key Features Implemented</div>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {ai_summary.key_features.map((feat, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-indigo-400 font-bold">•</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {ai_summary.design_patterns?.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-2">
                <div className="text-xs font-bold text-slate-200">Observed Design Patterns</div>
                <div className="flex flex-wrap gap-1.5">
                  {ai_summary.design_patterns.map((pat, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                    >
                      {pat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Language Breakdown & Codebase Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Detected Tech Stack */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Database className="w-5 h-5 text-indigo-400" />
              <span>Detected Frameworks & Dependencies</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              {technology.technologies.length} components detected
            </span>
          </div>

          {technology.technologies.length === 0 ? (
            <p className="text-xs text-slate-400">No external dependencies declared in standard manifests.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {technology.technologies.map((tech, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-indigo-500/40 transition space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{tech.name}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {tech.category}
                    </span>
                  </div>
                  {tech.description && (
                    <p className="text-xs text-slate-400 line-clamp-2">{tech.description}</p>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Source: <code>{tech.source_file}</code></span>
                    {tech.version && (
                      <span className="text-indigo-400 font-mono">v{tech.version}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Languages */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <FileCode className="w-5 h-5 text-emerald-400" />
            <span>Languages</span>
          </h3>

          {/* Color Progress Bar */}
          <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden flex">
            {technology.languages.map((lang, idx) => (
              <div
                key={idx}
                style={{
                  width: `${lang.percentage}%`,
                  backgroundColor: LANGUAGE_COLORS[lang.name] || '#6366f1',
                }}
                title={`${lang.name}: ${lang.percentage}%`}
              />
            ))}
          </div>

          {/* Language List */}
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {technology.languages.map((lang, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: LANGUAGE_COLORS[lang.name] || '#6366f1',
                    }}
                  />
                  <span className="text-slate-200 font-medium">{lang.name}</span>
                </div>
                <div className="flex items-center space-x-3 text-slate-400">
                  <span>{lang.file_count} files</span>
                  <span className="text-white font-bold">{lang.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* README Collapsible Preview */}
      {metadata.has_readme && metadata.readme_content && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowReadme(!showReadme)}
              className="flex items-center space-x-2 text-base font-bold text-white hover:text-indigo-300 transition"
            >
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <span>README.md Document</span>
              {showReadme ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <span className="text-xs text-slate-400">
              {showReadme ? 'Click to collapse' : 'Click to preview README'}
            </span>
          </div>

          {showReadme && (
            <div className="mt-4 p-5 rounded-xl bg-slate-950 border border-slate-800 max-h-[500px] overflow-y-auto text-xs font-mono text-slate-300 whitespace-pre-wrap select-text leading-relaxed">
              {metadata.readme_content}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
