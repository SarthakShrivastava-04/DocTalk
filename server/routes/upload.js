import express from "express";
import multer from "multer";
import { fileQueue } from "../config.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },

  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
});

let latestUploadedFile = null;

export function getLatestUploadedFile() {
  return latestUploadedFile;
}

router.post("/pdf", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "PDF file is required.",
      });
    }

    const fileData = {
      filename: req.file.originalname,
      path: req.file.path,
      destination: req.file.destination,
    };

    latestUploadedFile = req.file.originalname;

    const job = await fileQueue.add("file-ready", JSON.stringify(fileData));

    console.log(`[UPLOAD] File uploaded: ${req.file.originalname}`);

    console.log(`[UPLOAD] Queue job created: ${job.id}`);

    return res.json({
      message: "uploaded",
      filename: req.file.originalname,
      jobId: job.id,
    });
  } catch (error) {
    console.error(`[UPLOAD] Failed to upload/queue file:`, error);

    return res.status(500).json({
      message: "Failed to upload PDF.",
      error: error.message,
    });
  }
});

export default router;
