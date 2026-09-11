"""
Campus Retrieval Agent - Enhanced Universal Document RAG Backend Service
Sri Vasavi Engineering College
"""

import os
import sys
import time
import math
import re
import io
import json
import uvicorn
from pathlib import Path
from typing import List, Dict, Any, Optional

# Configure UTF-8 output on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Inject system TLS certs
try:
    import truststore
    truststore.inject_into_ssl()
except Exception as e:
    print(f"Truststore warning: {e}")

from dotenv import load_dotenv
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from groq import Groq
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Document parsers
import pypdf
import docx

app = FastAPI(
    title="Campus Retrieval Agent API",
    description="Backend service for Sri Vasavi Engineering College Retrieval Agent with Multi-Format Document Support",
    version="1.1.0"
)

# Enable CORS for browser access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIST = Path(__file__).parent / "frontend" / "dist"

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

DEFAULT_MODEL = "openai/gpt-oss-20b"
GUIDELINES_PATH = Path(__file__).parent / "campus_guidelines.txt"

# ---------------------------------------------------------------------------
# Multi-Format Document Parser
# ---------------------------------------------------------------------------
def extract_text_from_file(filename: str, file_bytes: bytes) -> str:
    """Extracts raw text from PDF, DOCX, TXT, MD, CSV, JSON, LOG, etc."""
    ext = Path(filename).suffix.lower()

    if ext == ".pdf":
        try:
            pdf_reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            pages_text = []
            for idx, page in enumerate(pdf_reader.pages):
                page_text = page.extract_text() or ""
                if page_text.strip():
                    pages_text.append(f"--- Page {idx+1} ---\n" + page_text.strip())
            extracted = "\n\n".join(pages_text)
            if not extracted.strip():
                raise ValueError("PDF contains no selectable text (may be scanned images).")
            return extracted
        except Exception as e:
            raise ValueError(f"Failed to parse PDF document: {e}")

    elif ext in [".docx", ".doc"]:
        try:
            doc = docx.Document(io.BytesIO(file_bytes))
            paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
            for table in doc.tables:
                for row in table.rows:
                    row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                    if row_text:
                        paragraphs.append(row_text)
            extracted = "\n\n".join(paragraphs)
            if not extracted.strip():
                raise ValueError("DOCX contains no text content.")
            return extracted
        except Exception as e:
            raise ValueError(f"Failed to parse Word document: {e}")

    else:
        # Text-based formats: txt, md, csv, json, log, etc.
        try:
            return file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            try:
                return file_bytes.decode("latin-1")
            except Exception as e:
                raise ValueError(f"Unable to decode text file: {e}")

# ---------------------------------------------------------------------------
# Vector Store & Retrieval Engine
# ---------------------------------------------------------------------------
class Chunk:
    def __init__(self, chunk_id: str, content: str, section: str):
        self.chunk_id = chunk_id
        self.content = content
        self.section = section
        self.char_count = len(content)

DEFAULT_SUGGESTIONS = [
    {
        "category": "Attendance",
        "query": "What is the minimum attendance required for semester examinations?",
        "section": "Attendance Policy"
    },
    {
        "category": "Hostel",
        "query": "What are the hostel curfew timings on weekdays and weekends?",
        "section": "Hostel Rules"
    },
    {
        "category": "Library",
        "query": "How many books can a student borrow and what is the overdue fine?",
        "section": "Library Rules"
    },
    {
        "category": "Exams",
        "query": "What happens if a student misses more than 25% of classes in a subject?",
        "section": "Examination Rules"
    },
    {
        "category": "Fees",
        "query": "What is the deadline for semester fees and what is the late fee penalty?",
        "section": "Fee Payment"
    },
    {
        "category": "Condonation",
        "query": "Can attendance between 65% and 75% be condoned on medical grounds?",
        "section": "Attendance Policy"
    }
]

class CampusVectorStore:
    def __init__(self):
        self.chunks: List[Chunk] = []
        self.vocabulary: Dict[str, int] = {}
        self.idf: Dict[str, float] = {}
        self.vectors: List[List[float]] = []
        self.raw_text: str = ""
        self.active_document_name: str = "campus_guidelines.txt"
        self.active_document_type: str = "default"  # 'default' or 'uploaded'
        self.active_document_size: int = 0
        self.active_document_uploaded_at: str = ""
        self.custom_suggestions: List[Dict[str, str]] = []

    def _tokenize(self, text: str) -> List[str]:
        cleaned = re.sub(r"[^a-zA-Z0-9\s%]", " ", text.lower())
        tokens = [t.strip() for t in cleaned.split() if len(t.strip()) > 1]
        return tokens

    def _detect_section(self, text: str) -> str:
        # If running default campus guidelines
        if self.active_document_type == "default":
            sections = [
                "Attendance Policy",
                "Examination Rules",
                "Library Rules",
                "Hostel Rules",
                "Fee Payment"
            ]
            for s in sections:
                if re.search(rf"\b{re.escape(s)}\b", text, re.IGNORECASE):
                    return s
            text_lower = text.lower()
            if "hostel" in text_lower or "curfew" in text_lower:
                return "Hostel Rules"
            elif "library" in text_lower or "borrow" in text_lower:
                return "Library Rules"
            elif "fee" in text_lower or "penalty" in text_lower:
                return "Fee Payment"
            elif "attendance" in text_lower or "condonation" in text_lower:
                return "Attendance Policy"
            elif "examination" in text_lower or "exam" in text_lower or "hall ticket" in text_lower or "revaluation" in text_lower:
                return "Examination Rules"
            elif "academic guidelines" in text_lower or "sri vasavi" in text_lower:
                return "General Overview"
            return "Campus Policy"
        else:
            # For uploaded documents, detect headers or first line
            first_line = text.strip().split("\n")[0].strip()
            if len(first_line) > 3 and len(first_line) < 40 and not first_line.endswith("."):
                return first_line.replace("#", "").replace("---", "").strip()
            return f"{self.active_document_name[:15]}"

    def index_document(self, text: str, doc_name: str = "campus_guidelines.txt", doc_type: str = "default", file_size: int = 0):
        self.raw_text = text
        self.active_document_name = doc_name
        self.active_document_type = doc_type
        self.active_document_size = file_size or len(text)
        self.active_document_uploaded_at = time.strftime("%Y-%m-%d %H:%M:%S")

        splitter = RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=50)
        docs = splitter.create_documents([text])
        
        self.chunks = []
        for idx, doc in enumerate(docs):
            content = doc.page_content.strip()
            section = self._detect_section(content)
            chunk = Chunk(chunk_id=f"chunk-{idx+1}", content=content, section=section)
            self.chunks.append(chunk)

        # Build TF-IDF Vocabulary & Vectors
        doc_tokens = [self._tokenize(c.content) for c in self.chunks]
        num_docs = len(doc_tokens)
        
        df: Dict[str, int] = {}
        for tokens in doc_tokens:
            unique_terms = set(tokens)
            for term in unique_terms:
                df[term] = df.get(term, 0) + 1
        
        self.vocabulary = {term: i for i, term in enumerate(df.keys())}
        self.idf = {term: math.log((1 + num_docs) / (1 + freq)) + 1.0 for term, freq in df.items()}
        
        self.vectors = []
        for tokens in doc_tokens:
            vec = [0.0] * len(self.vocabulary)
            tf: Dict[str, int] = {}
            for t in tokens:
                tf[t] = tf.get(t, 0) + 1
            for term, count in tf.items():
                if term in self.vocabulary:
                    dim = self.vocabulary[term]
                    vec[dim] = count * self.idf[term]
            
            norm = math.sqrt(sum(x * x for x in vec))
            if norm > 0:
                vec = [x / norm for x in vec]
            self.vectors.append(vec)

        # If custom document, generate suggestions
        if doc_type == "uploaded":
            self.generate_custom_suggestions()
        else:
            self.custom_suggestions = DEFAULT_SUGGESTIONS

    def generate_custom_suggestions(self):
        """Synthesize 4-5 relevant questions for the uploaded document."""
        if not client or len(self.raw_text.strip()) < 50:
            self.custom_suggestions = [
                {"category": "Summary", "query": f"Can you summarize the main points in {self.active_document_name}?", "section": "Overview"},
                {"category": "Details", "query": "What are the most important rules or guidelines mentioned?", "section": "Details"},
                {"category": "Key Info", "query": "What key dates, numbers, or requirements are listed?", "section": "Requirements"},
            ]
            return

        try:
            preview = self.raw_text[:2000]
            prompt = (
                "Based on the following document excerpt, generate exactly 4 concise, relevant questions "
                "that a reader would likely ask about this document.\n"
                "Return ONLY a JSON list of objects with keys 'category' (1-2 words), 'query' (the question string), "
                "and 'section' (short section name). Do not include markdown ticks or explanation.\n\n"
                f"Document excerpt:\n{preview}"
            )
            resp = client.chat.completions.create(
                model=DEFAULT_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2
            )
            raw = resp.choices[0].message.content.strip()
            if raw.startswith("```"):
                raw = re.sub(r"^```[a-zA-Z]*\n?", "", raw)
                raw = re.sub(r"\n?```$", "", raw)
            parsed = json.loads(raw)
            if isinstance(parsed, list) and len(parsed) > 0:
                self.custom_suggestions = parsed
            else:
                raise ValueError("Invalid format")
        except Exception as e:
            print(f"Suggestion generation fallback: {e}")
            self.custom_suggestions = [
                {"category": "Summary", "query": f"Can you summarize the main points in {self.active_document_name}?", "section": "Overview"},
                {"category": "Key Points", "query": "What are the key instructions or takeaways in this document?", "section": "Takeaways"},
                {"category": "Details", "query": "What specific criteria or numbers are highlighted?", "section": "Details"},
            ]

    def reset_to_default(self):
        if GUIDELINES_PATH.exists():
            with open(GUIDELINES_PATH, "r", encoding="utf-8") as f:
                self.index_document(f.read(), doc_name="campus_guidelines.txt", doc_type="default", file_size=GUIDELINES_PATH.stat().st_size)
            self.custom_suggestions = DEFAULT_SUGGESTIONS

    def retrieve(self, query: str, top_k: int = 2) -> List[Dict[str, Any]]:
        query_tokens = self._tokenize(query)
        q_vec = [0.0] * len(self.vocabulary)
        q_tf: Dict[str, int] = {}
        for t in query_tokens:
            q_tf[t] = q_tf.get(t, 0) + 1
        
        for term, count in q_tf.items():
            if term in self.vocabulary:
                dim = self.vocabulary[term]
                q_vec[dim] = count * self.idf.get(term, 1.0)
        
        q_norm = math.sqrt(sum(x * x for x in q_vec))
        if q_norm > 0:
            q_vec = [x / q_norm for x in q_vec]

        scores = []
        for i, doc_vec in enumerate(self.vectors):
            dot_product = sum(a * b for a, b in zip(q_vec, doc_vec))
            
            bonus = 0.0
            content_lower = self.chunks[i].content.lower()
            for token in query_tokens:
                if token in content_lower:
                    bonus += 0.05
            
            total_score = min(1.0, dot_product + bonus)
            scores.append((total_score, self.chunks[i]))

        scores.sort(key=lambda x: x[0], reverse=True)
        top_results = scores[:top_k]

        return [
            {
                "chunk_id": chunk.chunk_id,
                "content": chunk.content,
                "section": chunk.section,
                "score": round(score, 4),
                "char_count": chunk.char_count,
            }
            for score, chunk in top_results
        ]

# Initialize and index guidelines
vector_store = CampusVectorStore()
vector_store.reset_to_default()

# ---------------------------------------------------------------------------
# API Models
# ---------------------------------------------------------------------------
class QueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = Field(default=2, ge=1, le=5)
    temperature: Optional[float] = Field(default=0.0, ge=0.0, le=1.0)
    model: Optional[str] = DEFAULT_MODEL

class TraceStep(BaseModel):
    step: str
    title: str
    description: str
    data: Optional[Any] = None

class QueryResponse(BaseModel):
    query: str
    answer: str
    retrieved_chunks: List[Dict[str, Any]]
    trace: List[TraceStep]
    latency_ms: int
    grounded: bool
    model_used: str

class UploadResponse(BaseModel):
    filename: str
    file_type: str
    file_size_bytes: int
    chunks_count: int
    total_characters: int
    preview: str
    suggestions: List[Dict[str, str]]
    message: str

# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------
@app.get("/api/status")
def get_status():
    return {
        "status": "online",
        "service": "Campus Retrieval Agent",
        "institution": "Sri Vasavi Engineering College",
        "api_key_configured": bool(GROQ_API_KEY),
        "active_model": DEFAULT_MODEL,
        "chunks_indexed": len(vector_store.chunks),
        "guidelines_path": str(GUIDELINES_PATH),
        "guidelines_loaded": bool(vector_store.raw_text),
        "active_document": {
            "name": vector_store.active_document_name,
            "type": vector_store.active_document_type,
            "size_bytes": vector_store.active_document_size,
            "uploaded_at": vector_store.active_document_uploaded_at,
            "chunks_count": len(vector_store.chunks),
        }
    }

@app.get("/api/guidelines")
def get_guidelines():
    sections = [
        {"id": "exam", "title": "Examination Rules", "icon": "file-text"},
        {"id": "attendance", "title": "Attendance Policy", "icon": "calendar-check"},
        {"id": "library", "title": "Library Rules", "icon": "book-open"},
        {"id": "hostel", "title": "Hostel Rules", "icon": "home"},
        {"id": "fees", "title": "Fee Payment", "icon": "credit-card"},
    ]
    return {
        "raw_text": vector_store.raw_text,
        "document_name": vector_store.active_document_name,
        "document_type": vector_store.active_document_type,
        "sections": sections,
        "total_characters": len(vector_store.raw_text),
    }

@app.get("/api/chunks")
def get_chunks():
    return {
        "total": len(vector_store.chunks),
        "document_name": vector_store.active_document_name,
        "chunks": [
            {
                "chunk_id": c.chunk_id,
                "section": c.section,
                "content": c.content,
                "char_count": c.char_count,
            }
            for c in vector_store.chunks
        ]
    }

@app.get("/api/suggestions")
def get_suggestions():
    return vector_store.custom_suggestions or DEFAULT_SUGGESTIONS

@app.post("/api/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    """Accepts any document (PDF, DOCX, TXT, MD, CSV, JSON), parses, and indexes."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")

    try:
        content_bytes = await file.read()
        file_size = len(content_bytes)

        if file_size == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        # 25 MB file limit
        if file_size > 25 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File exceeds 25 MB limit.")

        # Extract text based on file format
        text = extract_text_from_file(file.filename, content_bytes)
        
        if len(text.strip()) < 10:
            raise HTTPException(status_code=400, detail="Document contains insufficient extractable text.")

        # Index into vector store
        vector_store.index_document(
            text=text,
            doc_name=file.filename,
            doc_type="uploaded",
            file_size=file_size
        )

        preview = text.strip()[:400] + ("..." if len(text) > 400 else "")

        return UploadResponse(
            filename=file.filename,
            file_type=Path(file.filename).suffix.upper().replace(".", "") or "TEXT",
            file_size_bytes=file_size,
            chunks_count=len(vector_store.chunks),
            total_characters=len(text),
            preview=preview,
            suggestions=vector_store.custom_suggestions,
            message=f"Successfully parsed and indexed {len(vector_store.chunks)} chunks from '{file.filename}'."
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/reset-document")
def reset_document():
    """Resets the vector knowledge base back to official Sri Vasavi Campus Guidelines."""
    vector_store.reset_to_default()
    return {
        "status": "success",
        "message": "Reset knowledge base to official Sri Vasavi Engineering College guidelines.",
        "active_document": vector_store.active_document_name,
        "chunks_indexed": len(vector_store.chunks)
    }

@app.post("/api/query", response_model=QueryResponse)
def handle_query(req: QueryRequest):
    start_time = time.time()
    query = req.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    trace: List[TraceStep] = []

    # 1. [Observe] Phase
    print(f"\n[Observe] Query: {query} (Document: {vector_store.active_document_name})")
    trace.append(TraceStep(
        step="Observe",
        title="Query Ingestion & Intent Analysis",
        description=f"Received query: '{query}'. Target document: '{vector_store.active_document_name}'. Extracted semantic query tokens and computed vector space query weights.",
        data={"query": query, "char_length": len(query), "document": vector_store.active_document_name}
    ))

    # 2. [Decide] Phase
    top_k = req.top_k or 2
    retrieved_docs = vector_store.retrieve(query, top_k=top_k)
    print(f"[Decide] Retrieved {len(retrieved_docs)} relevant chunk(s)")

    context = "\n\n".join(d["content"] for d in retrieved_docs)
    trace.append(TraceStep(
        step="Decide",
        title=f"Vector Store Retrieval (Top {top_k} Chunks)",
        description=f"Retrieved {len(retrieved_docs)} relevant chunk(s) from '{vector_store.active_document_name}'.",
        data={
            "retrieved_chunk_ids": [d["chunk_id"] for d in retrieved_docs],
            "sections": [d["section"] for d in retrieved_docs],
            "similarity_scores": [d["score"] for d in retrieved_docs],
            "document": vector_store.active_document_name,
        }
    ))

    # 3. [Act] Phase
    doc_context_label = f"Document: {vector_store.active_document_name}"
    system_prompt = (
        f"Answer the user's question using ONLY the context below from the document '{vector_store.active_document_name}'. "
        "If the answer isn't in the context, say you don't have that information.\n\n"
        f"Context:\n{context}"
    )

    selected_model = req.model or DEFAULT_MODEL
    answer = ""
    try:
        if not client:
            raise Exception("GROQ_API_KEY is not configured in .env")

        completion = client.chat.completions.create(
            model=selected_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query}
            ],
            temperature=req.temperature or 0.0
        )
        answer = completion.choices[0].message.content.strip()
    except Exception as e:
        print(f"LLM Error: {e}")
        answer = f"[System Notice] Unable to contact LLM service ({e}). Context retrieved:\n\n{context}"

    print(f"[Act] Answer: {answer}")
    
    # Verify if answer claims lack of information
    lower_ans = answer.lower().replace("’", "'").replace("`", "'")
    not_found_phrases = [
        "don't have that information",
        "do not have that information",
        "doesn't have that information",
        "does not have that information",
        "not mentioned in the context",
        "context does not provide",
        "context doesn't provide",
        "i do not have that",
        "i don't have that",
        "not available in the context",
    ]
    grounded = not any(p in lower_ans for p in not_found_phrases)

    trace.append(TraceStep(
        step="Act",
        title="Grounded LLM Response Generation",
        description=f"Synthesized response using model '{selected_model}' with strict context grounding on '{vector_store.active_document_name}'.",
        data={"grounded": grounded, "answer_length": len(answer), "document": vector_store.active_document_name}
    ))

    latency_ms = int((time.time() - start_time) * 1000)

    return QueryResponse(
        query=query,
        answer=answer,
        retrieved_chunks=retrieved_docs,
        trace=trace,
        latency_ms=latency_ms,
        grounded=grounded,
        model_used=selected_model
    )

# Serve static frontend if built
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        file_path = FRONTEND_DIST / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port
    )
