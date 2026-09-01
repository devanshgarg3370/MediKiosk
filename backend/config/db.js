// Uses Node's built-in `node:sqlite` module instead of a third-party
// native addon (better-sqlite3). This avoids requiring a C++ build chain
// (Visual Studio Build Tools on Windows, Xcode CLT on Mac, etc.) — the
// driver ships with Node itself. Requires Node.js >= 22.5 (see
// "engines" in package.json). The API (`.exec`, `.prepare().run/get/all`)
// is intentionally near-identical to better-sqlite3, so nothing else in
// this codebase had to change.
const { DatabaseSync } = require("node:sqlite");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const dbPath = process.env.DB_PATH || "./data/medikiosk.db";
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const rawDb = new DatabaseSync(dbPath);
rawDb.exec("PRAGMA journal_mode = WAL;");
rawDb.exec("PRAGMA foreign_keys = ON;");

// Thin wrapper so route files can keep calling db.prepare(sql).run/get/all(...)
// exactly as they already do, with zero call-site changes.
const db = {
  exec: (sql) => rawDb.exec(sql),
  prepare: (sql) => rawDb.prepare(sql),
};

// ---------------------------------------------------------------------------
// SCHEMA
// Screen mapping is noted per table so it's obvious which UI screen reads/
// writes it (see README for the full flow).
// ---------------------------------------------------------------------------
db.exec(`
CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY,
  abha_id TEXT,
  aadhaar_id TEXT,
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  contact TEXT,
  is_new_patient INTEGER DEFAULT 1,
  preferred_language TEXT DEFAULT 'en',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS consents (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinical_history INTEGER DEFAULT 0,
  document_scan INTEGER DEFAULT 0,
  hospital_share INTEGER DEFAULT 0,
  abdm_integration INTEGER DEFAULT 0,
  accepted_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS consultations (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  token_number TEXT UNIQUE,
  queue_position INTEGER,
  status TEXT DEFAULT 'in_history',
    -- in_history | pending_review | waiting | in_consultation | completed
  priority TEXT DEFAULT 'normal',   -- normal | red_flag
  chief_complaint TEXT,
  assigned_doctor_id TEXT,
  submitted_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS history_responses (
  id TEXT PRIMARY KEY,
  consultation_id TEXT NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  question_key TEXT NOT NULL,
  question_text TEXT NOT NULL,
  answer TEXT,
  section TEXT,
    -- chief_complaint | hpi | past_medical | past_surgical | drug | allergy | family | personal | ros
  is_red_flag INTEGER DEFAULT 0,
  sequence INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  consultation_id TEXT NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  doc_type TEXT,  -- prescription | lab_report | discharge_summary | other
  original_filename TEXT,
  stored_filename TEXT,
  file_path TEXT,
  mime_type TEXT,
  ocr_status TEXT DEFAULT 'pending', -- pending | processing | completed | failed
  extracted_data TEXT, -- JSON string
  document_date TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS clinical_summaries (
  id TEXT PRIMARY KEY,
  consultation_id TEXT NOT NULL UNIQUE REFERENCES consultations(id) ON DELETE CASCADE,
  hpi TEXT,
  past_medical_history TEXT,
  past_surgical_history TEXT,
  drug_history TEXT,
  allergy_history TEXT,
  family_history TEXT,
  personal_history TEXT,
  review_of_systems TEXT,
  ai_generated_summary TEXT,
  ai_confidence REAL DEFAULT 0.8,
  doctor_edited INTEGER DEFAULT 0,
  is_finalized INTEGER DEFAULT 0,
  his_push_status TEXT DEFAULT 'not_pushed', -- not_pushed | pushed | failed
  abdm_link_status TEXT DEFAULT 'linked',    -- linked | not_linked | pending
  finalized_by TEXT,
  finalized_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS doctors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  specialization TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
CREATE INDEX IF NOT EXISTS idx_history_consultation ON history_responses(consultation_id);
CREATE INDEX IF NOT EXISTS idx_documents_consultation ON documents(consultation_id);
`);

module.exports = db;
