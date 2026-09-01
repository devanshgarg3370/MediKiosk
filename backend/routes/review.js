const express = require("express");
const db = require("../config/db");
const { generateTokenNumber, getNextQueuePosition } = require("../utils/tokenGenerator");
const { upsertDraftSummary } = require("../services/summaryBuilder");

const router = express.Router();

/**
 * SCREEN 6: REVIEW & CONFIRMATION
 * GET /api/review/:consultationId
 * Aggregates everything the patient should confirm before submitting:
 * patient info, chief complaint, full history transcript, and documents.
 */
router.get("/:consultationId", (req, res) => {
  const { consultationId } = req.params;
  const consultation = db.prepare(`SELECT * FROM consultations WHERE id = ?`).get(consultationId);
  if (!consultation) return res.status(404).json({ error: "Consultation not found" });

  const patient = db.prepare(`SELECT * FROM patients WHERE id = ?`).get(consultation.patient_id);
  const history = db
    .prepare(`SELECT * FROM history_responses WHERE consultation_id = ? ORDER BY created_at ASC`)
    .all(consultationId);
  const documents = db
    .prepare(`SELECT * FROM documents WHERE consultation_id = ? ORDER BY created_at ASC`)
    .all(consultationId)
    .map((d) => ({ ...d, extracted_data: d.extracted_data ? JSON.parse(d.extracted_data) : null }));

  res.json({ consultation, patient, history, documents });
});

/**
 * PATCH /api/review/:consultationId/history/:responseId
 * Lets the patient correct an answer from the review screen ("Edit/correct
 * option") before final submission.
 */
router.patch("/:consultationId/history/:responseId", (req, res) => {
  const { responseId } = req.params;
  const { answer } = req.body;
  if (answer === undefined) return res.status(400).json({ error: "answer is required" });

  const existing = db.prepare(`SELECT * FROM history_responses WHERE id = ?`).get(responseId);
  if (!existing) return res.status(404).json({ error: "Response not found" });

  db.prepare(`UPDATE history_responses SET answer = ? WHERE id = ?`).run(String(answer), responseId);
  res.json({ updated: true });
});

/**
 * SCREEN 7: COMPLETION / QUEUE
 * POST /api/review/:consultationId/submit
 * Finalizes patient-side submission: assigns a token, sets queue position,
 * builds the AI draft clinical summary for the doctor, moves status to
 * "waiting", and pushes a live update to the doctor dashboard.
 */
router.post("/:consultationId/submit", (req, res) => {
  const { consultationId } = req.params;
  const consultation = db.prepare(`SELECT * FROM consultations WHERE id = ?`).get(consultationId);
  if (!consultation) return res.status(404).json({ error: "Consultation not found" });

  const token = generateTokenNumber(consultation.priority);
  const queuePosition = getNextQueuePosition();

  db.prepare(
    `UPDATE consultations SET status = 'waiting', token_number = ?, queue_position = ?, submitted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`
  ).run(token, queuePosition, consultationId);

  // Build the doctor-facing AI draft summary now so Screen 9 is ready
  // the moment the doctor opens the patient.
  upsertDraftSummary(consultationId);

  const updated = db.prepare(`SELECT * FROM consultations WHERE id = ?`).get(consultationId);
  const patient = db.prepare(`SELECT * FROM patients WHERE id = ?`).get(consultation.patient_id);

  const io = req.app.get("io");
  if (io) {
    io.to("doctor-dashboard").emit("queue-updated", {
      consultation: updated,
      patient,
    });
  }

  res.json({
    consultation: updated,
    tokenNumber: token,
    queuePosition,
    isPriority: consultation.priority === "red_flag",
    message:
      consultation.priority === "red_flag"
        ? "Your history has been submitted. Due to the symptoms reported, you have been marked for priority attention."
        : "Your history has been successfully submitted.",
  });
});

module.exports = router;
