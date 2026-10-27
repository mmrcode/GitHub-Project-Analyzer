import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles, Send, Bot, User, FileCode, Loader2, Lightbulb, ExternalLink
} from 'lucide-react';
import { FullRepoAnalysis } from '../types';
import { sendChatMessage } from '../services/api';

interface AIChatTabProps {
  analysis: FullRepoAnalysis;
  geminiApiKey?: string;
  onSelectFile?: (path: string) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  referenced_files?: string[];
}

const QUICK_PROMPTS = [
  'Explain the overall system architecture and data flow.',
  'Where is data validated or processed in this codebase?',
  'What are the key classes and functions in the primary module?',
  'How are external dependencies integrated into the workflow?',
  'What potential edge cases or bottlenecks exist in this project?',
];

export const AIChatTab: React.FC<AIChatTabProps> = ({
  analysis,
  geminiApiKey,
  onSelectFile,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I am your AI repository assistant powered by **Google Gemini**. I have statically analyzed **${analysis.metadata.full_name}** (${analysis.technology.primary_language}). You can ask me any technical question about this codebase, architectural decisions, or function implementations!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (questionText?: string) => {
    const q = (questionText || input).trim();
    if (!q || loading) return;

    const userMsg: Message = { role: 'user', content: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const chatHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await sendChatMessage(q, analysis, geminiApiKey, chatHistory);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.answer,
          referenced_files: res.referenced_files,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Failed to get AI response: ${err.message || 'Please verify your Google Gemini API key.'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col h-[720px] overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-500 text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white">Interactive Repository Assistant</h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Google Gemini Free Tier
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Grounded in {analysis.technology.total_files} files & {analysis.parsed_code.length} AST source modules
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-400 hidden sm:block">
          Cites specific file paths & verifies code context
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg, idx) => {
          const isAssistant = msg.role === 'assistant';
          return (
            <div
              key={idx}
              className={`flex items-start space-x-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}
            >
              {isAssistant && (
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  isAssistant
                    ? 'bg-slate-950 border border-slate-800 text-slate-200'
                    : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                }`}
              >
                <div className="whitespace-pre-wrap select-text">{msg.content}</div>

                {/* Referenced files pills */}
                {msg.referenced_files && msg.referenced_files.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                      <FileCode className="w-3 h-3 text-indigo-400" />
                      <span>Referenced files:</span>
                    </span>
                    {msg.referenced_files.map((rf, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 font-mono text-[10px] text-indigo-300"
                      >
                        {rf}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {!isAssistant && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 flex-shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Gemini is thinking and reviewing codebase context...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center space-x-2 overflow-x-auto text-xs">
        <Lightbulb className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
        <span className="text-[11px] text-slate-500 flex-shrink-0">Suggestions:</span>
        {QUICK_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 hover:text-white hover:border-indigo-500/40 whitespace-nowrap transition flex-shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-4 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Ask a technical question about this repository..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/20 disabled:opacity-50 transition flex items-center space-x-1"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
