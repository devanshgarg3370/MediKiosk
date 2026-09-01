const express = require("express");
const db = require("../config/db");
const { requireDoctorAuth } = require("../middleware/auth");
const { upsertDraftSummary } = require("../services/summaryBuilder");

const router = express.Router();

/**
 * SCREEN 9: PATIENT CLINICAL SUMMARY
 * GET /api/summary/:consultationId
 * Returns demographics, chief complaint, structured history sections, the
 * AI-generated draft summary, and prior investigations (documents).
 * Always regenerates the AI draft if the doctor hasn't edited it yet, so
 * late-arriving history answers are reflected.
 */
router.get("/:consultationId", requireDoctorAuth, (req, res) => {
  const { consultationId } = req.params;
  const consultation = db.prepare(`SELECT * FROM consultations WHERE id = ?`).get(consultationId);
  if (!consultation) return res.status(404).json({ error: "Consultation not found" });

  const patient = db.prepare(`SELECT * FROM patients WHERE id = ?`).get(consultation.patient_id);
  const summary = upsertDraftSummary(consultationId);
  const priorInvestigations = db
    .prepare(`SELECT * FROM documents WHERE consultation_id = ? ORDER BY created_at ASC`)
    .all(consultationId)
    .map((d) => ({ ...d, extracted_data: d.extracted_data ? JSON.parse(d.extracted_data) : null }));

  res.json({
    patient,
    consultation,
    summary,
    priorInvestigations,
    aiDisclaimer:
      "This summary was assembled by an AI assistant from patient-reported answers and scanned documents. It is a DRAFT for clinician review only — not an autonomous diagnosis. Verify and edit before relying on it.",
  });
});

/**
 * PUT /api/summary/:consultationId
 * Doctor edits/accepts sections of the summary (Screen 9's Edit / Accept /
 * Reject controls). Marking doctor_edited=1 stops the AI draft from being
 * silently overwritten on subsequent GETs.
 */
router.put("/:consultationId", requireDoctorAuth, (req, res) => {
  const { consultationId } = req.params;
  const fields = [
    "hpi",
    "past_medical_history",
    "past_surgical_history",
    "drug_history",
    "allergy_history",
    "family_history",
    "personal_history",
    "review_of_systems",
    "ai_generated_summary",
  ];

  const existing = db.prepare(`SELECT * FROM clinical_summaries WHERE consultation_id = ?`).get(consultationId);
  if (!existing) return res.status(404).json({ error: "Summary not found. Has the patient submitted their history yet?" });

  const updates = {};
  for (const f of fields) {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  }

  const setClause = Object.keys(updates).map((k) => `${k} = ?`).join(", ");
  if (setClause) {
    db.prepare(
      `UPDATE clinical_summaries SET ${setClause}, doctor_edited = 1, updated_at = datetime('now') WHERE consultation_id = ?`
    ).run(...Object.values(updates), consultationId);
  }

  const updated = db.prepare(`SELECT * FROM clinical_summaries WHERE consultation_id = ?`).get(consultationId);
  res.json({ summary: updated });
});

module.exports = router;
