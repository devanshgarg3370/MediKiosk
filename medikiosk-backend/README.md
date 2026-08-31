# MediKiosk Backend

Node.js/Express + SQLite backend for an AI-assisted patient history-taking
kiosk. Covers patient identification, consent capture, rule-based AI
history taking with red-flag screening, document OCR (mocked), and a
doctor-facing queue.

## Folder structure

```
medikiosk-backend/
├── server.js               # App entry point — wires up all routes
├── package.json
├── .env.example
├── config/
│   └── db.js                # SQLite connection + schema (patients, consents,
│                             # consultations, history_responses, documents,
│                             # clinical_summaries, doctors)
├── routes/
│   ├── patients.js          # Screen 2: Patient Identification
│   ├── consent.js           # Screen 3: Consent & Privacy
│   ├── consultations.js     # Screen 4: AI History Taking, Screen 8: Doctor Queue
│   ├── documents.js         # Screen 5: Document Scanning (upload + OCR)
│   └── doctors.js           # Doctor registration/login (issues JWT)
├── services/
│   ├── aiHistoryEngine.js   # Rule-based question script + red-flag detection
│   └── ocrService.js        # Mock OCR extractor (swap-in point for real OCR)
├── middleware/
│   └── auth.js              # requireDoctorAuth — protects doctor routes
├── utils/
│   └── queue.js             # Token number + queue position generation
└── data/                    # SQLite file + uploaded documents (gitignored)
```

## Setup

```bash
npm install
cp .env.example .env
# edit .env — set a real JWT_SECRET
npm run dev      # or: npm start
```

Server runs on `http://localhost:4000` by default. Health check: `GET /health`.

## API overview

| Screen | Method & Path | Purpose |
|---|---|---|
| 2 | `POST /api/patients/lookup` | Find existing patient by ABHA/Aadhaar |
| 2 | `POST /api/patients` | Register or update a patient |
| 2 | `GET /api/patients/:id` | Fetch a patient |
| 3 | `POST /api/consent` | Record granular consent |
| 3 | `GET /api/consent/patient/:patientId` | Consent history for a patient |
| 4 | `POST /api/consultations` | Start a consultation, get first question |
| 4 | `POST /api/consultations/:id/answers` | Submit an answer, get next question, red-flag check |
| — | `GET /api/consultations/:id` | Full consultation + history + documents |
| 8 | `GET /api/consultations?status=` | Doctor queue (requires doctor JWT) |
| 5 | `POST /api/documents` | Upload a document (multipart `file`), runs OCR |
| 5 | `GET /api/documents/consultation/:id` | Documents for a consultation |
| — | `POST /api/doctors/register` | Create a doctor account |
| — | `POST /api/doctors/login` | Get a JWT for doctor-protected routes |

Doctor-protected routes expect `Authorization: Bearer <token>`.

## Notes

- **AI history taking** (`services/aiHistoryEngine.js`) is deterministic and
  rule-based on purpose, so the kiosk runs fully offline with no external API
  key. Swap the question-selection logic for a real LLM/NLU call later
  without touching route code.
- **OCR** (`services/ocrService.js`) is currently a mock that returns
  placeholder-shaped data keyed by `doc_type`. Replace `runOcr()` with a real
  provider (Tesseract, Google Document AI, AWS Textract, etc.) — the return
  shape is what the rest of the app expects.
- Patient-facing kiosk routes (Screens 1–7) are intentionally left open,
  since the kiosk device itself is treated as the trusted client. Add
  device/session auth there before production use.
- `clinical_summaries` table exists in the schema for the doctor-review /
  finalize step (Screens 9–11) but isn't wired to routes yet — next piece to
  build.
