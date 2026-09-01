const express = require("express");
const db = require("../config/db");

const router = express.Router();

/**
 * GET /api/queue/:consultationId
 * Lets the kiosk/patient-facing completion screen poll for live queue
 * position and status changes (waiting -> in_consultation -> completed).
 */
router.get("/:consultationId", (req, res) => {
  const consultation = db
    .prepare(`SELECT * FROM consultations WHERE id = ?`)
    .get(req.params.consultationId);
  if (!consultation) return res.status(404).json({ error: "Consultation not found" });

  // Recompute live position: how many patients ahead are still waiting.
  const ahead = db
    .prepare(
      `SELECT COUNT(*) as c FROM consultations WHERE status = 'waiting' AND created_at < ? `
    )
    .get(consultation.created_at).c;

  res.json({
    status: consultation.status,
    tokenNumber: consultation.token_number,
    patientsAhead: consultation.status === "waiting" ? ahead : 0,
    isPriority: consultation.priority === "red_flag",
  });
});

module.exports = router;
