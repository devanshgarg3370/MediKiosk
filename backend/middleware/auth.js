const jwt = require("jsonwebtoken");

/**
 * Protects the doctor-facing routes (Screens 8-11). Patient-facing kiosk
 * routes (Screens 1-7) are intentionally left open since the kiosk itself
 * is the "authenticated device" in this design — swap in device/session
 * auth there if needed for production.
 */
function requireDoctorAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing authentication token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.doctor = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { requireDoctorAuth };
