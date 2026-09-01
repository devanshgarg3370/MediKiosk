const express = require("express");
const { v4: uuid } = require("uuid");
const db = require("../config/db");
const { detectRedFlags, getNextStep } = require("../services/aiHistoryEngine");

const router = express.Router();

/**
 * SCREEN 4: AI HISTORY TAKING
 * POST /api/history/start
 * Creates a consultation for the patient and returns the first AI question.
 */
router.post("/start", (req, res) => {
  const { patient_id } = req.body;
  if (!patient_id) return res.status(400).json({ error: "patient_id is required" });

  const patient = db.prepare(`SELECT id FROM patients WHERE id = ?`).get(patient_id);
  if (!patient) return res.status(404).json({ error: "Patient not found" });

  const id = uuid();
  db.prepare(
    `INSERT INTO consultations (id, patient_id, status) VALUES (?, ?, 'in_history')`
  ).run(id, patient_id);

  const step = getNextStep(0);
  res.status(201).json({ consultationId: id, ...step });
});

/**
 * POST /api/history/:consultationId/answer
 * Saves the patient's answer to the current question, screens it for
 * red-flag emergency keywords, and returns either the next question or a
 * `done: true` payload once the script is exhausted.
 */
router.post("/:consultationId/answer", (req, res) => {
  const { consultationId } = req.params;
  const { question_key, question_text, section, answer, sequence } = req.body;

  if (!question_key || answer === undefined) {
    return res.status(400).json({ error: "question_key and answer are required" });
  }

  const consultation = db.prepare(`SELECT * FROM consultations WHERE id = ?`).get(consultationId);
  if (!consultation) return res.status(404).json({ error: "Consultation not found" });

  const flags = detectRedFlags(String(answer));
  const isRedFlag = flags.length > 0 ? 1 : 0;

  db.prepare(
    `INSERT INTO history_responses (id, consultation_id, question_key, question_text, answer, section, is_red_flag, sequence)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(uuid(), consultationId, question_key, question_text || question_key, String(answer), section || null, isRedFlag, sequence ?? null);

  if (isRedFlag) {
    db.prepare(`UPDATE consultations SET priority = 'red_flag', updated_at = datetime('now') WHERE id = ?`).run(consultationId);

    // Broadcast to doctor dashboard in real time so red-flag patients are
    // visible immediately, even mid-history-taking.
    const io = req.app.get("io");
    if (io) {
      io.to("doctor-dashboard").emit("red-flag-alert", {
        consultationId,
        flags,
        answer,
        at: new Date().toISOString(),
      });
    }
  }

  // Chief complaint answer also updates the consultation's summary field.
  if (question_key === "chief_complaint") {
    db.prepare(`UPDATE consultations SET chief_complaint = ?, updated_at = datetime('now') WHERE id = ?`).run(String(answer), consultationId);
  }

  const answeredCount = db
    .prepare(`SELECT COUNT(*) as c FROM history_responses WHERE consultation_id = ?`)
    .get(consultationId).c;

  const step = getNextStep(answeredCount);

  res.json({
    saved: true,
    redFlag: isRedFlag ? { detected: true, reasons: flags } : { detected: false },
    ...step,
  });
});

/**
 * GET /api/history/:consultationId
 * Full transcript so far (used by Screen 6 REVIEW & CONFIRMATION, and by
 * the doctor's Screen 9 clinical summary as raw source data).
 */
router.get("/:consultationId", (req, res) => {
  const responses = db
    .prepare(`SELECT * FROM history_responses WHERE consultation_id = ? ORDER BY created_at ASC`)
    .all(req.params.consultationId);
  res.json({ responses });
});

/**
 * POST /api/history/:consultationId/repeat
 * Utility for the "Back / repeat question" control — just re-fetches the
 * current question given how many are already answered (no server state
 * change).
 */
router.get("/:consultationId/current-step", (req, res) => {
  const answeredCount = db
    .prepare(`SELECT COUNT(*) as c FROM history_responses WHERE consultation_id = ?`)
    .get(req.params.consultationId).c;
  res.json(getNextStep(answeredCount));
});

module.exports = router;
