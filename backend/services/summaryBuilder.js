const db = require("../config/db");

/**
 * Turns the raw history_responses transcript into a first-draft structured
 * clinical summary. This is what the doctor sees pre-filled on Screen 9
 * (PATIENT CLINICAL SUMMARY) as an AI-generated draft — never presented as
 * a diagnosis, always editable.
 */
function buildDraftSummary(consultationId) {
  const responses = db
    .prepare(`SELECT * FROM history_responses WHERE consultation_id = ? ORDER BY created_at ASC`)
    .all(consultationId);

  const bySection = (section) =>
    responses
      .filter((r) => r.section === section)
      .map((r) => `${r.question_text} -> ${r.answer}`)
      .join("; ");

  const hpi = bySection("hpi");
  const pastMedical = bySection("past_medical");
  const pastSurgical = bySection("past_surgical");
  const drug = bySection("drug");
  const allergy = bySection("allergy");
  const family = bySection("family");
  const personal = bySection("personal");
  const ros = bySection("ros");

  const chiefComplaint = responses.find((r) => r.question_key === "chief_complaint")?.answer || "";

  const aiSummary = [
    chiefComplaint ? `Chief complaint: ${chiefComplaint}.` : null,
    hpi ? `History of present illness: ${hpi}.` : null,
    pastMedical ? `Past medical history: ${pastMedical}.` : null,
    drug ? `Current medications: ${drug}.` : null,
    allergy ? `Allergies: ${allergy}.` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    hpi,
    past_medical_history: pastMedical,
    past_surgical_history: pastSurgical,
    drug_history: drug,
    allergy_history: allergy,
    family_history: family,
    personal_history: personal,
    review_of_systems: ros,
    ai_generated_summary:
      aiSummary || "No structured responses captured yet — doctor should take history manually.",
  };
}

/**
 * Creates (or refreshes, if not yet doctor-edited) the clinical_summaries
 * row for a consultation.
 */
function upsertDraftSummary(consultationId) {
  const { v4: uuid } = require("uuid");
  const existing = db.prepare(`SELECT * FROM clinical_summaries WHERE consultation_id = ?`).get(consultationId);
  const draft = buildDraftSummary(consultationId);

  if (!existing) {
    const id = uuid();
    db.prepare(
      `INSERT INTO clinical_summaries
       (id, consultation_id, hpi, past_medical_history, past_surgical_history, drug_history, allergy_history, family_history, personal_history, review_of_systems, ai_generated_summary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      consultationId,
      draft.hpi,
      draft.past_medical_history,
      draft.past_surgical_history,
      draft.drug_history,
      draft.allergy_history,
      draft.family_history,
      draft.personal_history,
      draft.review_of_systems,
      draft.ai_generated_summary
    );
    return db.prepare(`SELECT * FROM clinical_summaries WHERE id = ?`).get(id);
  }

  if (!existing.doctor_edited) {
    db.prepare(
      `UPDATE clinical_summaries SET hpi=?, past_medical_history=?, past_surgical_history=?, drug_history=?, allergy_history=?, family_history=?, personal_history=?, review_of_systems=?, ai_generated_summary=?, updated_at=datetime('now') WHERE consultation_id=?`
    ).run(
      draft.hpi,
      draft.past_medical_history,
      draft.past_surgical_history,
      draft.drug_history,
      draft.allergy_history,
      draft.family_history,
      draft.personal_history,
      draft.review_of_systems,
      draft.ai_generated_summary,
      consultationId
    );
  }
  return db.prepare(`SELECT * FROM clinical_summaries WHERE consultation_id = ?`).get(consultationId);
}

module.exports = { buildDraftSummary, upsertDraftSummary };
