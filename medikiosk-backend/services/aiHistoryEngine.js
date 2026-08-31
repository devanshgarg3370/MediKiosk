/**
 * aiHistoryEngine.js
 *
 * A deterministic, rule-based "conversational AI" for patient history taking
 * (Screen 4: AI HISTORY TAKING).
 *
 * WHY RULE-BASED, NOT A REAL LLM CALL?
 * This keeps the backend fully self-contained and runnable offline/on a
 * kiosk with no external API key. The engine is intentionally structured
 * (see `askNextQuestion`) so a single call site can be swapped for a real
 * LLM/NLU service later without touching any route code.
 *
 * FLOW:
 * 1. Chief complaint (free text / voice-to-text already transcribed on client)
 * 2. Red-flag screening against the chief complaint
 * 3. Structured follow-up questions per section (HPI -> PMH -> surgical ->
 *    drug -> allergy -> family -> personal -> ROS)
 * 4. Each answer is screened for red-flag keywords too (e.g. patient
 *    mentions "chest pain" while answering an unrelated question)
 */

const RED_FLAGS = [
  { keyword: "chest pain", label: "Possible cardiac emergency" },
  { keyword: "difficulty breathing", label: "Respiratory distress" },
  { keyword: "shortness of breath", label: "Respiratory distress" },
  { keyword: "breathless", label: "Respiratory distress" },
  { keyword: "unconscious", label: "Altered consciousness" },
  { keyword: "fainted", label: "Syncope / possible emergency" },
  { keyword: "severe bleeding", label: "Active hemorrhage" },
  { keyword: "heavy bleeding", label: "Active hemorrhage" },
  { keyword: "suicidal", label: "Psychiatric emergency" },
  { keyword: "want to die", label: "Psychiatric emergency" },
  { keyword: "seizure", label: "Neurological emergency" },
  { keyword: "fits", label: "Neurological emergency" },
  { keyword: "stroke", label: "Neurological emergency" },
  { keyword: "one side weakness", label: "Possible stroke" },
  { keyword: "slurred speech", label: "Possible stroke" },
  { keyword: "severe abdominal pain", label: "Acute abdomen" },
  { keyword: "poisoning", label: "Toxicological emergency" },
  { keyword: "snake bite", label: "Envenomation emergency" },
  { keyword: "high fever with rash", label: "Possible sepsis / infectious emergency" },
  { keyword: "coughing blood", label: "Hemoptysis" },
  { keyword: "vomiting blood", label: "Hematemesis" },
];

function detectRedFlags(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  return RED_FLAGS.filter((f) => lower.includes(f.keyword)).map((f) => f.label);
}

// Ordered question script. `key` must be unique. `dependsOn` lets us branch:
// a question is skipped unless the referenced earlier answer matches.
const QUESTION_SCRIPT = [
  {
    key: "chief_complaint",
    section: "chief_complaint",
    text: "What is the main problem you are here for today?",
    inputType: "voice_or_text",
  },
  {
    key: "hpi_onset",
    section: "hpi",
    text: "When did this problem start?",
    inputType: "voice_or_choice",
    choices: ["Today", "Few days ago", "Few weeks ago", "More than a month"],
  },
  {
    key: "hpi_severity",
    section: "hpi",
    text: "On a scale of 1 to 10, how severe is it?",
    inputType: "scale",
  },
  {
    key: "hpi_progression",
    section: "hpi",
    text: "Has it been getting better, worse, or staying the same?",
    inputType: "choice",
    choices: ["Better", "Worse", "Same"],
  },
  {
    key: "past_medical",
    section: "past_medical",
    text: "Do you have any long-term illnesses like diabetes, BP, asthma, or heart disease?",
    inputType: "voice_or_choice",
    choices: ["None", "Diabetes", "Blood Pressure", "Asthma", "Heart Disease", "Other"],
  },
  {
    key: "past_surgical",
    section: "past_surgical",
    text: "Have you had any surgeries in the past?",
    inputType: "voice_or_text",
  },
  {
    key: "drug_history",
    section: "drug",
    text: "Are you currently taking any medicines regularly?",
    inputType: "voice_or_text",
  },
  {
    key: "allergy_history",
    section: "allergy",
    text: "Are you allergic to any medicines or food?",
    inputType: "voice_or_text",
  },
  {
    key: "family_history",
    section: "family",
    text: "Does anyone in your family have diabetes, BP, heart disease, or cancer?",
    inputType: "voice_or_text",
  },
  {
    key: "personal_history",
    section: "personal",
    text: "Do you smoke, drink alcohol, or use tobacco?",
    inputType: "voice_or_choice",
    choices: ["None", "Smoking", "Alcohol", "Tobacco", "More than one"],
  },
  {
    key: "ros_general",
    section: "ros",
    text: "Any other symptoms right now — fever, weight loss, weakness, or anything else bothering you?",
    inputType: "voice_or_text",
  },
];

function getQuestionByIndex(i) {
  return QUESTION_SCRIPT[i] || null;
}

function totalQuestions() {
  return QUESTION_SCRIPT.length;
}

/**
 * Decide the next question given how many have already been answered.
 * Kept simple/linear on purpose; `dependsOn` branching hooks are here for
 * future extension (e.g. skip surgical-history follow-ups if "None").
 */
function getNextStep(answeredCount) {
  const question = getQuestionByIndex(answeredCount);
  if (!question) return { done: true };
  return {
    done: false,
    progress: {
      current: answeredCount + 1,
      total: totalQuestions(),
    },
    question,
  };
}

module.exports = {
  QUESTION_SCRIPT,
  detectRedFlags,
  getNextStep,
  totalQuestions,
};
