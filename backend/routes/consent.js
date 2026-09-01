const express = require("express");
const { v4: uuid } = require("uuid");
const db = require("../config/db");

const router = express.Router();

/**
 * SCREEN 3: CONSENT & PRIVACY
 * POST /api/consent
 * Records granular consent per data-use category. All four must be
 * explicitly true to proceed to history-taking (frontend also enforces
 * this, but the backend is the source of truth).
 */
router.post("/", (req, res) => {
  const {
    patient_id,
    clinical_history,
    document_scan,
    hospital_share,
    abdm_integration,
  } = req.body;

  if (!patient_id) return res.status(400).json({ error: "patient_id is required" });

  const patient = db.prepare(`SELECT id FROM patients WHERE id = ?`).get(patient_id);
  if (!patient) return res.status(404).json({ error: "Patient not found" });

  const id = uuid();
  db.prepare(
    `INSERT INTO consents (id, patient_id, clinical_history, document_scan, hospital_share, abdm_integration, accepted_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
  ).run(
    id,
    patient_id,
    clinical_history ? 1 : 0,
    document_scan ? 1 : 0,
    hospital_share ? 1 : 0,
    abdm_integration ? 1 : 0
  );

  const consent = db.prepare(`SELECT * FROM consents WHERE id = ?`).get(id);
  const allAccepted = clinical_history && document_scan && hospital_share && abdm_integration;

  res.status(201).json({ consent, canProceed: !!allAccepted });
});

router.get("/patient/:patientId", (req, res) => {
  const consents = db
    .prepare(`SELECT * FROM consents WHERE patient_id = ? ORDER BY created_at DESC`)
    .all(req.params.patientId);
  res.json({ consents });
});

module.exports = router;
