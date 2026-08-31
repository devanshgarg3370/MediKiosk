const express = require("express");
const { v4: uuid } = require("uuid");
const db = require("../config/db");
const { generateTokenNumber, getNextQueuePosition } = require("../utils/queue");
const { detectRedFlags, getNextStep, totalQuestions } = require("../services/aiHistoryEngine");
const { requireDoctorAuth } = require("../middleware/auth");

const router = express.Router();

/**
 * SCREEN 4: AI HISTORY TAKING (start)
 * POST /api/consultations
 * Creates a consultation for a patient and returns the first question.
 */
router.post("/", (req, res) => {
  const { patient_id } = req.body;
  if (!patient_id) return res.status(400).json({ error: "patient_id is required" });

  const patient = db.prepare(`SELECT id FROM patients WHERE id = ?`).get(patient_id);
  if (!patient) return res.status(404).json({ error: "Patient not found" });

  const id = uuid();
  db.prepare(
    `INSERT INTO consultations (id, patient_id, status) VALUES (?, ?, 'in_history')`
  ).run(id, patient_id);

  const consultation = db.prepare(`SELECT * FROM consultations WHERE id = ?`).get(id);
  const step = getNextStep(0);
  res.status(201).json({ consultation, step });
});

/**
 * POST /api/consultations/:id/answers
 * Records one answer to the current history-taking question, screens it
 * for red flags, and returns the next question (or "done").
 */
router.post("/:id/answers", (req, res) => {
  const { question_key, question_text, answer, section } = req.body;
  const consultation = db.prepare(`SELECT * FROM consultations WHERE id = ?`).get(req.params.id);
  if (!consultation) return res.status(404).json({ error: "Consultation not found" });

  const redFlags = detectRedFlags(answer);
  const isRedFlag = redFlags.length > 0 ? 1 : 0;

  const answeredCount = db
    .prepare(`SELECT COUNT(*) as count FROM history_responses WHERE consultation_id = ?`)
    .get(req.params.id).count;

  db.prepare(
    `INSERT INTO history_responses (id, consultation_id, question_key, question_text, answer, section, is_red_flag, sequence)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(uuid(), req.params.id, question_key, question_text, answer, section, isRedFlag, answeredCount + 1);

  if (isRedFlag) {
    db.prepare(`UPDATE consultations SET priority = 'red_flag', updated_at = datetime('now') WHERE id = ?`).run(
      req.params.id
    );
  }

  if (question_key === "chief_complaint") {
    db.prepare(`UPDATE consultations SET chief_complaint = ?, updated_at = datetime('now') WHERE id = ?`).run(
      answer,
      req.params.id
    );
  }

  const newAnsweredCount = answeredCount + 1;
  const step = getNextStep(newAnsweredCount);

  // History complete -> generate token, move to pending_review, queue up.
  if (step.done) {
    const updatedConsultation = db.prepare(`SELECT * FROM consultations WHERE id = ?`).get(req.params.id);
    const tokenNumber = generateTokenNumber(updatedConsultation.priority);
    const queuePosition = getNextQueuePosition();

    db.prepare(
      `UPDATE consultations SET status = 'pending_review', token_number = ?, queue_position = ?, submitted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`
    ).run(tokenNumber, queuePosition, req.params.id);

    const finalConsultation = db.prepare(`SELECT * FROM consultations WHERE id = ?`).get(req.params.id);
    return res.json({ step, redFlags, consultation: finalConsultation });
  }

  res.json({ step, redFlags, totalQuestions: totalQuestions() });
});

router.get("/:id", (req, res) => {
  const consultation = db.prepare(`SELECT * FROM consultations WHERE id = ?`).get(req.params.id);
  if (!consultation) return res.status(404).json({ error: "Consultation not found" });
  const history = db
    .prepare(`SELECT * FROM history_responses WHERE consultation_id = ? ORDER BY sequence ASC`)
    .all(req.params.id);
  const documents = db
    .prepare(`SELECT * FROM documents WHERE consultation_id = ? ORDER BY created_at ASC`)
    .all(req.params.id);
  res.json({ consultation, history, documents });
});

/**
 * SCREEN 8: DOCTOR QUEUE (doctor-auth protected)
 * GET /api/consultations?status=waiting
 */
router.get("/", requireDoctorAuth, (req, res) => {
  const { status } = req.query;
  const rows = status
    ? db
        .prepare(
          `SELECT c.*, p.name as patient_name, p.age, p.gender
           FROM consultations c JOIN patients p ON p.id = c.patient_id
           WHERE c.status = ? ORDER BY c.priority DESC, c.created_at ASC`
        )
        .all(status)
    : db
        .prepare(
          `SELECT c.*, p.name as patient_name, p.age, p.gender
           FROM consultations c JOIN patients p ON p.id = c.patient_id
           ORDER BY c.priority DESC, c.created_at ASC`
        )
        .all();
  res.json({ consultations: rows });
});

module.exports = router;
