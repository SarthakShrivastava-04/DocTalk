import express from "express";
import { answerQuestion } from "../services/ragService.js";
import { getLatestUploadedFile } from "./upload.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const userQuery = req.query.message;

    if (!userQuery || typeof userQuery !== "string") {
      return res.status(400).json({
        message: "Query parameter 'message' is required.",
      });
    }

    const fileName =
      typeof req.query.fileName === "string"
        ? req.query.fileName
        : getLatestUploadedFile();

    const lastAnswer =
      typeof req.query.lastAnswer === "string" ? req.query.lastAnswer : "";

    console.log(`[CHAT] Query: ${userQuery}`);

    console.log(`[CHAT] File: ${fileName ?? "none"}`);

    const { answer, documents } = await answerQuestion({
      userQuery,
      fileName,
      lastAnswer,
    });

    return res.json({
      message: answer,

      fileName,

      docs: documents.map((doc) => ({
        pageContent: doc.pageContent,
        metadata: doc.metadata,
      })),
    });
  } catch (error) {
    console.error(`[CHAT] Request failed:`, error);

    return res.status(500).json({
      message: "Something went wrong while processing your query.",
      error: error.message,
    });
  }
});

export default router;
