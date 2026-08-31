const express = require("express");
const { v4: uuid } = require("uuid");
const db = require("../config/db");

const router = express.Router();

/**
 * SCREEN 2: PATIENT IDENTIFICATION
 * POST /api/patients/lookup
 * Looks up an existing patient by ABHA ID or Aadhaar (kiosk scan/input).
 */
router.post("/lookup", (req, res) => {
  const { abha_id, aadhaar_id } = req.body;
  if (!abha_id && !aadhaar_id) {
    return res.status(400).json({ error: "abha_id or aadhaar_id is required" });
  }

  const patient = db
    .prepare(
      `SELECT * FROM patients WHERE (abha_id = ? AND abha_id IS NOT NULL) OR (aadhaar_id = ? AND aadhaar_id IS NOT NULL) ORDER BY created_at DESC LIMIT 1`
    )
    .get(abha_id || null, aadhaar_id || null);

  if (!patient) {
    return res.status(404).json({ found: false, message: "No existing patient found. Proceed to new registration." });
  }
  res.json({ found: true, patient });
});

/**
 * POST /api/patients
 * Registers a new patient, or updates+returns an existing one if
 * abha_id/aadhaar_id already exists (idempotent "existing patient
 * recognition" behavior described in Screen 2).
 */
router.post("/", (req, res) => {
  const { abha_id, aadhaar_id, name, age, gender, contact, preferred_language } = req.body;

  if (!name) {
    return res.status(400).json({ error: "name is required" });
  }

  let existing = null;
  if (abha_id || aadhaar_id) {
    existing = db
      .prepare(
        `SELECT * FROM patients WHERE (abha_id = ? AND abha_id IS NOT NULL) OR (aadhaar_id = ? AND aadhaar_id IS NOT NULL) LIMIT 1`
      )
      .get(abha_id || null, aadhaar_id || null);
  }

  if (existing) {
    db.prepare(
      `UPDATE patients SET name = ?, age = ?, gender = ?, contact = ?, preferred_language = COALESCE(?, preferred_language), is_new_patient = 0, updated_at = datetime('now') WHERE id = ?`
    ).run(name, age || existing.age, gender || existing.gender, contact || existing.contact, preferred_language, existing.id);
    const updated = db.prepare(`SELECT * FROM patients WHERE id = ?`).get(existing.id);
    return res.json({ patient: updated, isNew: false });
  }

  const id = uuid();
  db.prepare(
    `INSERT INTO patients (id, abha_id, aadhaar_id, name, age, gender, contact, preferred_language, is_new_patient)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`
  ).run(id, abha_id || null, aadhaar_id || null, name, age || null, gender || null, contact || null, preferred_language || "en");

  const patient = db.prepare(`SELECT * FROM patients WHERE id = ?`).get(id);
  res.status(201).json({ patient, isNew: true });
});

router.get("/:id", (req, res) => {
  const patient = db.prepare(`SELECT * FROM patients WHERE id = ?`).get(req.params.id);
  if (!patient) return res.status(404).json({ error: "Patient not found" });
  res.json({ patient });
});

module.exports = router;
