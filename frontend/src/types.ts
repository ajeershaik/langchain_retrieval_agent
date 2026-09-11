export interface ChunkItem {
  chunk_id: string;
  content: string;
  section: string;
  score?: number;
  char_count: number;
}

export interface TraceStep {
  step: "Observe" | "Decide" | "Act" | string;
  title: string;
  description: string;
  data?: Record<string, any>;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  retrieved_chunks?: ChunkItem[];
  trace?: TraceStep[];
  latency_ms?: number;
  grounded?: boolean;
  model_used?: string;
  isError?: boolean;
}

export interface ActiveDocument {
  name: string;
  type: string;
  size_bytes: number;
  uploaded_at: string;
  chunks_count: number;
}

export interface StatusResponse {
  status: string;
  service: string;
  institution: string;
  api_key_configured: boolean;
  active_model: string;
  chunks_indexed: number;
  guidelines_path: string;
  guidelines_loaded: boolean;
  active_document?: ActiveDocument;
}

export interface GuidelinesSection {
  id: string;
  title: string;
  icon: string;
}

export interface GuidelinesResponse {
  raw_text: string;
  sections: GuidelinesSection[];
  total_characters: number;
}

export interface SuggestionItem {
  category: string;
  query: string;
  section: string;
}

export interface QuerySettings {
  top_k: number;
  temperature: number;
  model: string;
}
