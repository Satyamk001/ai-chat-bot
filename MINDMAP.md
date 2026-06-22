# Project Mindmap — How this GenAI RAG project works

Below is a visual and textual overview of how the project fits together. The Mermaid mindmap shows components and data flow so someone new to Generative AI (GenAI) can quickly understand the architecture and run the project.

## Mermaid mindmap

```mermaid
mindmap
  root((Company Chatbot — RAG))
    Overview((Overview))
      Purpose((Answer company questions from PDF docs))
      Mode((CLI chatbot + indexing script))
    Ingestion((Document Ingestion))
      PDFLoader((PDFLoader — @langchain/community))
      TextSplitter((RecursiveCharacterTextSplitter))
      indexTheDocument()
    Embeddings((Embeddings))
      Gemini((Gemini Embeddings via @google/genai))
      GeminiEmbeddings((Adapter: GeminiEmbeddings class))
    VectorStore((Vector DB))
      Pinecone((Pinecone DB client))
      PineconeStore((@langchain/pinecone wrapper))
      vectorStore((exported vector store))
    Retrieval((Retrieval))
      similaritySearch((vectorStore.similaritySearch(question, k)))
      context((join relevant chunks))
    LLM((Generative Model))
      GroqClient((groq-sdk))
      Model((llama-3.3-70b-versatile))
      prompt((SYSTEM_PROMPT + userQuery + context))
    Chat((Chat CLI))
      chat.js((readline loop; ask question; show answer))
    Scripts((Entry points))
      rag.js((call indexTheDocument()))
      prepare.js((builds vectorStore and indexTheDocument()))

    DataFlow((Data Flow))
      "PDF -> chunks -> embeddings -> Pinecone index -> query -> retrieve -> LLM -> answer"

    Env((Environment / Keys))
      GEMINI_API_KEY((Gemini / Google GenAI key))
      PINECONE_API_KEY((Pinecone key))
      PINECONE_INDEX_NAME((Index name))
      GROQ_API_KEY((Groq chat/LLM key))
```

## How to read this mindmap

- Document ingestion: use `indexTheDocument(filePath)` in `prepare.js`. It loads a PDF with `PDFLoader`, splits text into chunks with `RecursiveCharacterTextSplitter`, then turns chunks into documents for the vector store.
- Embeddings: `GeminiEmbeddings` is a small adapter class that calls the `@google/genai` client to generate embeddings for each chunk or for a query.
- Vector store: the project uses Pinecone via `@pinecone-database/pinecone` and `@langchain/pinecone`'s `PineconeStore`. `vectorStore` is exported from `prepare.js` and used for retrieval.
- Retrieval: at chat time (`chat.js`) the user's question is turned into an embedding (implicitly by `vectorStore.similaritySearch` using the adapter) and the top-k similar chunks are returned. Those chunks are concatenated into `context`.
- LLM call: the project uses `groq-sdk` to call a model (`llama-3.3-70b-versatile`) with a system prompt and a user message that includes the retrieved context. The model's response is printed.
- Entry points: use `rag.js` to index `cg-internal-docs.pdf`, and run `chat.js` to start a CLI QA loop. `README.md` shows basic install/run with Bun.

## Commands (Windows, PowerShell)

Install dependencies (Bun):

```powershell
bun install
```

Index a PDF (example):

```powershell
bun run rag.js
# or, if using node: node rag.js
```

Start the chat CLI:

```powershell
bun run chat.js
# or: node chat.js
```

Notes about environment variables

- Create a `.env` file in the repo root with at least:
  - GEMINI_API_KEY — Google GenAI (Gemini) API key for embeddings
  - PINECONE_API_KEY and any Pinecone config used by the Pinecone client
  - PINECONE_INDEX_NAME — the index name used in `prepare.js`
  - GROQ_API_KEY — used by `chat.js` (groq-sdk) to call the LLM

## Quick beginner-friendly explanation

1. We convert PDF content into manageable chunks.
2. Each chunk becomes a numeric embedding that captures meaning.
3. We store embeddings in Pinecone to search for similar chunks quickly.
4. When you ask a question, we find relevant chunks and provide them as context to a large language model.
5. The model answers based on the retrieved context (RAG: Retrieval-Augmented Generation).

## Suggested next steps (optional improvements)

- Add a simple web UI for easier access (e.g., small Express or Vite app)
- Add automated tests for `GeminiEmbeddings` adapter
- Add a `run-index` and `run-chat` script entries to `package.json` for convenience
- Add an example `.env.example` with variable names only (no secrets)

## Files changed / added

- `MINDMAP.md` — this visual & explanatory guide (added)

Completion summary: created a Mermaid mindmap and a concise guide explaining how ingestion, embeddings, vector store, retrieval, and LLM calls fit together. This should make the project approachable for someone learning GenAI.
