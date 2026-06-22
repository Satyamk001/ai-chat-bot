import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

class GeminiEmbeddings {
  constructor({ model = "gemini-embedding-001", outputDimensionality } = {}) {
    this.model = model;
    this.outputDimensionality = outputDimensionality;
  }

  async embedDocuments(texts) {
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

    return responses.map((res) => {
      const v = res?.embeddings?.[0]?.values ??
        res?.data?.[0]?.embedding ??
        res?.embedding ??
        res?.output?.[0]?.embedding ??
        [];
      return v;
    });
  }
}

async function run() {
  const embeddings = new GeminiEmbeddings({
    model: "gemini-embedding-001",
    outputDimensionality: 1526,
  });
  console.log("Testing embedDocuments...");
  try {
    const vectors = await embeddings.embedDocuments(["Hello world"]);
    console.log("Number of vectors:", vectors.length);
    if (vectors.length > 0) {
      console.log("First vector length:", vectors[0].length);
      if (vectors[0].length === 0) {
        console.log("Vector is empty array []!");
      }
    }
  } catch(e) {
    console.error("Error:", e);
  }
}

run();
