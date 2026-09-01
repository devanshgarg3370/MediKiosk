require("dotenv").config();
const bcrypt = require("bcryptjs");
const { v4: uuid } = require("uuid");
const db = require("../config/db");

async function seed() {
  const email = "doctor@medikiosk.demo";
  const existing = db.prepare(`SELECT id FROM doctors WHERE email = ?`).get(email);
  if (existing) {
    console.log(`Demo doctor already exists: ${email}`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash("password123", 10);
  db.prepare(
    `INSERT INTO doctors (id, name, email, password_hash, specialization) VALUES (?, ?, ?, ?, ?)`
  ).run(uuid(), "Dr. Demo", email, passwordHash, "General Medicine");

  console.log("Seeded demo doctor:");
  console.log(`  email:    ${email}`);
  console.log(`  password: password123`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
