import {
  StatusResponse,
  GuidelinesResponse,
  ChunkItem,
  SuggestionItem,
  QuerySettings,
  TraceStep,
} from "./types";

const BASE_URL = import.meta.env.VITE_API_URL || "";

export async function fetchStatus(): Promise<StatusResponse> {
  const res = await fetch(`${BASE_URL}/api/status`);
  if (!res.ok) throw new Error("Failed to fetch agent status");
  return res.json();
}

export async function fetchGuidelines(): Promise<GuidelinesResponse> {
  const res = await fetch(`${BASE_URL}/api/guidelines`);
  if (!res.ok) throw new Error("Failed to fetch guidelines");
  return res.json();
}

export async function fetchChunks(): Promise<{ total: number; chunks: ChunkItem[] }> {
  const res = await fetch(`${BASE_URL}/api/chunks`);
  if (!res.ok) throw new Error("Failed to fetch chunks");
  return res.json();
}

export async function fetchSuggestions(): Promise<SuggestionItem[]> {
  const res = await fetch(`${BASE_URL}/api/suggestions`);
  if (!res.ok) throw new Error("Failed to fetch suggestions");
  return res.json();
}



export interface UploadResponse {
  filename: string;
  file_type: string;
  file_size_bytes: number;
  chunks_count: number;
  total_characters: number;
  preview: string;
  suggestions: SuggestionItem[];
  message: string;
}

export async function uploadDocument(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE_URL}/api/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to upload document");
  }
  return res.json();
}

export async function resetDocument(): Promise<{ status: string; message: string }> {
  const res = await fetch(`${BASE_URL}/api/reset-document`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to reset document");
  }
  return res.json();
}


export interface QueryApiResult {
  query: string;
  answer: string;
  retrieved_chunks: ChunkItem[];
  trace: TraceStep[];
  latency_ms: number;
  grounded: boolean;
  model_used: string;
}

export async function sendQuery(
  query: string,
  settings: QuerySettings
): Promise<QueryApiResult> {
  const res = await fetch(`${BASE_URL}/api/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      top_k: settings.top_k,
      temperature: settings.temperature,
      model: settings.model,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Server error processing query");
  }

  return res.json();
}
