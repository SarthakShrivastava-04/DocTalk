import express from "express";
import cors from "cors";

import { PORT, validateConfig } from "./config.js";

import uploadRouter from "./routes/upload.js";
import chatRouter from "./routes/chat.js";

validateConfig();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

app.use("/upload", uploadRouter);
app.use("/chat", chatRouter);

app.use((err, req, res, next) => {
  console.error("[SERVER] Unhandled error:", err);

  res.status(500).json({
    message: "Internal server error.",
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
