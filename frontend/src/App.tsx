import React, { useState, useEffect, useRef } from "react";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { MessageItem } from "./components/MessageItem";
import { QueryInput } from "./components/QueryInput";
import { ChunkDrawer } from "./components/ChunkDrawer";
import { GuidelinesModal } from "./components/GuidelinesModal";
import { UploadModal } from "./components/UploadModal";
import {
  Message,
  StatusResponse,
  ChunkItem,
  SuggestionItem,
  QuerySettings,
} from "./types";
import {
  fetchStatus,
  fetchGuidelines,
  fetchChunks,
  fetchSuggestions,
  sendQuery,
  UploadResponse,
} from "./api";
import {
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Cpu,
  Layers,
  HelpCircle,
  Clock,
} from "lucide-react";

export const App: React.FC = () => {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [guidelinesText, setGuidelinesText] = useState("");
  const [allChunks, setAllChunks] = useState<ChunkItem[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Settings
  const [settings, setSettings] = useState<QuerySettings>({
    top_k: 2,
    temperature: 0.0,
    model: "openai/gpt-oss-20b",
  });

  // Modal / Drawer states
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);
  const [isChunksDrawerOpen, setIsChunksDrawerOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [highlightedChunkId, setHighlightedChunkId] = useState<string | null>(null);
  const [activeCitations, setActiveCitations] = useState<ChunkItem[]>([]);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Initial Data Load
  useEffect(() => {
    loadInitialData();
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const loadInitialData = async () => {
    try {
      const [statusRes, guideRes, chunksRes, suggRes] = await Promise.all([
        fetchStatus().catch(() => null),
        fetchGuidelines().catch(() => null),
        fetchChunks().catch(() => ({ total: 0, chunks: [] })),
        fetchSuggestions().catch(() => []),
      ]);

      if (statusRes) setStatus(statusRes);
      if (guideRes) setGuidelinesText(guideRes.raw_text);
      if (chunksRes) setAllChunks(chunksRes.chunks);
      if (suggRes) setSuggestions(suggRes);
    } catch (err) {
      console.error("Failed to load initial data", err);
    }
  };

  const handleUpdateSettings = (newSettings: Partial<QuerySettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleSendMessage = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: queryText.trim(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const result = await sendQuery(queryText.trim(), settings);

      const assistantMsg: Message = {
        id: `asst-${Date.now()}`,
        role: "assistant",
        content: result.answer,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        retrieved_chunks: result.retrieved_chunks,
        trace: result.trace,
        latency_ms: result.latency_ms,
        grounded: result.grounded,
        model_used: result.model_used,
      };

      setActiveCitations(result.retrieved_chunks);
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `Error running agent: ${error.message || "Failed to retrieve information."}`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectChunk = (chunk: ChunkItem) => {
    setHighlightedChunkId(chunk.chunk_id);
    setIsChunksDrawerOpen(true);
  };

  const handleClearHistory = () => {
    setMessages([]);
    setActiveCitations([]);
  };

  const handleUploadSuccess = async (res: UploadResponse) => {
    // Refresh status, chunks, and suggestions after a new document is uploaded
    setSuggestions(res.suggestions);
    const [statusRes, chunksRes, guideRes] = await Promise.all([
      fetchStatus().catch(() => null),
      fetchChunks().catch(() => ({ total: 0, chunks: [] })),
      fetchGuidelines().catch(() => null),
    ]);
    if (statusRes) setStatus(statusRes);
    if (chunksRes) setAllChunks(chunksRes.chunks);
    if (guideRes) setGuidelinesText(guideRes.raw_text);

    // Add a system notice message in the chat
    const notice: Message = {
      id: `sys-${Date.now()}`,
      role: "assistant",
      content: `📄 **Document loaded**: \`${res.filename}\` (${res.file_type}, ${(res.file_size_bytes / 1024).toFixed(1)} KB)\n\n${res.chunks_count} chunks indexed. ${res.total_characters.toLocaleString()} characters extracted.\n\nYou can now ask questions about this document.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, notice]);
  };

  const handleResetSuccess = async () => {
    const [statusRes, chunksRes, guideRes, suggRes] = await Promise.all([
      fetchStatus().catch(() => null),
      fetchChunks().catch(() => ({ total: 0, chunks: [] })),
      fetchGuidelines().catch(() => null),
      fetchSuggestions().catch(() => []),
    ]);
    if (statusRes) setStatus(statusRes);
    if (chunksRes) setAllChunks(chunksRes.chunks);
    if (guideRes) setGuidelinesText(guideRes.raw_text);
    if (suggRes) setSuggestions(suggRes);

    const notice: Message = {
      id: `sys-${Date.now()}`,
      role: "assistant",
      content: "🏫 **Reset complete.** The knowledge base has been restored to the official Sri Vasavi Engineering College campus guidelines.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, notice]);
  };

  const quickPromptChips = [
    "What is the minimum attendance required?",
    "What are hostel curfew timings on weekends?",
    "How many books can I borrow from the library?",
    "What happens if I miss >25% classes?",
    "What is the fee for late semester payment?",
  ];

  return (
    <div className="flex flex-col h-screen w-screen bg-navy-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Navigation Bar */}
      <Navbar
        status={status}
        onOpenGuidelines={() => setIsGuidelinesOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenChunks={() => setIsChunksDrawerOpen(true)}
        onClearHistory={handleClearHistory}
        hasMessages={messages.length > 0}
      />

      {/* Main Content Body */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Policy & Settings Sidebar */}
        <Sidebar
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          suggestions={suggestions}
          onSelectSuggestion={handleSendMessage}
          onOpenGuidelines={() => setIsGuidelinesOpen(true)}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
        />

        {/* Center Conversation Column */}
        <main className="flex-1 flex flex-col h-full bg-navy-900/30 overflow-hidden relative">
          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
            {messages.length === 0 ? (
              /* Welcoming Hero Banner */
              <div className="max-w-2xl mx-auto py-10 sm:py-16 text-center space-y-6 animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-campus-500 to-emerald-600 mx-auto flex items-center justify-center shadow-xl shadow-campus-500/25 ring-2 ring-white/20">
                  <GraduationCap className="w-9 h-9 text-white" />
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-campus-500/10 border border-campus-500/30 text-campus-400 text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Universal Document RAG Agent</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Campus Retrieval Agent
                  </h2>
                  <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
                    Ask questions about campus guidelines, or{" "}
                    <button
                      className="text-campus-400 underline underline-offset-2 hover:text-campus-300 transition-colors"
                      onClick={() => setIsUploadOpen(true)}
                    >
                      upload your own document
                    </button>{" "}
                    (PDF, DOCX, TXT, CSV…) and the agent will answer questions about it in real time.
                  </p>
                </div>

                {/* Feature Highlights Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-left">
                  <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm">
                    <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center mb-2">
                      <Cpu className="w-3.5 h-3.5 text-sky-400" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-200">3-Stage Lifecycle</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Visual Observe, Decide, and Act agent execution trace.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-2">
                      <Layers className="w-3.5 h-3.5 text-purple-400" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-200">Any Document Format</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Upload PDF, DOCX, TXT, Markdown, CSV, JSON — all parsed on the fly.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm">
                    <div className="w-7 h-7 rounded-lg bg-campus-500/10 border border-campus-500/30 flex items-center justify-center mb-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-campus-400" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-200">Zero Hallucination</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Strictly answers from context or clarifies missing information.
                    </p>
                  </div>
                </div>

                {/* Upload CTA */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <button
                    onClick={() => setIsUploadOpen(true)}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-campus-500 hover:bg-campus-400 text-white text-sm font-semibold transition-colors shadow-lg shadow-campus-500/30"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Upload a Document</span>
                  </button>
                </div>

                {/* Popular Questions */}
                <div className="pt-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2.5">
                    Or ask about Campus Guidelines
                  </span>
                  <div className="flex flex-wrap justify-center gap-2">
                    {quickPromptChips.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(prompt)}
                        className="text-xs px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-white transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  onSelectChunk={handleSelectChunk}
                  onOpenChunksDrawer={() => setIsChunksDrawerOpen(true)}
                />
              ))
            )}

            {/* In-Flight Thinking Indicator */}
            {isLoading && (
              <div className="flex items-start space-x-3 mb-6 animate-fade-in">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-campus-500 to-emerald-700 flex items-center justify-center flex-shrink-0 shadow-md shadow-campus-500/20 ring-1 ring-campus-400/30">
                  <GraduationCap className="w-5 h-5 text-white animate-bounce" />
                </div>
                <div className="glass-panel rounded-2xl rounded-tl-none p-4 border border-slate-800/90 shadow-lg space-y-2 max-w-sm">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-campus-400">
                    <span className="w-2 h-2 rounded-full bg-campus-400 animate-ping"></span>
                    <span>Retrieval Agent Executing...</span>
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-1">
                    <p className="flex items-center space-x-1.5">
                      <span className="text-sky-400">1. [Observe]</span>
                      <span>Analyzing query and semantic weights</span>
                    </p>
                    <p className="flex items-center space-x-1.5">
                      <span className="text-purple-400">2. [Decide]</span>
                      <span>Searching vector store ({settings.top_k} chunks)</span>
                    </p>
                    <p className="flex items-center space-x-1.5">
                      <span className="text-campus-400">3. [Act]</span>
                      <span>Synthesizing grounded response with Groq</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Bottom Query Input */}
          <QueryInput
            onSend={handleSendMessage}
            isLoading={isLoading}
            quickPrompts={messages.length > 0 ? quickPromptChips : []}
          />
        </main>
      </div>

      {/* Modals and Drawers */}
      <GuidelinesModal
        isOpen={isGuidelinesOpen}
        onClose={() => setIsGuidelinesOpen(false)}
        rawText={guidelinesText}
      />

      <ChunkDrawer
        isOpen={isChunksDrawerOpen}
        onClose={() => setIsChunksDrawerOpen(false)}
        allChunks={allChunks}
        activeCitations={activeCitations}
        highlightedChunkId={highlightedChunkId}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
        onResetSuccess={handleResetSuccess}
      />
    </div>
  );
};

export default App;
