import "dotenv/config";

import { Worker } from "bullmq";

import { QdrantVectorStore } from "@langchain/qdrant";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import {
  REDIS_CONNECTION,
  QDRANT_CONFIG,
  GOOGLE_API_KEY,
  CHUNK_SIZE,
  CHUNK_OVERLAP,
} from "./config.js";

const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-2",
  apiKey: GOOGLE_API_KEY,
});

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: CHUNK_SIZE,
  chunkOverlap: CHUNK_OVERLAP,
});

const worker = new Worker(
  "file-queue",
  async (job) => {
    console.log(`[WORKER] Processing job ${job.id}`);

    let data;

    try {
      data = JSON.parse(job.data);
    } catch (error) {
      console.error(`[WORKER] Job ${job.id} - Invalid job data:`, error);

      throw new Error(`Invalid job data: ${error.message}`, {
        cause: error,
      });
    }

    try {
      const loader = new PDFLoader(data.path);

      const docs = await loader.load();

      console.log(`[WORKER] Job ${job.id} - Loaded ${docs.length} pages.`);

      const chunks = await splitter.splitDocuments(docs);

      for (const chunk of chunks) {
        chunk.metadata.source = data.filename;
      }

      console.log(`[WORKER] Job ${job.id} - Created ${chunks.length} chunks.`);

      const vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddings,
        QDRANT_CONFIG,
      );

      await vectorStore.addDocuments(chunks);

      console.log(
        `[WORKER] Job ${job.id} - Successfully added ${chunks.length} chunks to Qdrant.`,
      );

      return {
        pages: docs.length,
        chunks: chunks.length,
        filename: data.filename,
      };
    } catch (error) {
      console.error(`[WORKER] Job ${job.id} - Processing failed:`, error);

      throw new Error(`PDF processing failed: ${error.message}`, {
        cause: error,
      });
    }
  },
  {
    concurrency: 100,
    connection: REDIS_CONNECTION,
  },
);

worker.on("completed", (job, result) => {
  console.log(`[WORKER] Job ${job.id} completed.`, result);
});

worker.on("failed", (job, error) => {
  console.error(`[WORKER] Job ${job?.id} failed:`, error);
});

worker.on("error", (error) => {
  console.error(`[WORKER] Worker error:`, error);
});

console.log("[WORKER] Worker started and waiting for jobs...");
