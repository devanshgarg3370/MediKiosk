const db = require("../config/db");

/**
 * Generates a human-readable daily token like "A-014".
 * Priority (red-flag) patients get a "P-" prefixed token instead so the
 * doctor dashboard / queue display can style them distinctly (Screen 8).
 */
function generateTokenNumber(priority = "normal") {
  const todayPrefix = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const countRow = db
    .prepare(
      `SELECT COUNT(*) as count FROM consultations WHERE date(created_at) = date('now')`
    )
    .get();
  const seq = (countRow.count || 0) + 1;
  const paddedSeq = String(seq).padStart(3, "0");
  const prefix = priority === "red_flag" ? "P" : "A";
  return `${prefix}-${paddedSeq}`;
}

function getNextQueuePosition() {
  const row = db
    .prepare(
      `SELECT COUNT(*) as count FROM consultations WHERE status IN ('waiting','pending_review')`
    )
    .get();
  return (row.count || 0) + 1;
}

module.exports = { generateTokenNumber, getNextQueuePosition };
