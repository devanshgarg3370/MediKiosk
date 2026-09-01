const express = require("express");
const db = require("../config/db");
const { requireDoctorAuth } = require("../middleware/auth");

const router = express.Router();

// Very small mock drug-interaction table for demo purposes. Swap for a real
// interaction-checking API/dataset in production.
const INTERACTION_PAIRS = [
  { a: "warfarin", b: "aspirin", risk: "Increased bleeding risk" },
  { a: "metformin", b: "contrast dye", risk: "Risk of lactic acidosis" },
  { a: "ace inhibitor", b: "potassium", risk: "Risk of hyperkalemia" },
  { a: "sildenafil", b: "nitrate", risk: "Severe hypotension risk" },
];

function checkInteractions(medicationNames) {
  const lower = medicationNames.map((m) => (m || "").toLowerCase());
  const hits = [];
  for (const pair of INTERACTION_PAIRS) {
    const hasA = lower.some((m) => m.includes(pair.a));
    const hasB = lower.some((m) => m.includes(pair.b));
    if (hasA && hasB) hits.push(pair);
  }
  return hits;
}

/**
 * SCREEN 10: MEDICAL TIMELINE / DOCUMENTS
 * GET /api/timeline/:patientId
 * Chronological view across ALL of a patient's consultations: documents
 * (prescriptions, lab reports, discharge summaries), diagnoses extracted
 * from documents, medications, and abnormal lab values — plus drug
 * interaction alerts. Supports ?from=&to=&docType= filters.
 */
router.get("/:patientId", requireDoctorAuth, (req, res) => {
  const { patientId } = req.params;
  const { from, to, docType } = req.query;

  let query = `
    SELECT d.*, c.token_number, c.created_at as consultation_date
    FROM documents d
    JOIN consultations c ON c.id = d.consultation_id
    WHERE c.patient_id = ?
  `;
  const params = [patientId];

  if (from) {
    query += ` AND date(d.created_at) >= date(?)`;
    params.push(from);
  }
  if (to) {
    query += ` AND date(d.created_at) <= date(?)`;
    params.push(to);
  }
  if (docType) {
    query += ` AND d.doc_type = ?`;
    params.push(docType);
  }
  query += ` ORDER BY d.created_at DESC`;

  const documents = db.prepare(query).all(...params).map((d) => ({
    ...d,
    extracted_data: d.extracted_data ? JSON.parse(d.extracted_data) : null,
  }));

  // Pull medications mentioned across all extracted prescription/discharge
  // documents to run the mock interaction check.
  const allMedNames = [];
  const abnormalLabs = [];
  for (const doc of documents) {
    if (!doc.extracted_data) continue;
    if (doc.extracted_data.medications) {
      allMedNames.push(...doc.extracted_data.medications.map((m) => m.name));
    }
    if (doc.extracted_data.dischargeMedications) {
      allMedNames.push(...doc.extracted_data.dischargeMedications.map((m) => m.name || m));
    }
    if (doc.extracted_data.tests) {
      for (const t of doc.extracted_data.tests) {
        if (t.abnormal) abnormalLabs.push({ document_id: doc.id, ...t });
      }
    }
  }

  const interactionAlerts = checkInteractions(allMedNames);

  // Also fold in each consultation's chief complaint as a timeline event.
  const complaintEvents = db
    .prepare(
      `SELECT id, token_number, chief_complaint, created_at FROM consultations WHERE patient_id = ? AND chief_complaint IS NOT NULL ORDER BY created_at DESC`
    )
    .all(patientId);

  res.json({
    patientId,
    documents,
    abnormalLabs,
    interactionAlerts,
    consultationEvents: complaintEvents,
  });
});

module.exports = router;
