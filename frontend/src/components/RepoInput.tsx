import React, { useState } from 'react';
import { Search, ArrowRight, Loader2, AlertCircle, Sparkles } from 'lucide-react';

interface RepoInputProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
  error: string | null;
}

const SAMPLE_REPOS = [
  { name: 'FastAPI', url: 'https://github.com/fastapi/fastapi', tag: 'Python • API' },
  { name: 'Flask', url: 'https://github.com/pallets/flask', tag: 'Python • Web' },
  { name: 'Express', url: 'https://github.com/expressjs/express', tag: 'Node.js' },
  { name: 'React', url: 'https://github.com/facebook/react', tag: 'Frontend' },
];

export const RepoInput: React.FC<RepoInputProps> = ({
  onAnalyze,
  isLoading,
  error,
}) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onAnalyze(url.trim());
    }
  };

  const handleSampleClick = (sampleUrl: string) => {
    setUrl(sampleUrl);
    onAnalyze(sampleUrl);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="text-center mb-8 space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>AI-Powered Static Source Code & Repository Analysis</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Understand any GitHub repository in seconds.
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          Static AST parsing, language metrics, dependency manifests, automated setup instructions, and Gemini AI viva examination prep.
        </p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto">
        <div className="relative flex items-center shadow-2xl rounded-2xl bg-slate-900/90 border border-slate-700/80 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
          <div className="pl-4 sm:pl-5 text-slate-400">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
            placeholder="Enter public GitHub repo URL or owner/repo (e.g. pallets/flask)"
            className="w-full bg-transparent px-3 sm:px-4 py-4 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none"
          />
          <div className="pr-2 sm:pr-3">
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <span>Analyze</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
            <div className="flex-1">
              <span className="font-semibold">Analysis Failed: </span>
              <span>{error}</span>
            </div>
          </div>
        )}
      </form>

      {/* Quick Samples */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs font-medium text-slate-500 mr-1">Quick Sample Repositories:</span>
        {SAMPLE_REPOS.map((sample) => (
          <button
            key={sample.name}
            onClick={() => handleSampleClick(sample.url)}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:border-indigo-500/50 hover:bg-slate-800/80 transition flex items-center space-x-1.5"
          >
            <span>{sample.name}</span>
            <span className="text-[10px] text-slate-500">({sample.tag})</span>
          </button>
        ))}
      </div>

      {/* Loading Steps Indicator */}
      {isLoading && (
        <div className="mt-8 p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 max-w-xl mx-auto space-y-3 animate-pulse">
          <div className="flex items-center space-x-3 text-indigo-400 text-sm font-semibold">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Conducting Static Source Code Analysis & Gemini AI Processing...</span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-400 pl-8">
            <p>✓ Validating URL and querying GitHub REST API</p>
            <p>✓ Inspecting recursive Git Tree and dependency manifests</p>
            <p>✓ Running static AST syntax analysis on source modules</p>
            <p>✓ Generating setup guide and MCA viva examination questions</p>
            <p>✓ Synthesizing architecture overview with Google Gemini</p>
          </div>
        </div>
      )}
    </div>
  );
};
