import React, { useState } from "react";
import {
  X,
  BookOpen,
  Copy,
  Check,
  Search,
  ExternalLink,
  GraduationCap,
} from "lucide-react";

interface GuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawText: string;
}

export const GuidelinesModal: React.FC<GuidelinesModalProps> = ({
  isOpen,
  onClose,
  rawText,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sections = [
    { title: "Examination Rules", tag: "Exams" },
    { title: "Attendance Policy", tag: "Attendance" },
    { title: "Library Rules", tag: "Library" },
    { title: "Hostel Rules", tag: "Hostel" },
    { title: "Fee Payment", tag: "Fees" },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-navy-950/80 backdrop-blur-md transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-navy-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh] animate-fade-in">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-navy-950/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-campus-500/10 border border-campus-500/30 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-campus-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-none">
                Sri Vasavi Engineering College
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Official Academic Guidelines & Student Regulations
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-campus-400" />
                  <span className="text-campus-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Text</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Section Navigation Quick Pills */}
        <div className="px-5 py-2.5 bg-slate-950/40 border-b border-slate-800 flex items-center space-x-2 overflow-x-auto text-xs">
          <span className="text-slate-500 font-semibold text-[11px] flex-shrink-0">
            Jump to:
          </span>
          {sections.map((sec, idx) => (
            <button
              key={idx}
              onClick={() => setSearchTerm(sec.title)}
              className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white text-[11px] transition-colors flex-shrink-0"
            >
              {sec.title}
            </button>
          ))}
        </div>

        {/* Search inside Document */}
        <div className="p-4 border-b border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search words in guidelines (e.g. 75%, condonation, curfew, late fee)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-campus-500"
            />
          </div>
        </div>

        {/* Document Content View */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800/90 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-text">
            {rawText || "Loading official guidelines..."}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-navy-950/60 flex items-center justify-between text-xs text-slate-500 px-6">
          <span>Source file: campus_guidelines.txt</span>
          <span>Indexed into 8 chunks in vector store</span>
        </div>
      </div>
    </div>
  );
};
