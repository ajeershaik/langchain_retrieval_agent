import React, { useState } from "react";
import {
  GraduationCap,
  User,
  Copy,
  Check,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
  ShieldCheck,
  AlertTriangle,
  Layers,
} from "lucide-react";
import { Message, ChunkItem } from "../types";
import { AgentTraceCard } from "./AgentTraceCard";

interface MessageItemProps {
  message: Message;
  onSelectChunk?: (chunk: ChunkItem) => void;
  onOpenChunksDrawer?: () => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  onSelectChunk,
  onOpenChunksDrawer,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if ("speechSynthesis" in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(message.content);
        utterance.rate = 1.0;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        setIsSpeaking(true);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  // Basic formatted markdown rendering (bold text, bullet points)
  const renderFormattedText = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      // Check bullet point
      const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("* ");
      const content = isBullet ? line.trim().substring(2) : line;

      // Replace **text** with bold tags
      const parts = content.split(/(\*\*.*?\*\*)/g);
      const renderedLine = parts.map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={pIdx} className="font-semibold text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      if (isBullet) {
        return (
          <li key={idx} className="ml-4 list-disc text-slate-200">
            {renderedLine}
          </li>
        );
      }

      return (
        <p key={idx} className={line.trim() === "" ? "h-2" : "text-slate-200 leading-relaxed"}>
          {renderedLine}
        </p>
      );
    });
  };

  if (isUser) {
    return (
      <div className="flex justify-end mb-4 animate-slide-up">
        <div className="flex items-start space-x-2.5 max-w-[85%] sm:max-w-[75%]">
          <div className="bg-campus-600/90 text-white rounded-2xl rounded-tr-none px-4 py-3 shadow-md border border-campus-500/30">
            <p className="text-sm font-medium leading-relaxed">{message.content}</p>
            <span className="text-[10px] text-campus-200/80 mt-1 block text-right">
              {message.timestamp}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
            <User className="w-4 h-4 text-slate-300" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-6 animate-slide-up">
      <div className="flex items-start space-x-3 max-w-[95%] sm:max-w-[85%]">
        {/* Agent Avatar */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-campus-500 to-emerald-700 flex items-center justify-center flex-shrink-0 shadow-md shadow-campus-500/20 ring-1 ring-campus-400/30 mt-0.5">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>

        {/* Message Card */}
        <div className="flex-1">
          <div className="glass-panel rounded-2xl rounded-tl-none p-4 sm:p-5 shadow-lg border border-slate-800/90">
            {/* Header / Grounding Badge */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-200">
                  SVEC Campus Agent
                </span>
                {message.grounded !== undefined && (
                  <span
                    className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      message.grounded
                        ? "bg-campus-500/10 text-campus-400 border-campus-500/30"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    }`}
                  >
                    {message.grounded ? (
                      <>
                        <ShieldCheck className="w-3 h-3" />
                        <span>Verified Guidelines</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3" />
                        <span>Not in Guidelines</span>
                      </>
                    )}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                {message.latency_ms && (
                  <span className="font-mono">{message.latency_ms}ms</span>
                )}
                <span>•</span>
                <span>{message.timestamp}</span>
              </div>
            </div>

            {/* Answer Body */}
            <div className="space-y-1 text-sm text-slate-200">
              {renderFormattedText(message.content)}
            </div>

            {/* 3-Stage Agentic Trace Component */}
            {message.trace && message.trace.length > 0 && (
              <AgentTraceCard
                trace={message.trace}
                retrievedChunks={message.retrieved_chunks}
                latencyMs={message.latency_ms}
                modelUsed={message.model_used}
                onSelectChunk={onSelectChunk}
              />
            )}

            {/* Action Toolbar */}
            <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center space-x-1">
                {/* Copy Button */}
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-md hover:bg-slate-800 hover:text-slate-200 transition-colors flex items-center space-x-1"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-campus-400" />
                      <span className="text-[11px] text-campus-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Copy</span>
                    </>
                  )}
                </button>

                {/* Speak Button */}
                {"speechSynthesis" in window && (
                  <button
                    onClick={handleSpeak}
                    className={`p-1.5 rounded-md hover:bg-slate-800 transition-colors flex items-center space-x-1 ${
                      isSpeaking ? "text-campus-400" : "hover:text-slate-200"
                    }`}
                    title={isSpeaking ? "Stop speaking" : "Listen to answer"}
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-campus-400 animate-pulse" />
                        <span className="text-[11px] text-campus-400">Stop</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Listen</span>
                      </>
                    )}
                  </button>
                )}

                {/* View Chunks */}
                {message.retrieved_chunks && message.retrieved_chunks.length > 0 && (
                  <button
                    onClick={onOpenChunksDrawer}
                    className="p-1.5 rounded-md hover:bg-slate-800 hover:text-accent-cyan transition-colors flex items-center space-x-1 text-slate-400"
                    title="Inspect retrieved chunks in Vector Drawer"
                  >
                    <Layers className="w-3.5 h-3.5 text-accent-cyan" />
                    <span className="text-[11px]">
                      {message.retrieved_chunks.length} Sources
                    </span>
                  </button>
                )}
              </div>

              {/* Feedback Buttons */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setFeedback(feedback === "up" ? null : "up")}
                  className={`p-1.5 rounded-md hover:bg-slate-800 transition-colors ${
                    feedback === "up" ? "text-campus-400" : "hover:text-slate-200"
                  }`}
                  title="Helpful response"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setFeedback(feedback === "down" ? null : "down")}
                  className={`p-1.5 rounded-md hover:bg-slate-800 transition-colors ${
                    feedback === "down" ? "text-rose-400" : "hover:text-slate-200"
                  }`}
                  title="Not helpful"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
