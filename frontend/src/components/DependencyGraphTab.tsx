import React, { useState, useMemo } from 'react';
import { Network, Layers, Info, Filter, ArrowRight, Box } from 'lucide-react';
import { FullRepoAnalysis, GraphNode, GraphEdge } from '../types';

interface DependencyGraphTabProps {
  analysis: FullRepoAnalysis;
}

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'Controller / Route': { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
  'Service / Logic': { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
  'Model / Schema': { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  'Component / UI': { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
  'Utility / Helper': { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400' },
  'Configuration': { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' },
  'Module': { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400' },
};

export const DependencyGraphTab: React.FC<DependencyGraphTabProps> = ({ analysis }) => {
  const { dependency_graph } = analysis;
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    dependency_graph.nodes[0]?.id || null
  );
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const selectedNode = dependency_graph.nodes.find((n) => n.id === selectedNodeId);

  // Incoming and outgoing edges for selected node
  const outgoingEdges = dependency_graph.edges.filter((e) => e.source === selectedNodeId);
  const incomingEdges = dependency_graph.edges.filter((e) => e.target === selectedNodeId);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    if (filterCategory === 'all') return dependency_graph.nodes;
    return dependency_graph.nodes.filter((n) => n.category === filterCategory);
  }, [dependency_graph.nodes, filterCategory]);

  const categories = Array.from(new Set(dependency_graph.nodes.map((n) => n.category)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Network className="w-5 h-5 text-indigo-400" />
            <span>Architecture & Module Relationships</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Visual graph mapping cross-module dependencies, import relationships, and architectural layers.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Layers ({dependency_graph.nodes.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Interactive Graph Nodes & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Nodes Grid Canvas */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs text-slate-400">
            <span>Select any module to inspect its dependency connections</span>
            <span className="font-mono">{dependency_graph.edges.length} total import links mapped</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-4 overflow-y-auto max-h-[550px] pr-1">
            {filteredNodes.map((node) => {
              const isSelected = selectedNodeId === node.id;
              const styling = CATEGORY_COLORS[node.category] || CATEGORY_COLORS['Module'];

              return (
                <button
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`p-4 rounded-xl text-left border transition-all ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-500/20'
                      : `${styling.bg} ${styling.border} hover:border-slate-600`
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${styling.text}`}>
                      {node.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {node.language}
                    </span>
                  </div>

                  <div className="text-xs font-mono font-bold text-white truncate" title={node.label}>
                    {node.label}
                  </div>

                  <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
                    <span>{node.functions_count} fns</span>
                    <span>{node.classes_count} classes</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Module Inspector Sidebar */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col space-y-4">
          <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm">
            <Info className="w-4 h-4" />
            <span>Module Inspector</span>
          </div>

          {selectedNode ? (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                  {selectedNode.category}
                </span>
                <div className="font-mono text-sm font-bold text-white break-all">
                  {selectedNode.id}
                </div>
                <div className="text-slate-400 flex items-center justify-between pt-1 text-[11px]">
                  <span>Language: {selectedNode.language || 'Unknown'}</span>
                  <span>{selectedNode.functions_count} Functions</span>
                </div>
              </div>

              {/* Outgoing Imports (Files this module depends on) */}
              <div className="space-y-2">
                <div className="font-semibold text-slate-300 flex items-center justify-between">
                  <span>Depends on / Imports ({outgoingEdges.length}):</span>
                </div>
                {outgoingEdges.length === 0 ? (
                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-slate-500 text-xs">
                    No internal project imports in this file.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {outgoingEdges.map((e, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedNodeId(e.target)}
                        className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/50 cursor-pointer flex items-center justify-between transition"
                      >
                        <span className="font-mono text-indigo-300 truncate pr-2">{e.target}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Incoming Imports (Files that depend on this module) */}
              <div className="space-y-2 pt-2">
                <div className="font-semibold text-slate-300 flex items-center justify-between">
                  <span>Imported by ({incomingEdges.length}):</span>
                </div>
                {incomingEdges.length === 0 ? (
                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-slate-500 text-xs">
                    No other analyzed modules directly import this file.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {incomingEdges.map((e, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedNodeId(e.source)}
                        className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500/50 cursor-pointer flex items-center justify-between transition"
                      >
                        <span className="font-mono text-emerald-300 truncate pr-2">{e.source}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              Select a module from the canvas to see its architectural relationships.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
