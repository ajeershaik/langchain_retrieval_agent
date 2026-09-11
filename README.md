# langchain_retrieval_agent

A lightweight **Retrieval-Augmented Generation (RAG)** application that answers questions using information retrieved from a specified campus document.

The project demonstrates how an AI application can load a document, split it into smaller chunks, convert those chunks into embeddings, store them in a vector database, retrieve the most relevant content for a user's question, and generate an answer using only that retrieved context.

## 🚀 Project Features

- 📄 **Document-Based Question Answering** — Loads a campus guidelines document and uses its content as the knowledge source.
- 🔎 **Semantic Retrieval** — Finds the most relevant document chunks for each question.
- 🧠 **RAG Pipeline** — Combines document retrieval with an LLM to produce context-grounded answers.
- ✂️ **Text Chunking** — Uses `RecursiveCharacterTextSplitter` with configurable chunk size and overlap.
- 🔢 **Text Embeddings** — Generates embeddings using `sentence-transformers/all-MiniLM-L6-v2`.
- 🗄️ **Vector Database** — Stores document embeddings in Chroma for similarity-based retrieval.
- 🤖 **LLM Integration** — Uses Groq with the `openai/gpt-oss-20b` model.
- 🛡️ **Context-Only Answers** — The prompt instructs the model to answer only from retrieved context and explicitly say when the information is unavailable.
- 💬 **Interactive CLI** — Users can continuously ask questions from the terminal until they enter `exit`.
- 🔐 **Environment-Based API Key** — Uses `GROQ_API_KEY` from a `.env` file instead of hard-coding credentials.

## 🧩 How It Works

```text
              Campus Guidelines Document
                         │
                         ▼
                 📄 Document Loader
                         │
                         ▼
                  ✂️ Text Splitter
                         │
                         ▼
                  🔢 Embeddings
                         │
                         ▼
                  🗄️ Chroma Vector DB
                         │
              ┌──────────┴──────────┐
              │                     │
        User Question          Similarity Search
              │                     │
              └──────────┬──────────┘
                         ▼
                  🔎 Top 2 Chunks
                         │
                         ▼
                  🧠 Prompt + Context
                         │
                         ▼
                    🤖 Groq LLM
                         │
                         ▼
                  💬 Final Answer
```

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Python | Core application |
| LangChain | Document processing and RAG pipeline |
| Hugging Face Embeddings | Semantic text embeddings |
| Sentence Transformers | `all-MiniLM-L6-v2` embedding model |
| Chroma | Vector database |
| Groq | Large Language Model inference |
| python-dotenv | Environment variable management |
| uv | Python project and dependency management |

## 📁 Project Structure

```text
campus_retrieval_agent/
│
├── campus_guidelines.txt
├── lab3.py
├── pyproject.toml
├── README.md
│
└── src/
    └── campus_retrieval_agent/
        └── __init__.py
```

> The project archive may also contain a local `.venv` directory. It should not be committed to GitHub; recreate the environment using the project's dependency configuration instead.

## ⚙️ Setup

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd campus_retrieval_agent
```

### 2. Create and activate the environment

If you are using `uv`:

```bash
uv sync
```

Then activate the environment if needed:

**Windows:**
```bash
.venv\Scripts\activate
```

**macOS/Linux:**
```bash
source .venv/bin/activate
```

### 3. Install the required RAG dependencies

The application imports the following packages:

```bash
pip install python-dotenv langchain-community langchain-text-splitters langchain-huggingface langchain-groq chromadb sentence-transformers
```

### 4. Configure the Groq API key

Create a `.env` file in the project directory:

```env
GROQ_API_KEY=your_groq_api_key
```

Do not commit `.env` to GitHub.

Add it to `.gitignore`:

```gitignore
.env
.venv/
__pycache__/
```

## ▶️ Run the Project

Run:

```bash
python lab3.py
```

You will see:

```text
Campus Retrieval Agent
Type 'exit' to quit.

Ask about campus guidelines:
```

Example:

```text
Ask about campus guidelines: What is the minimum attendance required?

Answer:
A minimum of 75% attendance is mandatory to be eligible for semester examinations.
```

Another example:

```text
Ask about campus guidelines: What is the library fine for overdue books?

Answer:
A fine of Rs. 2 per day is charged for overdue books.
```

If the requested information is not present in the document, the prompt instructs the model to state that it does not have that information.

## 🧠 RAG Concepts Demonstrated

This project covers the main stages of a basic RAG system:

### 1. Document Loading

`TextLoader` reads the campus guidelines text file.

### 2. Chunking

The document is divided into smaller pieces using:

```python
RecursiveCharacterTextSplitter(
    chunk_size=300,
    chunk_overlap=50
)
```

### 3. Embedding

Each chunk is converted into a numerical vector using:

```text
sentence-transformers/all-MiniLM-L6-v2
```

### 4. Vector Storage

The embeddings are stored in **Chroma**, allowing semantic similarity searches.

### 5. Retrieval

For every question, the retriever searches for the **top 2 relevant chunks**.

### 6. Generation

The retrieved context and user question are passed to the Groq LLM through a prompt that restricts the answer to the supplied context.

## 🔐 Grounded Answering

A key part of the project is the prompt:

```text
Answer the student's question using ONLY the context below.
If the answer isn't in the context, say you don't have that information.
```

This helps reduce unsupported answers by requiring the model to base its response on retrieved document content.

## 📌 Current Scope

The current implementation is a **command-line RAG prototype**. It loads `campus_guidelines.txt` as the document source and allows users to ask questions about that content.

A future version could add a web interface where users can upload PDF, DOCX, or TXT files dynamically and then ask questions about the uploaded document.

## 🔮 Future Enhancements

- 🌐 Add a Streamlit or React web interface
- 📤 Support dynamic file uploads
- 📑 Support PDF and DOCX documents
- 🗂️ Allow multiple documents
- 💾 Persist the Chroma vector database
- 💬 Add conversation history
- 📚 Display retrieved source chunks
- ⚡ Add document caching for faster repeated queries
- 🔐 Add user authentication for a production version

## 👨‍💻 Author

**Ajeer Shaik**

Computer Science Student | Java & Spring Boot | AI/ML Enthusiast

---

⭐ If you found this project useful, consider giving the repository a star!
