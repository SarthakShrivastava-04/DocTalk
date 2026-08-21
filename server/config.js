import "dotenv/config";
import { Queue } from "bullmq";

export const PORT = 8000;

export const REDIS_CONNECTION = {
  host: "redis",
  port: 6379,
};

export const fileQueue = new Queue("file-queue", {
  connection: REDIS_CONNECTION,
});

export const QDRANT_CONFIG = {
  url: process.env.QDRANT_URL,
  collectionName: "pdf-rag",
};

export const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
export const COHERE_API_KEY = process.env.COHERE_API_KEY;

export const CANDIDATE_COUNT = 15;
export const MAX_SOURCES = 6;
export const RELEVANCE_THRESHOLD = 0.5;

export const CHUNK_SIZE = 1000;
export const CHUNK_OVERLAP = 200;

export function validateConfig() {
  const required = {
    GOOGLE_API_KEY,
    COHERE_API_KEY,
    QDRANT_URL: process.env.QDRANT_URL,
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
}
