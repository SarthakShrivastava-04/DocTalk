import "dotenv/config";
import { Worker } from "bullmq";
import { QdrantVectorStore } from "@langchain/qdrant";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

const worker = new Worker(
  "file-queue",
  async (job) => {
    let data;

    try {
      data = JSON.parse(job.data);
    } catch (err) {
      console.error(` Job ${job?.id} - Failed to parse data:`, err);
      return;
    }

    try {
      const loader = new PDFLoader(data.path);
      const docs = await loader.load();

      const embeddings = new GoogleGenerativeAIEmbeddings({
        model: "text-embedding-004",
        apiKey: process.env.GOOGLE_API_KEY,
      });

      const vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddings,
        {
          url: process.env.QDRANT_URL,
          collectionName: "pdf-rag",
        }
      );

      await vectorStore.addDocuments(docs);
      console.log(` Job ${job?.id} - Successfully added ${docs.length} pages.`);
    } catch (err) {
      console.error(` Job ${job?.id} - Error during processing:`, err);
    }
  },
  {
    concurrency: 100,
    connection: {
      host: "redis",
      port: 6379,
    },
  }
);

worker.on("completed", (job) => {
  console.log(` Job ${job.id} completed.`);
});

worker.on("failed", (job, err) => {
  console.error(` Job ${job.id} failed:`, err);
});
