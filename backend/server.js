require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const morgan = require("morgan");
const { Server } = require("socket.io");

const patientsRouter = require("./routes/patients");
const consentRouter = require("./routes/consent");
const historyRouter = require("./routes/history");
const documentsRouter = require("./routes/documents");
const reviewRouter = require("./routes/review");
const queueRouter = require("./routes/queue");
const doctorRouter = require("./routes/doctor");
const summaryRouter = require("./routes/summary");
const timelineRouter = require("./routes/timeline");
const finalizeRouter = require("./routes/finalize");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN || "*" },
});

// Make io available to route handlers via req.app.get("io")
app.set("io", io);

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use("/uploads", express.static(process.env.UPLOAD_DIR || "./uploads"));

// ---------------------------------------------------------------------------
// ROUTES — one router per screen-group, see README for the full mapping.
// ---------------------------------------------------------------------------
app.use("/api/patients", patientsRouter);      // Screen 2
app.use("/api/consent", consentRouter);        // Screen 3
app.use("/api/history", historyRouter);        // Screen 4
app.use("/api/documents", documentsRouter);    // Screen 5
app.use("/api/review", reviewRouter);          // Screens 6 & 7
app.use("/api/queue", queueRouter);            // Screen 7 (polling)
app.use("/api/doctor", doctorRouter);          // Screen 8
app.use("/api/summary", summaryRouter);        // Screen 9
app.use("/api/timeline", timelineRouter);      // Screen 10
app.use("/api/finalize", finalizeRouter);      // Screen 11

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "medikiosk-backend", time: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Central error handler — catches multer errors (bad file type, too large)
// and anything else thrown synchronously in a route.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

// ---------------------------------------------------------------------------
// SOCKET.IO — real-time queue + red-flag alerts for the doctor dashboard.
// The kiosk client doesn't need a socket connection; only the doctor
// dashboard joins the "doctor-dashboard" room.
// ---------------------------------------------------------------------------
io.on("connection", (socket) => {
  socket.on("join-doctor-dashboard", () => {
    socket.join("doctor-dashboard");
  });
  socket.on("disconnect", () => {});
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`MediKiosk backend listening on port ${PORT}`);
});

module.exports = { app, server, io };
