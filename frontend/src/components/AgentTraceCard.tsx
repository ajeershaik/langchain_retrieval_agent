import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  BrainCircuit,
  Zap,
  CheckCircle2,
  FileSearch,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { TraceStep, ChunkItem } from "../types";

interface AgentTraceCardProps {
  trace: TraceStep[];
  retrievedChunks?: ChunkItem[];
  latencyMs?: number;
  modelUsed?: string;
  onSelectChunk?: (chunk: ChunkItem) => void;
}

export const AgentTraceCard: React.FC<AgentTraceCardProps> = ({
  trace,
  retrievedChunks = [],
  latencyMs,
  modelUsed,
  onSelectChunk,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getStepIcon = (step: string) => {
    switch (step) {
      case "Observe":
        return <Eye className="w-4 h-4 text-sky-400" />;
      case "Decide":
        return <BrainCircuit className="w-4 h-4 text-purple-400" />;
      case "Act":
        return <Zap className="w-4 h-4 text-campus-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-amber-400" />;
    }
  };

  const getStepColor = (step: string) => {
    switch (step) {
      case "Observe":
        return "border-sky-500/30 bg-sky-500/5 text-sky-300";
      case "Decide":
        return "border-purple-500/30 bg-purple-500/5 text-purple-300";
      case "Act":
        return "border-campus-500/30 bg-campus-500/5 text-campus-300";
      default:
        return "border-slate-700 bg-slate-800/40 text-slate-300";
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden transition-all duration-200 shadow-sm">
      {/* Header bar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center space-x-2.5">
          <div className="flex -space-x-1.5 items-center">
            <span className="w-5 h-5 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-[10px] text-sky-300 font-bold">
              1
            </span>
            <span className="w-5 h-5 rounded-full bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-[10px] text-purple-300 font-bold">
              2
            </span>
            <span className="w-5 h-5 rounded-full bg-campus-500/20 border border-campus-400/40 flex items-center justify-center text-[10px] text-campus-300 font-bold">
              3
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-200">
            Agentic Execution Lifecycle
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            Observe • Decide • Act
          </span>
        </div>

        <div className="flex items-center space-x-3 text-xs text-slate-400">
          {latencyMs !== undefined && (
            <span className="font-mono text-[11px] text-slate-400">
              {latencyMs}ms
            </span>
          )}
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded Stages Body */}
      {isOpen && (
        <div className="px-3.5 pb-3.5 pt-1 space-y-3 border-t border-slate-800/60 animate-fade-in">
          {trace.map((stepItem, index) => (
            <div
              key={index}
              className={`rounded-lg border p-3 ${getStepColor(stepItem.step)}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2">
                  {getStepIcon(stepItem.step)}
                  <span className="text-xs font-bold uppercase tracking-wider">
                    [{stepItem.step}] {stepItem.title}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  Step {index + 1} of {trace.length}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {stepItem.description}
              </p>

              {/* Special details for Decide step: show retrieved chunks */}
              {stepItem.step === "Decide" && retrievedChunks.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-purple-500/20 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-purple-300 font-medium">
                    <span>Retrieved Knowledge Chunks:</span>
                    <span>k = {retrievedChunks.length}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {retrievedChunks.map((c) => (
                      <div
                        key={c.chunk_id}
                        onClick={() => onSelectChunk && onSelectChunk(c)}
                        className="p-2 rounded-md bg-slate-950/60 border border-purple-500/30 hover:border-purple-400 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono font-semibold text-purple-300">
                            {c.chunk_id}
                          </span>
                          {c.score !== undefined && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-200">
                              Sim: {(c.score * 100).toFixed(1)}%
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-semibold text-slate-200 mb-0.5">
                          {c.section}
                        </p>
                        <p className="text-[10px] text-slate-400 line-clamp-2">
                          {c.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Special details for Act step */}
              {stepItem.step === "Act" && (
                <div className="mt-2 text-[11px] flex items-center space-x-3 text-slate-400">
                  <span>Engine: {modelUsed || "Groq GPT-OSS"}</span>
                  <span>•</span>
                  <span>Strictly Grounded: Yes</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
