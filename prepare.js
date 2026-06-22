// ...existing code...
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv"
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Adapter implementing LangChain Embeddings API for Gemini
class GeminiEmbeddings {
  constructor({ model = "gemini-embedding-001", outputDimensionality } = {}) {
    this.model = model;
    this.outputDimensionality = outputDimensionality;
  }

  // texts: string[] -> Promise<number[][]>
  async embedDocuments(texts) {
    // simple per-item calls; you can batch to reduce requests
    const responses = await Promise.all(
      texts.map((t) =>
        ai.models.embedContent({
          model: this.model,
          contents: [t],
          config: this.outputDimensionality
            ? { outputDimensionality: this.outputDimensionality }
            : undefined,
        }),
      ),
    );

    return responses.map((res, i) => {
      // adjust these accessors to match your genai client response shape
      return (
        res?.embeddings?.[0]?.values ??
        res?.data?.[0]?.embedding ??
        res?.embedding ??
        res?.output?.[0]?.embedding ??
        []
      );
    });
  }

  // text: string -> Promise<number[]>
  async embedQuery(text) {
    const res = await ai.models.embedContent({
      model: this.model,
      contents: [text],
      config: this.outputDimensionality
        ? { outputDimensionality: this.outputDimensionality }
        : undefined,
    });

    return (
      res?.embeddings?.[0]?.values ??
      res?.data?.[0]?.embedding ??
      res?.embedding ??
      res?.output?.[0]?.embedding ??
      []
    );
  }
}

const embeddings = new GeminiEmbeddings({
  model: "gemini-embedding-001",
  // optional: set known dimensionality if desired, e.g. 1536
  outputDimensionality: 1526,
});

const pinecone = new PineconeClient();
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);

export const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
  pineconeIndex,
  maxConcurrency: 5,
});

export async function indexTheDocument(filePath) {
  const loader = new PDFLoader(filePath, { splitPages: false });
  const doc = await loader.load();

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 100,
  });

  const texts = await textSplitter.splitText(doc[0].pageContent);
  console.log("Original text length:", doc[0].pageContent.length);
  console.log("Number of chunks:", texts.length);

  const documents = texts.map((chunk) => {
    return {
      pageContent: chunk,
      metadata: doc[0].metadata,
    };
  });

  await vectorStore.addDocuments(documents);
  // console.log(documents);
}