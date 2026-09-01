const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuid } = require("uuid");
const db = require("../config/db");
const { runOcr } = require("../services/ocrService");

const router = express.Router();

const uploadDir = process.env.UPLOAD_DIR || "./uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  },
});

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new Error("Unsupported file type. Allowed: jpg, png, webp, pdf"));
    }
    cb(null, true);
  },
});

/**
 * SCREEN 5: DOCUMENT SCANNING
 * POST /api/documents/:consultationId  (multipart/form-data, field "file")
 * Body also expects: doc_type = prescription | lab_report | discharge_summary | other
 */
router.post("/:consultationId", upload.single("file"), (req, res) => {
  const { consultationId } = req.params;
  const { doc_type } = req.body;

  if (!req.file) return res.status(400).json({ error: "file is required" });

  const consultation = db.prepare(`SELECT id FROM consultations WHERE id = ?`).get(consultationId);
  if (!consultation) return res.status(404).json({ error: "Consultation not found" });

  const id = uuid();
  db.prepare(
    `INSERT INTO documents (id, consultation_id, doc_type, original_filename, stored_filename, file_path, mime_type, ocr_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'processing')`
  ).run(
    id,
    consultationId,
    doc_type || "other",
    req.file.originalname,
    req.file.filename,
    req.file.path,
    req.file.mimetype
  );

  // Mock OCR runs synchronously here since it's not a real, slow external
  // call. Swap for an async job/queue when wiring in a real OCR provider.
  const extracted = runOcr(doc_type || "other", req.file.originalname);
  db.prepare(
    `UPDATE documents SET ocr_status = 'completed', extracted_data = ? WHERE id = ?`
  ).run(JSON.stringify(extracted), id);

  const document = db.prepare(`SELECT * FROM documents WHERE id = ?`).get(id);
  res.status(201).json({
    ...document,
    extracted_data: JSON.parse(document.extracted_data),
  });
});

router.get("/:consultationId", (req, res) => {
  const docs = db
    .prepare(`SELECT * FROM documents WHERE consultation_id = ? ORDER BY created_at ASC`)
    .all(req.params.consultationId)
    .map((d) => ({ ...d, extracted_data: d.extracted_data ? JSON.parse(d.extracted_data) : null }));
  res.json({ documents: docs });
});

router.delete("/:documentId", (req, res) => {
  const doc = db.prepare(`SELECT * FROM documents WHERE id = ?`).get(req.params.documentId);
  if (!doc) return res.status(404).json({ error: "Document not found" });

  if (doc.file_path && fs.existsSync(doc.file_path)) {
    fs.unlinkSync(doc.file_path);
  }
  db.prepare(`DELETE FROM documents WHERE id = ?`).run(req.params.documentId);
  res.json({ deleted: true });
});

router.get("/file/:documentId", (req, res) => {
  const doc = db.prepare(`SELECT * FROM documents WHERE id = ?`).get(req.params.documentId);
  if (!doc || !fs.existsSync(doc.file_path)) return res.status(404).json({ error: "File not found" });
  res.sendFile(path.resolve(doc.file_path));
});

module.exports = router;
