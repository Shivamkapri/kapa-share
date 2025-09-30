import express from "express";
import { uploadFile, saveFileMetadata, listFiles, downloadFile, deleteFile, toggleStar, shareText } from "../controllers/fileController.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Upload endpoint: accepts file and optional uploader name
router.post("/upload", upload.single("file"), uploadFile);
// Share text endpoint
router.post("/share-text", shareText);
router.post("/save", saveFileMetadata);
router.get("/", listFiles);
// Download/view endpoint
router.get("/download/:filename", downloadFile);
// Toggle star endpoint
router.patch("/:filename/star", toggleStar);
// Delete endpoint (admin password required)
router.delete("/:filename", deleteFile);

export default router;
