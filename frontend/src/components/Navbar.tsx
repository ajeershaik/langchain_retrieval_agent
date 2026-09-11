import React from "react";
import {
  Upload,
  FileText,
  GraduationCap,
  Database,
  Cpu,
  BookOpen,
  Layers,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { StatusResponse } from "../types";

interface NavbarProps {
  status: StatusResponse | null;
  onOpenGuidelines: () => void;
  onOpenUpload: () => void;
  onOpenChunks: () => void;
  onClearHistory: () => void;
  hasMessages: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  status,
  onOpenGuidelines,
  onOpenUpload,
  onOpenChunks,
  onClearHistory,
  hasMessages,
}) => {
  const isOnline = status?.status === "online";

  return (
    <header className="h-16 border-b border-slate-800/80 bg-navy-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-30 flex-shrink-0">
      {/* Brand & Institution */}
      <div className="flex items-center space-x-3.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-campus-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-campus-500/20 ring-1 ring-white/20">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight leading-none">
              Campus Retrieval Agent
            </h1>
            <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-campus-500/10 text-campus-400 border border-campus-500/20">
              SVEC
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-tight mt-0.5">
            Sri Vasavi Engineering College • Academic Guidelines RAG
          </p>
        </div>
      </div>

      {/* System Status Indicators */}
      <div className="hidden md:flex items-center space-x-3">
        {/* Vector DB Badge */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs">
          <Database className="w-3.5 h-3.5 text-accent-cyan" />
          <span className="text-slate-300">Vector Index:</span>
          <span className="font-semibold text-accent-cyan">
            {status?.chunks_indexed ?? 8} Chunks
          </span>
        </div>

        {/* Model Badge */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs">
          <Cpu className="w-3.5 h-3.5 text-accent-emerald" />
          <span className="text-slate-300">LLM:</span>
          <span className="font-mono text-xs font-semibold text-emerald-400">
            {status?.active_model || "openai/gpt-oss-20b"}
          </span>
        </div>

        {/* Live Indicator */}
        <div
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            isOnline
              ? "bg-campus-500/10 text-campus-400 border-campus-500/30"
              : "bg-rose-500/10 text-rose-400 border-rose-500/30"
          }`}
        >
          {isOnline ? (
            <>
              <span className="w-2 h-2 rounded-full bg-campus-400 animate-pulse"></span>
              <span>Online</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3 h-3 text-rose-400" />
              <span>Connecting</span>
            </>
          )}
        </div>
      </div>

      {/* Quick Action Navigation */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onOpenGuidelines}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 transition-colors shadow-sm"
          title="View full official college guidelines document"
        >
          <BookOpen className="w-3.5 h-3.5 text-campus-400" />
          <span className="hidden sm:inline">Official Guidelines</span>
        </button>

        <button
          onClick={onOpenChunks}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 transition-colors shadow-sm"
          title="Inspect indexed vector store chunks"
        >
          <Layers className="w-3.5 h-3.5 text-accent-cyan" />
          <span className="hidden sm:inline">Vector Chunks</span>
        </button>

        {/* Upload Document Button */}
        <button
          onClick={onOpenUpload}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 transition-colors shadow-sm"
          title="Upload a new document"
        >
          <Upload className="w-3.5 h-3.5 text-campus-400" />
          <span className="hidden sm:inline">Upload Document</span>
        </button>
        {/* Active Document Badge */}
        {status && (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-200">
            <FileText className="w-3.5 h-3.5 text-campus-400" />
            <span>{status.active_document?.name || status.active_document?.type}</span>
          </div>
        )}

        {hasMessages && (
          <button
            onClick={onClearHistory}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
