import React, { useState } from 'react';
import { X, Download, FileText, Globe, Code, Copy, Check } from 'lucide-react';
import { FullRepoAnalysis } from '../types';
import { exportReport } from '../services/api';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: FullRepoAnalysis;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  analysis,
}) => {
  const [exportType, setExportType] = useState<'markdown' | 'html' | 'json'>('markdown');
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  React.useEffect(() => {
    if (isOpen) {
      loadExport(exportType);
    }
  }, [isOpen, exportType]);

  const loadExport = async (type: 'markdown' | 'html' | 'json') => {
    setLoading(true);
    try {
      if (type === 'json') {
        setContent(JSON.stringify(analysis, null, 2));
      } else {
        const text = await exportReport(type, analysis);
        setContent(text);
      }
    } catch (err) {
      setContent('Error generating export.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = exportType === 'markdown' ? 'md' : exportType === 'html' ? 'html' : 'json';
    const mime = exportType === 'html' ? 'text/html' : exportType === 'json' ? 'application/json' : 'text/markdown';
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${analysis.metadata.name}_analysis_report.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenPrintable = () => {
    if (exportType === 'html') {
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(content);
        win.document.close();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Export Repository Analysis Report</h3>
              <p className="text-xs text-slate-400">Download formatted reports for project submission & viva documentation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="px-6 pt-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex space-x-2">
            <button
              onClick={() => setExportType('markdown')}
              className={`flex items-center space-x-2 px-4 py-2 border-b-2 text-sm font-medium transition ${
                exportType === 'markdown'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Markdown (.md)</span>
            </button>
            <button
              onClick={() => setExportType('html')}
              className={`flex items-center space-x-2 px-4 py-2 border-b-2 text-sm font-medium transition ${
                exportType === 'html'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Printable HTML / PDF</span>
            </button>
            <button
              onClick={() => setExportType('json')}
              className={`flex items-center space-x-2 px-4 py-2 border-b-2 text-sm font-medium transition ${
                exportType === 'json'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-4 h-4" />
              <span>Raw JSON Data</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 pb-2">
            {exportType === 'html' && (
              <button
                onClick={handleOpenPrintable}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition flex items-center space-x-1"
              >
                <span>🖨️ Open in New Tab to Print</span>
              </button>
            )}
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center space-x-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center space-x-1 shadow-md shadow-indigo-600/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>

        {/* Content Preview */}
        <div className="p-6 flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <span>Generating document preview...</span>
            </div>
          ) : (
            <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto max-h-[50vh] whitespace-pre-wrap select-text">
              {content}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};
