import React, { useState } from "react";
import {
  X,
  Layers,
  Search,
  CheckCircle2,
  FileText,
  Copy,
  Check,
  Tag,
  Hash,
} from "lucide-react";
import { ChunkItem } from "../types";

interface ChunkDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  allChunks: ChunkItem[];
  activeCitations: ChunkItem[];
  highlightedChunkId?: string | null;
}

export const ChunkDrawer: React.FC<ChunkDrawerProps> = ({
  isOpen,
  onClose,
  allChunks,
  activeCitations,
  highlightedChunkId,
}) => {
  const [activeTab, setActiveTab] = useState<"citations" | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentList = activeTab === "citations" ? activeCitations : allChunks;
  const filteredChunks = currentList.filter(
    (c) =>
      c.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.chunk_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getSectionBadgeClass = (section: string) => {
    switch (section) {
      case "Attendance Policy":
        return "bg-campus-500/10 text-campus-400 border-campus-500/30";
      case "Examination Rules":
        return "bg-sky-500/10 text-sky-400 border-sky-500/30";
      case "Library Rules":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "Hostel Rules":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      case "Fee Payment":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      default:
        return "bg-slate-700/50 text-slate-300 border-slate-600";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-lg bg-navy-900 border-l border-slate-800 shadow-2xl flex flex-col h-full z-10 animate-fade-in">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center">
              <Layers className="w-4 h-4 text-accent-cyan" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-none">
                Vector Knowledge Chunks
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Chroma Vector Store Document Splits
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs: Active Citations vs All Chunks */}
        <div className="px-4 pt-3 flex space-x-2 border-b border-slate-800">
          <button
            onClick={() => setActiveTab("all")}
            className={`pb-2 text-xs font-semibold px-2 border-b-2 transition-colors ${
              activeTab === "all"
                ? "border-campus-400 text-campus-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            All Vector Chunks ({allChunks.length})
          </button>

          {activeCitations.length > 0 && (
            <button
              onClick={() => setActiveTab("citations")}
              className={`pb-2 text-xs font-semibold px-2 border-b-2 transition-colors ${
                activeTab === "citations"
                  ? "border-accent-cyan text-accent-cyan"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Latest Query Matches ({activeCitations.length})
            </button>
          )}
        </div>

        {/* Search inside chunks */}
        <div className="p-4 border-b border-slate-800/80">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by keyword, rule, or section..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-campus-500/70"
            />
          </div>
        </div>

        {/* Chunk Cards Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredChunks.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No matching chunks found.
            </div>
          ) : (
            filteredChunks.map((chunk) => {
              const isTargeted = highlightedChunkId === chunk.chunk_id;
              return (
                <div
                  key={chunk.chunk_id}
                  className={`p-3.5 rounded-xl border transition-all duration-200 ${
                    isTargeted
                      ? "bg-campus-500/10 border-campus-500/50 shadow-md ring-1 ring-campus-500/30"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-300">
                        {chunk.chunk_id}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getSectionBadgeClass(
                          chunk.section
                        )}`}
                      >
                        {chunk.section}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {chunk.score !== undefined && (
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Score: {(chunk.score * 100).toFixed(1)}%
                        </span>
                      )}
                      <button
                        onClick={() => handleCopy(chunk.chunk_id, chunk.content)}
                        className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                        title="Copy chunk text"
                      >
                        {copiedId === chunk.chunk_id ? (
                          <Check className="w-3.5 h-3.5 text-campus-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Card Content */}
                  <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                    {chunk.content}
                  </p>

                  {/* Footer metadata */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>Characters: {chunk.char_count}</span>
                    <span>Splitter: Recursive (300/50)</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
