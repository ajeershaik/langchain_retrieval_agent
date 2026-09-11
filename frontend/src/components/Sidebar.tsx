import React from "react";
import {
  FileText,
  CalendarCheck,
  BookOpen,
  Home,
  CreditCard,
  Sliders,
  HelpCircle,
  Building2,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { QuerySettings, SuggestionItem } from "../types";

interface SidebarProps {
  settings: QuerySettings;
  onUpdateSettings: (newSettings: Partial<QuerySettings>) => void;
  suggestions: SuggestionItem[];
  onSelectSuggestion: (query: string) => void;
  onOpenGuidelines: () => void;
  activeCategory: string | null;
  onSelectCategory: (cat: string | null) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  settings,
  onUpdateSettings,
  suggestions,
  onSelectSuggestion,
  onOpenGuidelines,
  activeCategory,
  onSelectCategory,
}) => {
  const categories = [
    {
      id: "Attendance Policy",
      label: "Attendance Policy",
      icon: CalendarCheck,
      color: "text-campus-400 bg-campus-500/10 border-campus-500/30",
      description: "75% minimum attendance, 65-75% medical condonation.",
    },
    {
      id: "Examination Rules",
      label: "Examination Rules",
      icon: FileText,
      color: "text-sky-400 bg-sky-500/10 border-sky-500/30",
      description: "Hall tickets, 25% absence bar, 7-day revaluation.",
    },
    {
      id: "Library Rules",
      label: "Library Rules",
      icon: BookOpen,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
      description: "8 AM - 8 PM, 3 books for 14 days, Rs. 2 overdue fine.",
    },
    {
      id: "Hostel Rules",
      label: "Hostel Rules",
      icon: Home,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
      description: "Curfew 9:30 PM weekdays / 10:30 PM weekends, mess policy.",
    },
    {
      id: "Fee Payment",
      label: "Fee Payment",
      icon: CreditCard,
      color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
      description: "15-day deadline, Rs. 500/week late fine, accounts desk.",
    },
  ];

  return (
    <aside className="w-80 border-r border-slate-800/80 bg-navy-900/60 flex flex-col h-full overflow-hidden flex-shrink-0">
      {/* Policy Categories Section */}
      <div className="p-4 border-b border-slate-800/80 flex-shrink-0">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
            <Building2 className="w-3.5 h-3.5 text-campus-400" />
            <span>Campus Policies</span>
          </h2>
          <button
            onClick={onOpenGuidelines}
            className="text-[11px] text-campus-400 hover:text-campus-300 font-medium transition-colors"
          >
            Full Doc
          </button>
        </div>

        <div className="space-y-1.5">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() =>
                  onSelectCategory(isSelected ? null : cat.id)
                }
                className={`w-full p-2.5 rounded-xl text-left border transition-all duration-150 flex items-start space-x-2.5 group ${
                  isSelected
                    ? "bg-slate-800/90 border-campus-500/40 shadow-sm"
                    : "bg-slate-900/40 border-slate-800/70 hover:bg-slate-800/50 hover:border-slate-700"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border ${cat.color}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors truncate">
                      {cat.label}
                    </span>
                    <ChevronRight
                      className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                        isSelected ? "rotate-90 text-campus-400" : ""
                      }`}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {cat.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Suggested Questions based on Guidelines */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center space-x-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-accent-cyan" />
            <span>Preset Questions</span>
          </h3>

          <div className="space-y-1.5">
            {suggestions
              .filter(
                (s) =>
                  !activeCategory ||
                  s.section.toLowerCase().includes(activeCategory.toLowerCase())
              )
              .slice(0, 5)
              .map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectSuggestion(item.query)}
                  className="w-full text-left p-2.5 rounded-lg bg-slate-900/40 hover:bg-slate-800/70 border border-slate-800/80 hover:border-accent-cyan/40 transition-all duration-150 group"
                >
                  <div className="flex items-center space-x-1.5 mb-1">
                    <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 group-hover:text-accent-cyan transition-colors">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 group-hover:text-white transition-colors leading-snug">
                    {item.query}
                  </p>
                </button>
              ))}
          </div>
        </div>

        {/* Retrieval Parameters & Agent Settings */}
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            <span>Retrieval Configuration</span>
          </div>

          {/* Top-K Slider */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
              <span>Top-K Chunks (k):</span>
              <span className="font-mono font-bold text-purple-400">
                {settings.top_k}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={settings.top_k}
              onChange={(e) =>
                onUpdateSettings({ top_k: parseInt(e.target.value) })
              }
              className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>1 (Precise)</span>
              <span>5 (Broad)</span>
            </div>
          </div>

          {/* Temperature Slider */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
              <span>Temperature:</span>
              <span className="font-mono font-bold text-campus-400">
                {settings.temperature}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.temperature}
              onChange={(e) =>
                onUpdateSettings({ temperature: parseFloat(e.target.value) })
              }
              className="w-full accent-campus-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>0 (Deterministic)</span>
              <span>1 (Creative)</span>
            </div>
          </div>

          {/* Strict Grounding Badge */}
          <div className="pt-2 border-t border-slate-800 flex items-center space-x-2 text-[11px] text-campus-400">
            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Strict Guidelines Grounding Enforced</span>
          </div>
        </div>
      </div>

      {/* Footer Institution Info */}
      <div className="p-3 border-t border-slate-800/80 bg-navy-950/60 text-center text-[10px] text-slate-500 flex-shrink-0">
        Sri Vasavi Engineering College (Autonomous)
        <br />
        Pedatadepalli, Tadepalligudem, AP
      </div>
    </aside>
  );
};
