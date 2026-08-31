const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuid } = require("uuid");
const db = require("../config/db");

const router = express.Router();

/**
 * POST /api/doctors/register
 * Simple registration for seeding doctor accounts (not exposed on the
 * kiosk UI itself — used to provision Screens 8-11 access).
 */
router.post("/register", (req, res) => {
  const { name, email, password, specialization } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email and password are required" });
  }

  const existing = db.prepare(`SELECT id FROM doctors WHERE email = ?`).get(email);
  if (existing) return res.status(409).json({ error: "Doctor with this email already exists" });

  const id = uuid();
  const passwordHash = bcrypt.hashSync(password, 10);
  db.prepare(
    `INSERT INTO doctors (id, name, email, password_hash, specialization) VALUES (?, ?, ?, ?, ?)`
  ).run(id, name, email, passwordHash, specialization || null);

  res.status(201).json({ id, name, email, specialization: specialization || null });
});

/**
 * POST /api/doctors/login
 * Issues a JWT consumed by middleware/auth.js's requireDoctorAuth.
 */
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "email and password are required" });

  const doctor = db.prepare(`SELECT * FROM doctors WHERE email = ?`).get(email);
  if (!doctor || !bcrypt.compareSync(password, doctor.password_hash)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = jwt.sign(
    { id: doctor.id, name: doctor.name, email: doctor.email },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );

  res.json({ token, doctor: { id: doctor.id, name: doctor.name, email: doctor.email, specialization: doctor.specialization } });
});

module.exports = router;
