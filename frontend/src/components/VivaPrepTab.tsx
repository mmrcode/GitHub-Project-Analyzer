import React, { useState } from 'react';
import {
  GraduationCap, Terminal, Check, Copy, ChevronDown, ChevronUp,
  HelpCircle, Sparkles, Filter, CheckCircle2, Shield, AlertTriangle
} from 'lucide-react';
import { FullRepoAnalysis, VivaQuestion } from '../types';

interface VivaPrepTabProps {
  analysis: FullRepoAnalysis;
}

export const VivaPrepTab: React.FC<VivaPrepTabProps> = ({ analysis }) => {
  const [subTab, setSubTab] = useState<'viva' | 'setup'>('viva');
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  const { setup_guide, viva_questions } = analysis;

  const toggleAnswer = (id: number) => {
    setRevealedAnswers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const revealAll = () => {
    const allRevealed: Record<number, boolean> = {};
    viva_questions.forEach((q) => {
      allRevealed[q.id] = true;
    });
    setRevealedAnswers(allRevealed);
  };

  const hideAll = () => {
    setRevealedAnswers({});
  };

  const handleCopyCommand = (command: string, index: number) => {
    navigator.clipboard.writeText(command);
    setCopiedStep(index);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  // Filter Viva Questions
  const filteredQuestions = viva_questions.filter((q) => {
    const matchDiff = difficultyFilter === 'all' || q.difficulty.toLowerCase() === difficultyFilter.toLowerCase();
    const matchCat = categoryFilter === 'all' || q.category.toLowerCase().includes(categoryFilter.toLowerCase());
    return matchDiff && matchCat;
  });

  const categories = Array.from(new Set(viva_questions.map((q) => q.category)));

  return (
    <div className="space-y-6">
      {/* Sub-nav selector */}
      <div className="flex items-center space-x-3 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl w-fit">
        <button
          onClick={() => setSubTab('viva')}
          className={`flex items-center space-x-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            subTab === 'viva'
              ? 'bg-gradient-to-r from-indigo-600 to-emerald-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>MCA Viva Examination Prep</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-black/30">
            {viva_questions.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('setup')}
          className={`flex items-center space-x-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            subTab === 'setup'
              ? 'bg-gradient-to-r from-indigo-600 to-emerald-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Setup & Execution Guide</span>
        </button>
      </div>

      {/* SUB-TAB 1: VIVA PREP */}
      {subTab === 'viva' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-indigo-400" />
                <span>MCA Mini Project Viva & Defense Questions</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Technical questions tailored specifically to the technologies, classes, and architectural decisions in this repository.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Difficulty Filter */}
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Difficulties</option>
                <option value="basic">Basic</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>

              <button
                onClick={revealAll}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                Reveal All
              </button>
              <button
                onClick={hideAll}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                Study Mode
              </button>
            </div>
          </div>

          {/* Question Cards List */}
          <div className="space-y-4">
            {filteredQuestions.map((q) => {
              const isOpen = Boolean(revealedAnswers[q.id]);
              const diffBadge =
                q.difficulty === 'Basic'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : q.difficulty === 'Intermediate'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20';

              return (
                <div
                  key={q.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${diffBadge}`}>
                          {q.difficulty}
                        </span>
                        <span className="text-xs font-semibold text-indigo-400">
                          {q.category}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-white">
                        Q{q.id}. {q.question}
                      </h3>
                    </div>

                    <button
                      onClick={() => toggleAnswer(q.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center space-x-1.5 flex-shrink-0"
                    >
                      <span>{isOpen ? 'Hide Answer' : 'Reveal Answer'}</span>
                      {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Referenced Files */}
                  {q.relevant_files?.length > 0 && (
                    <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
                      <span>Relevant files:</span>
                      {q.relevant_files.map((rf, i) => (
                        <span key={i} className="font-mono text-slate-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                          {rf}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Model Answer Drawer */}
                  {isOpen && (
                    <div className="mt-3 p-4 rounded-xl bg-slate-950 border-l-4 border-l-indigo-500 border border-slate-800/80 space-y-1.5 animate-fadeIn">
                      <div className="text-xs font-bold text-indigo-300">Suggested Model Answer / Talking Points:</div>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                        {q.answer_hint}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: SETUP GUIDE */}
      {subTab === 'setup' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Terminal className="w-5 h-5 text-indigo-400" />
              <span>Automated Setup & Execution Instructions</span>
            </h2>
            <p className="text-xs text-slate-400">
              Synthesized prerequisites and startup commands based on declared package manifests and scripts.
            </p>
          </div>

          {/* Prerequisites */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>System Prerequisites</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {setup_guide.prerequisites.map((req, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>{req}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Installation Steps */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white">Installation & Environment Setup</h3>
            <div className="space-y-4">
              {setup_guide.install_steps.map((step, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300">{step.title}</span>
                    {step.command && (
                      <button
                        onClick={() => handleCopyCommand(step.command!, idx)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center space-x-1"
                      >
                        {copiedStep === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedStep === idx ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{step.description}</p>
                  {step.command && (
                    <pre className="p-3 rounded-lg bg-slate-900 text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre select-text">
                      {step.command}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Run Steps */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white">Execution & Startup Commands</h3>
            <div className="space-y-4">
              {setup_guide.run_steps.map((step, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400">{step.title}</span>
                    {step.command && (
                      <button
                        onClick={() => handleCopyCommand(step.command!, 100 + idx)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center space-x-1"
                      >
                        {copiedStep === 100 + idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedStep === 100 + idx ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{step.description}</p>
                  {step.command && (
                    <pre className="p-3 rounded-lg bg-slate-900 text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre select-text">
                      {step.command}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
