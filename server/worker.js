// import "dotenv/config";
// import { Worker } from "bullmq";
// import { QdrantVectorStore } from "@langchain/qdrant";
// import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
// import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

// console.log("Starting worker...");

// const worker = new Worker(
//   "file-queue",
//   async (job) => {
//     const data = JSON.parse(job.data);
//     console.log(`Processing`);

//     const loader = new PDFLoader(data.path);
//     const docs = await loader.load();

//     const embeddings = new GoogleGenerativeAIEmbeddings({
//       model: "text-embedding-004",
//       apiKey: process.env.GOOGLE_API_KEY,
//     });

//     const vectorStore = await QdrantVectorStore.fromExistingCollection(
//       embeddings,
//       {
//         url: process.env.QDRANT_URL,
//         collectionName: "pdf-rag",
//       }
//     );

//     await vectorStore.addDocuments(docs);

//     console.log(`Successfully added ${docs.length} pages from ${data.path}`);
//   },
//   {
//     concurrency: 100,
//     connection: {
//       host: "redis",
//       port: 6379,
//     },
//   }
// );


import "dotenv/config";
import { Worker } from "bullmq";
import { QdrantVectorStore } from "@langchain/qdrant";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

console.log("🚀 Starting worker...");

const worker = new Worker(
  "file-queue",
  async (job) => {
    console.log(`📥 Received job:`, job?.id);

    let data;
    try {
      data = JSON.parse(job.data);
      console.log(`📄 PDF Path: ${data.path}`);
    } catch (err) {
      console.error("❌ Failed to parse job data:", err);
      return;
    }

    try {
      console.log("🔍 Loading PDF...");
      const loader = new PDFLoader(data.path);
      const docs = await loader.load();
      console.log(`📚 Loaded ${docs.length} document pages.`);

      console.log("⚙️ Initializing embeddings...");
      const embeddings = new GoogleGenerativeAIEmbeddings({
        model: "text-embedding-004",
        apiKey: process.env.GOOGLE_API_KEY,
      });

      console.log("🌐 Connecting to Qdrant...");
      const vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddings,
        {
          url: process.env.QDRANT_URL,
          collectionName: "pdf-rag",
        }
      );

      console.log("📤 Adding documents to Qdrant...");
      await vectorStore.addDocuments(docs);
      console.log(`✅ Successfully added ${docs.length} pages from ${data.path}`);
    } catch (err) {
      console.error("❌ Error during job processing:", err);
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
  console.log(`🎉 Job ${job.id} completed.`);
});

worker.on("failed", (job, err) => {
  console.error(`🔥 Job ${job.id} failed:`, err);
});
