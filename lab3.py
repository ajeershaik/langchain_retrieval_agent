"""
Exercise 3: Campus Retrieval Agent
--------------------------------------
Loads a text document, splits it into chunks, embeds them into a
vector store, and answers questions using only retrieved content.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate

load_dotenv(dotenv_path=Path(__file__).parent / ".env")

# ---------------------------------------------------------------
# STEP 1: Load the document
# ---------------------------------------------------------------
loader = TextLoader("campus_guidelines.txt")
documents = loader.load()

# ---------------------------------------------------------------
# STEP 2: Split into chunks
# ---------------------------------------------------------------
splitter = RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=50)
chunks = splitter.split_documents(documents)

# ---------------------------------------------------------------
# STEP 3: Embed chunks and store in Chroma (vector database)
# ---------------------------------------------------------------
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
vectorstore = Chroma.from_documents(chunks, embeddings)
retriever = vectorstore.as_retriever(search_kwargs={"k": 2})

# ---------------------------------------------------------------
# STEP 4: Set up the LLM and prompt template
# ---------------------------------------------------------------
llm = ChatGroq(model="openai/gpt-oss-20b", temperature=0, api_key=os.getenv("GROQ_API_KEY"))

prompt = PromptTemplate.from_template(
    "Answer the student's question using ONLY the context below. "
    "If the answer isn't in the context, say you don't have that information.\n\n"
    "Context:\n{context}\n\nQuestion: {question}\n\nAnswer:"
)


def run_agent(query: str) -> str:
    print(f"\n[Observe] Query: {query}")

    docs = retriever.invoke(query)
    print(f"[Decide] Retrieved {len(docs)} relevant chunk(s)")

    context = "\n\n".join(d.page_content for d in docs)
    chain = prompt | llm
    response = chain.invoke({"context": context, "question": query})

    print(f"[Act] Answer: {response.content}")
    return response.content


def main():
    print("Campus Retrieval Agent")
    print("Type 'exit' to quit.\n")

    while True:
        query = input("Ask about campus guidelines: ")
        if query.strip().lower() == "exit":
            print("Goodbye!")
            break
        run_agent(query)


if __name__ == "__main__":
    main()