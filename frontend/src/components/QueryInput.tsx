import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, CornerDownLeft } from "lucide-react";

interface QueryInputProps {
  onSend: (query: string) => void;
  isLoading: boolean;
  quickPrompts?: string[];
}

export const QueryInput: React.FC<QueryInputProps> = ({
  onSend,
  isLoading,
  quickPrompts = [],
}) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-4 border-t border-slate-800/80 bg-navy-900/90 backdrop-blur-md flex-shrink-0">
      {/* Quick Prompts Bar */}
      {quickPrompts.length > 0 && !input && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-2.5 mb-2.5 scrollbar-none text-xs">
          <div className="flex items-center space-x-1 text-slate-400 flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-accent-cyan" />
            <span className="font-semibold text-[11px]">Try:</span>
          </div>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => onSend(prompt)}
              disabled={isLoading}
              className="px-3 py-1 rounded-full bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white transition-colors flex-shrink-0 text-xs truncate max-w-xs shadow-sm"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Box Form */}
      <form
        onSubmit={handleSubmit}
        className="relative flex items-end rounded-2xl border border-slate-700/80 bg-slate-950/80 focus-within:border-campus-500/70 focus-within:ring-2 focus-within:ring-campus-500/20 transition-all duration-200 shadow-inner"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about SVEC attendance, exams, library, hostel, or fees..."
          disabled={isLoading}
          rows={1}
          className="w-full bg-transparent px-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 resize-none focus:outline-none max-h-32 min-h-[48px]"
        />

        <div className="flex items-center space-x-2 pr-3 pb-2.5 flex-shrink-0">
          <div className="hidden sm:flex items-center space-x-1 text-[10px] text-slate-500 font-mono">
            <span>Press Enter</span>
            <CornerDownLeft className="w-3 h-3 text-slate-500" />
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 shadow-md ${
              input.trim() && !isLoading
                ? "bg-campus-500 hover:bg-campus-600 text-white shadow-campus-500/30 ring-1 ring-white/20 scale-100"
                : "bg-slate-800 text-slate-500 cursor-not-allowed scale-95"
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
