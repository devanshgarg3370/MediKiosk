const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuid } = require("uuid");
const db = require("../config/db");
const { requireDoctorAuth } = require("../middleware/auth");

const router = express.Router();

/**
 * POST /api/doctor/register
 * Simple self-registration for demo purposes. In production this would be
 * admin-provisioned, not self-serve.
 */
router.post("/register", async (req, res) => {
  const { name, email, password, specialization } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email, and password are required" });
  }

  const existing = db.prepare(`SELECT id FROM doctors WHERE email = ?`).get(email);
  if (existing) return res.status(409).json({ error: "A doctor with this email already exists" });

  const passwordHash = await bcrypt.hash(password, 10);
  const id = uuid();
  db.prepare(
    `INSERT INTO doctors (id, name, email, password_hash, specialization) VALUES (?, ?, ?, ?, ?)`
  ).run(id, name, email, passwordHash, specialization || null);

  res.status(201).json({ id, name, email, specialization });
});

/**
 * POST /api/doctor/login
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "email and password are required" });

  const doctor = db.prepare(`SELECT * FROM doctors WHERE email = ?`).get(email);
  if (!doctor) return res.status(401).json({ error: "Invalid credentials" });

  const match = await bcrypt.compare(password, doctor.password_hash);
  if (!match) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { id: doctor.id, name: doctor.name, email: doctor.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
  );

  res.json({ token, doctor: { id: doctor.id, name: doctor.name, email: doctor.email, specialization: doctor.specialization } });
});

/**
 * SCREEN 8: DOCTOR DASHBOARD
 * GET /api/doctor/queue
 * Today's patient queue with search/filter support via query params:
 *   ?status=waiting|in_consultation|completed
 *   ?priority=red_flag
 *   ?search=name or token
 */
router.get("/queue", requireDoctorAuth, (req, res) => {
  const { status, priority, search } = req.query;

  let query = `
    SELECT c.*, p.name as patient_name, p.age, p.gender
    FROM consultations c
    JOIN patients p ON p.id = c.patient_id
    WHERE date(c.created_at) = date('now')
  `;
  const params = [];

  if (status) {
    query += ` AND c.status = ?`;
    params.push(status);
  }
  if (priority) {
    query += ` AND c.priority = ?`;
    params.push(priority);
  }
  if (search) {
    query += ` AND (p.name LIKE ? OR c.token_number LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY (c.priority = 'red_flag') DESC, c.queue_position ASC`;

  const queue = db.prepare(query).all(...params);
  res.json({ queue });
});

/**
 * GET /api/doctor/stats
 * Quick queue statistics for the dashboard header.
 */
router.get("/stats", requireDoctorAuth, (req, res) => {
  const stats = db
    .prepare(
      `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN status = 'waiting' THEN 1 ELSE 0 END) as waiting,
         SUM(CASE WHEN status = 'in_consultation' THEN 1 ELSE 0 END) as in_consultation,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
         SUM(CASE WHEN priority = 'red_flag' THEN 1 ELSE 0 END) as red_flag
       FROM consultations WHERE date(created_at) = date('now')`
    )
    .get();
  res.json({ stats });
});

/**
 * PATCH /api/doctor/queue/:consultationId/status
 * Moves a patient through waiting -> in_consultation -> completed, and
 * assigns the doctor. Broadcasts live so other doctor screens stay in sync.
 */
router.patch("/queue/:consultationId/status", requireDoctorAuth, (req, res) => {
  const { status } = req.body;
  const allowed = ["waiting", "in_consultation", "completed"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `status must be one of ${allowed.join(", ")}` });
  }

  const consultation = db.prepare(`SELECT * FROM consultations WHERE id = ?`).get(req.params.consultationId);
  if (!consultation) return res.status(404).json({ error: "Consultation not found" });

  db.prepare(
    `UPDATE consultations SET status = ?, assigned_doctor_id = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(status, req.doctor.id, req.params.consultationId);

  const updated = db.prepare(`SELECT * FROM consultations WHERE id = ?`).get(req.params.consultationId);

  const io = req.app.get("io");
  if (io) io.to("doctor-dashboard").emit("queue-updated", { consultation: updated });

  res.json({ consultation: updated });
});

module.exports = router;
