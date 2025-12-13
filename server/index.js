import express from "express";
import cors from "cors";
import multer from "multer";
import "dotenv/config";
import { Queue } from "bullmq";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const queue = new Queue("file-queue", {
  connection: {
    host: "redis",
    port: 6379,
  },
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");  
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

const app = express();

app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/upload/pdf", upload.single("pdf"), async (req, res) => {
  await queue.add(
    "file-ready",
    JSON.stringify({
      filename: req.file.originalname,
      path: req.file.path,
      destination: req.file.destination,
    })
  );
  return res.json({ message: "uploaded" });
});

app.get("/chat", async (req, res) => {
  const userQuery = req.query.message;

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

  const ret = vectorStore.asRetriever({
    k: 10,
  });
  const result = await ret.invoke(userQuery);

  const contextText = result.map((doc) => doc.pageContent).join("\n\n");

  const SYSTEM_PROMPT = `You are a helpful assistant. You will be provided with some context and a question. Answer the question based on the context.
    Context:${contextText}`;

  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0,
    apiKey: process.env.GOOGLE_API_KEY,
  });

  const chatResult = await llm.invoke([
    ["system", SYSTEM_PROMPT],
    ["human", userQuery],
  ]);

  console.log("Chat Result: ", result);

  return res.json({
    message: chatResult.content,
    docs: result,
  });
});

app.listen(8000, () => console.log("Server is running on port 8000"));
