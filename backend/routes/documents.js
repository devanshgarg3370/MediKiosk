const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuid } = require("uuid");
const db = require("../config/db");
const { runOcr } = require("../services/ocrService");

const router = express.Router();

const uploadDir = process.env.UPLOAD_DIR || "./data/uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

/**
 * SCREEN 5: DOCUMENT SCANNING
 * POST /api/documents  (multipart/form-data: file, consultation_id, doc_type)
 * Stores the uploaded file, then runs (mock) OCR against it.
 */
router.post("/", upload.single("file"), (req, res) => {
  const { consultation_id, doc_type } = req.body;
  if (!consultation_id) return res.status(400).json({ error: "consultation_id is required" });
  if (!req.file) return res.status(400).json({ error: "file is required" });

  const consultation = db.prepare(`SELECT id FROM consultations WHERE id = ?`).get(consultation_id);
  if (!consultation) return res.status(404).json({ error: "Consultation not found" });

  const id = uuid();
  db.prepare(
    `INSERT INTO documents (id, consultation_id, doc_type, original_filename, stored_filename, file_path, mime_type, ocr_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'processing')`
  ).run(
    id,
    consultation_id,
    doc_type || "other",
    req.file.originalname,
    req.file.filename,
    req.file.path,
    req.file.mimetype
  );

  const extracted = runOcr(doc_type, req.file.originalname);

  db.prepare(
    `UPDATE documents SET ocr_status = 'completed', extracted_data = ? WHERE id = ?`
  ).run(JSON.stringify(extracted), id);

  const document = db.prepare(`SELECT * FROM documents WHERE id = ?`).get(id);
  res.status(201).json({ document, extracted });
});

router.get("/consultation/:consultationId", (req, res) => {
  const documents = db
    .prepare(`SELECT * FROM documents WHERE consultation_id = ? ORDER BY created_at ASC`)
    .all(req.params.consultationId);
  res.json({ documents });
});

module.exports = router;
