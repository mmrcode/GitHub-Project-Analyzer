import React, { useState } from 'react';
import { X, Key, Sparkles, ExternalLink, ShieldCheck, Check } from 'lucide-react';
import { UserConfig } from '../types';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: UserConfig;
  onSaveConfig: (config: UserConfig) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [geminiKey, setGeminiKey] = useState(config.geminiApiKey || '');
  const [githubToken, setGithubToken] = useState(config.githubToken || '');
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      geminiApiKey: geminiKey.trim(),
      githubToken: githubToken.trim(),
    });
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">API Keys & Settings</h3>
            <p className="text-xs text-slate-400">
              Configure your Google Gemini and GitHub credentials
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Gemini API Key */}
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-200 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Google Free Gemini API Key</span>
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
              >
                <span>Get Free Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-xs text-slate-400">
              Google provides free API access for Gemini models (`gemini-2.0-flash` / `gemini-1.5-flash`). Log in with your standard Google account to generate a key.
            </p>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          {/* GitHub Token */}
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-200 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>GitHub Personal Access Token (Optional)</span>
              </label>
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
              >
                <span>Generate Token</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-xs text-slate-400">
              Increases GitHub rate limit from 60 to 5,000 requests per hour. No special permissions needed for public repositories.
            </p>
            <input
              type="password"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              placeholder="ghp_..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition flex items-center space-x-1.5"
            >
              {savedNotice ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Credentials</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
