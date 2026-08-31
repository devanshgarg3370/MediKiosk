require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Ensures the DB file + schema exist before routes touch it.
require("./config/db");

const patientRoutes = require("./routes/patients");
const consentRoutes = require("./routes/consent");
const consultationRoutes = require("./routes/consultations");
const documentRoutes = require("./routes/documents");
const doctorRoutes = require("./routes/doctors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok", service: "medikiosk-backend" }));

app.use("/api/patients", patientRoutes);       // Screen 2
app.use("/api/consent", consentRoutes);        // Screen 3
app.use("/api/consultations", consultationRoutes); // Screens 4, 8
app.use("/api/documents", documentRoutes);     // Screen 5
app.use("/api/doctors", doctorRoutes);         // Screens 8-11 auth

// Fallback 404
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`MediKiosk backend running on port ${PORT}`);
});
