const express = require("express");
const db = require("../config/db");
const { requireDoctorAuth } = require("../middleware/auth");

const router = express.Router();

/**
 * SCREEN 11: REVIEW / EDIT / CONFIRM
 * GET /api/finalize/:consultationId
 * Full structured history + current consent/ABDM linkage status, ready
 * for the doctor's last-pass edit before finalizing.
 */
router.get("/:consultationId", requireDoctorAuth, (req, res) => {
  const { consultationId } = req.params;
  const consultation = db.prepare(`SELECT * FROM consultations WHERE id = ?`).get(consultationId);
  if (!consultation) return res.status(404).json({ error: "Consultation not found" });

  const patient = db.prepare(`SELECT * FROM patients WHERE id = ?`).get(consultation.patient_id);
  const summary = db.prepare(`SELECT * FROM clinical_summaries WHERE consultation_id = ?`).get(consultationId);
  const consent = db
    .prepare(`SELECT * FROM consents WHERE patient_id = ? ORDER BY created_at DESC LIMIT 1`)
    .get(consultation.patient_id);
  const documents = db
    .prepare(`SELECT * FROM documents WHERE consultation_id = ?`)
    .all(consultationId)
    .map((d) => ({ ...d, extracted_data: d.extracted_data ? JSON.parse(d.extracted_data) : null }));

  res.json({ consultation, patient, summary, consent, documents });
});

/**
 * POST /api/finalize/:consultationId
 * "Confirm final history" -> saves the record, simulates pushing to
 * HIS/EMR, and marks the consultation completed. This is the terminal
 * action of the whole flow.
 */
router.post("/:consultationId", requireDoctorAuth, (req, res) => {
  const { consultationId } = req.params;
  const summary = db.prepare(`SELECT * FROM clinical_summaries WHERE consultation_id = ?`).get(consultationId);
  if (!summary) return res.status(404).json({ error: "No clinical summary to finalize" });

  // Simulate a push to the Hospital Information System / EMR. Swap this
  // block for a real HIS/EMR integration call.
  const hisPushSucceeded = true;

  db.prepare(
    `UPDATE clinical_summaries
     SET is_finalized = 1, his_push_status = ?, finalized_by = ?, finalized_at = datetime('now'), updated_at = datetime('now')
     WHERE consultation_id = ?`
  ).run(hisPushSucceeded ? "pushed" : "failed", req.doctor.id, consultationId);

  db.prepare(
    `UPDATE consultations SET status = 'completed', updated_at = datetime('now') WHERE id = ?`
  ).run(consultationId);

  const updatedSummary = db.prepare(`SELECT * FROM clinical_summaries WHERE consultation_id = ?`).get(consultationId);
  const updatedConsultation = db.prepare(`SELECT * FROM consultations WHERE id = ?`).get(consultationId);

  const io = req.app.get("io");
  if (io) io.to("doctor-dashboard").emit("queue-updated", { consultation: updatedConsultation });

  res.json({
    finalized: true,
    consultation: updatedConsultation,
    summary: updatedSummary,
  });
});

module.exports = router;
