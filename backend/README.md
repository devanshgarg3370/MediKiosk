# MediKiosk Backend

Backend API for **MediKiosk** — an AI-assisted patient history-taking kiosk
with a doctor dashboard. Covers all 11 screens: patient identification,
consent, AI history taking (with red-flag emergency detection), document
scanning/OCR, review & submission, queueing/tokens, and the full doctor
flow (dashboard, clinical summary, medical timeline, review/finalize).

## Stack

- **Node.js (>=22.5) + Express** — REST API
- **SQLite via `node:sqlite`** — Node's *built-in* SQLite driver (no native compilation, no Visual Studio/Xcode build tools needed — it ships with Node itself)
- **Socket.io** — real-time queue + red-flag alerts pushed to the doctor dashboard
- **Multer** — document upload handling
- **JWT + bcrypt** — doctor authentication
- Mock **OCR** and **AI history engine** — rule-based, fully self-contained, but built with a clear swap-in point for a real OCR provider / LLM later

## Quick start

Requires **Node.js 22.5 or newer** (check with `node -v`) — that's the
minimum version with the built-in `node:sqlite` module this project uses.

```bash
npm install
cp .env.example .env      # already done if you cloned this repo as-is
npm run seed               # creates a demo doctor: doctor@medikiosk.demo / password123
npm start                  # or: npm run dev (with nodemon)
```

Server runs on `http://localhost:5000` by default. Health check:
`GET /api/health`.

You'll see a one-line `ExperimentalWarning: SQLite is an experimental
feature` on startup — that's expected and harmless, it's just Node
flagging that `node:sqlite` hasn't been marked fully stable yet. No action
needed.

> **Why not `better-sqlite3`?** That package needs to compile a native
> C++ addon on install, which requires Visual Studio Build Tools on
> Windows (or Xcode Command Line Tools on Mac) and can fail on newer Node
> versions without prebuilt binaries. `node:sqlite` avoids all of that —
> it's part of Node itself, so `npm install` never touches a compiler.

## Project structure

```
medikiosk-backend/
├── server.js              # Express + Socket.io entry point
├── config/db.js            # SQLite connection + schema (auto-created on first run)
├── routes/                 # One router per screen-group
│   ├── patients.js         # Screen 2  – Patient identification
│   ├── consent.js          # Screen 3  – Consent & privacy
│   ├── history.js          # Screen 4  – AI history taking
│   ├── documents.js        # Screen 5  – Document scanning / OCR
│   ├── review.js           # Screens 6 & 7 – Review, submit, queue/token
│   ├── queue.js            # Screen 7  – Queue status polling
│   ├── doctor.js           # Screen 8  – Doctor auth + dashboard
│   ├── summary.js          # Screen 9  – Patient clinical summary
│   ├── timeline.js         # Screen 10 – Medical timeline / documents
│   └── finalize.js         # Screen 11 – Review / edit / confirm
├── services/
│   ├── aiHistoryEngine.js  # Question script + red-flag keyword detection
│   ├── ocrService.js       # Mock OCR — swap-in point for a real provider
│   └── summaryBuilder.js   # Builds the AI draft clinical summary
├── middleware/auth.js      # JWT auth guard for doctor routes
├── utils/tokenGenerator.js # Queue token + position logic
├── data/seed.js            # Creates the demo doctor account
└── uploads/                # Uploaded document files (gitignored)
```

## Data model (SQLite tables)

`patients`, `consents`, `consultations`, `history_responses`, `documents`,
`clinical_summaries`, `doctors`. See `config/db.js` for full column
definitions — every table is commented with which screen reads/writes it.

## API reference

All patient-facing (kiosk) routes are open. All `/api/doctor/*` (except
register/login) and `/api/summary`, `/api/timeline`, `/api/finalize`
routes require `Authorization: Bearer <token>` from doctor login.

### Screen 2 — Patient identification
- `POST /api/patients/lookup` `{ abha_id | aadhaar_id }` → existing patient or 404
- `POST /api/patients` `{ abha_id?, aadhaar_id?, name, age, gender, contact, preferred_language }` → creates or updates patient
- `GET /api/patients/:id`

### Screen 3 — Consent & privacy
- `POST /api/consent` `{ patient_id, clinical_history, document_scan, hospital_share, abdm_integration }` → `{ consent, canProceed }`
- `GET /api/consent/patient/:patientId`

### Screen 4 — AI history taking
- `POST /api/history/start` `{ patient_id }` → `{ consultationId, question, progress }`
- `POST /api/history/:consultationId/answer` `{ question_key, question_text, section, answer, sequence }` → next question, or `{ done: true }`, plus `{ redFlag: { detected, reasons } }`
- `GET /api/history/:consultationId` → full transcript
- `GET /api/history/:consultationId/current-step` → re-fetch current question (for "repeat question")

### Screen 5 — Document scanning
- `POST /api/documents/:consultationId` — multipart form, fields: `file`, `doc_type` (`prescription|lab_report|discharge_summary|other`)
- `GET /api/documents/:consultationId` → all documents + extracted data
- `DELETE /api/documents/:documentId`
- `GET /api/documents/file/:documentId` → raw file

### Screens 6 & 7 — Review, submit, queue
- `GET /api/review/:consultationId` → patient + history + documents, for the confirmation screen
- `PATCH /api/review/:consultationId/history/:responseId` `{ answer }` → correct an answer pre-submission
- `POST /api/review/:consultationId/submit` → assigns token + queue position, builds AI draft summary, emits `queue-updated` socket event
- `GET /api/queue/:consultationId` → poll `{ status, tokenNumber, patientsAhead, isPriority }`

### Screen 8 — Doctor dashboard
- `POST /api/doctor/register` `{ name, email, password, specialization }`
- `POST /api/doctor/login` `{ email, password }` → `{ token, doctor }`
- `GET /api/doctor/queue?status=&priority=&search=` → today's queue
- `GET /api/doctor/stats` → counts for dashboard header
- `PATCH /api/doctor/queue/:consultationId/status` `{ status }` → waiting → in_consultation → completed

### Screen 9 — Clinical summary
- `GET /api/summary/:consultationId` → structured sections + AI draft + disclaimer
- `PUT /api/summary/:consultationId` → doctor edits (marks `doctor_edited=1`)

### Screen 10 — Medical timeline
- `GET /api/timeline/:patientId?from=&to=&docType=` → documents, abnormal labs, mock drug-interaction alerts, chief-complaint events

### Screen 11 — Review / edit / confirm
- `GET /api/finalize/:consultationId` → everything needed for the last-pass screen
- `POST /api/finalize/:consultationId` → finalizes, simulates HIS/EMR push, marks consultation `completed`

## Real-time events (Socket.io)

The doctor dashboard client should connect and join a room:

```js
const socket = io("http://localhost:5000");
socket.emit("join-doctor-dashboard");

socket.on("queue-updated", ({ consultation }) => { /* refresh queue list */ });
socket.on("red-flag-alert", ({ consultationId, flags }) => { /* show urgent banner */ });
```

The patient/kiosk client does **not** need a socket connection — it polls
`GET /api/queue/:consultationId` instead, which is simpler for a kiosk UI.

## Connecting a frontend — what you need to do

The backend is complete and independent of any specific frontend, so a few
integration steps are on your side regardless of framework:

1. **Base URL & env**: point your frontend at `http://localhost:5000/api`
   (or wherever you deploy this). Put it in a `.env`/config file on the
   frontend so it's not hardcoded.
2. **CORS**: already open (`CORS_ORIGIN=*` in `.env`). For production,
   set `CORS_ORIGIN` to your actual frontend origin.
3. **State to carry between screens**: the frontend needs to hold
   `patient_id` (after Screen 2) and `consultationId` (after Screen 4
   starts) in its own state/routing (e.g. React context, route params, or
   local storage for a kiosk session) — the backend doesn't manage
   frontend navigation state.
4. **File uploads** (Screen 5): send `multipart/form-data` with a `file`
   field and a `doc_type` field — not JSON.
5. **Doctor auth**: after login, store the JWT (memory or sessionStorage
   for a shared dashboard machine — avoid localStorage on a shared/kiosk
   device) and attach `Authorization: Bearer <token>` to every
   `/api/doctor`, `/api/summary`, `/api/timeline`, and `/api/finalize`
   call.
6. **Socket.io client**: only needed on the doctor dashboard
   (`npm install socket.io-client` on that frontend).
7. **Polling vs. push on the kiosk side**: the completion/queue screen
   (Screen 7) should poll `GET /api/queue/:consultationId` every few
   seconds to update wait position — this was a deliberate choice to keep
   the kiosk client simple (no socket dependency).
8. **Swap points already marked in code** if you want real OCR/AI later:
   `services/ocrService.js` (`runOcr`) and `services/aiHistoryEngine.js`
   (`QUESTION_SCRIPT` / could be replaced with an LLM call) — same
   input/output shape, so no route changes needed.

Otherwise you can push this to GitHub and run it as-is — there's nothing
else the backend needs from you to function standalone.

## Notes on the mocked pieces

- **OCR** (`services/ocrService.js`) returns realistic placeholder
  structured data instead of running real image OCR, so the whole app is
  runnable offline/without API keys. Replace `runOcr()` with a real
  provider call (Tesseract, AWS Textract, Google Document AI, etc.) —
  same function signature and return shape.
- **AI history taking** (`services/aiHistoryEngine.js`) is a fixed,
  rule-based question script with keyword-based red-flag detection
  (chest pain, breathlessness, unconsciousness, severe bleeding, etc.),
  not a live LLM call. It's structured as a single swappable module.
- **HIS/EMR push** and **ABDM link status** (`routes/finalize.js`) are
  simulated (`hisPushSucceeded = true`) — wire in your hospital's actual
  HIS/EMR API and ABDM sandbox here.
- **Drug interaction checking** (`routes/timeline.js`) uses a tiny
  hardcoded pair list for demonstration — replace with a real
  interaction-checking dataset/API for anything beyond a prototype.

## License

MIT — do whatever you like with it for your project/submission.
