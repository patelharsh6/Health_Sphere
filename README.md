# 🏥 HealthSphere

A full-stack digital healthcare platform. Patients check symptoms, browse a
curated disease and medicine catalog, book appointments with verified doctors,
upload lab reports for automated analysis, and chat with a catalog-grounded AI
assistant. Doctors manage their schedule, patients, and report reviews. Admins
verify doctor licenses and curate the content catalog.

- **Frontend:** React 19 SPA (Create React App) — `frontend/`
- **Backend:** Node.js + Express + MongoDB REST API — `backend/`
- **Deployment:** Docker Compose (API + MongoDB) — `docker-compose.yml`

---

## Table of contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Seeding sample data](#seeding-sample-data)
- [Running with Docker](#running-with-docker)
- [API overview](#api-overview)
- [API conventions](#api-conventions)
- [Frontend routes](#frontend-routes)
- [Security](#security)
- [Testing](#testing)
- [Documentation](#documentation)
- [Project status](#project-status)

---

## Features

### For patients
- **Symptom checker** — symptoms are scored against the disease catalog and
  return ranked possible conditions with the matching specialist type.
- **Disease & medicine catalog** — searchable, category-filtered listings with
  detail pages; every disease page links to verified doctors who treat it.
- **Appointment booking** — pick a doctor, see real available slots from their
  weekly schedule, book, reschedule, cancel, view history, and pull a
  consultation-fee receipt. Double-booking is blocked at the database level.
- **Report upload & analysis** — upload a lab report (PDF or scan). Text PDFs
  are parsed with `pdf-parse`; scanned images fall back to Tesseract OCR. 28 lab
  parameters are extracted against sex-aware reference ranges, flagged
  low/normal/high, scored for health risk, and trended against earlier reports
  for the same patient. Reports can be re-analysed or deleted.
- **AI assistant** — a chat assistant grounded in the disease/medicine catalog.
  Runs on a deterministic rules engine by default (no API key, no quota) with an
  optional Google Gemini overlay that walks a model fallback chain and degrades
  back to rules on any error. Emergency phrases ("chest pain", stroke signs)
  short-circuit to an urgent-care reply. The chat UI has a searchable session
  history sidebar, Markdown-rendered replies, suggestion chips, and
  copy-to-clipboard on any answer.
- **Profile & auth** — registration, login, password change, forgot/reset
  password, and avatar upload.

### For doctors
- Dashboard with live stats (today, this week, unique patients, pending
  reviews, next appointment).
- Weekly schedule editor with discrete 30-minute slots and blocked dates.
- Linked-patient list with per-patient history and an Active / Follow Up /
  Discharged status.
- Confirm and complete appointments, with prescriptions and notes.
- Report review queue — annotate a patient's analysed report.
- Accounts start **unverified**: a doctor can log in but is hidden from public
  doctor listings until an admin approves their medical license.

### For admins
- Platform statistics, user management (activate / deactivate / delete).
- Doctor verification queue.
- All-appointments view.
- Disease and medicine catalog management (create / delete).

---

## Architecture

```
┌────────────────────────┐        HTTPS / JSON          ┌──────────────────────────┐
│  React 19 SPA          │ ───────────────────────────► │  Express REST API        │
│  frontend/             │  Bearer JWT in Authorization │  backend/                │
│                        │ ◄─────────────────────────── │                          │
│  react-router-dom v7   │                              │  routes → validators →   │
│  axios (services/api)  │                              │  controllers → models    │
│  AuthContext           │                              │                          │
└────────────────────────┘                              └───────────┬──────────────┘
                                                                   │
                        ┌──────────────────────────┬───────────────┴─────────────┐
                        │                          │                             │
                  ┌─────▼──────┐        ┌──────────▼─────────┐      ┌────────────▼─────────┐
                  │  MongoDB   │        │  File storage      │      │  AI tier             │
                  │  Mongoose  │        │  local uploads/ or │      │  rules engine, or    │
                  │            │        │  Cloudinary        │      │  Gemini (optional)   │
                  └────────────┘        └────────────────────┘      └──────────────────────┘
```

Request flow on the backend is uniform: `routes` mount middleware
(`protect` → `authorize(role)` → rate limiter → `express-validator` rules →
`validate`) and then a controller. Controllers throw `ApiError`s;
`middleware/errorHandler.js` translates every failure into one response
envelope. `src/config/env.js` is the **only** place `process.env` is read.

Auth is stateless JWT. The token is stored client-side in `localStorage`
(`hs_token`) and attached by an axios interceptor; `AuthContext` hydrates the
current user from `GET /api/auth/me` on mount.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, react-router-dom 7, axios, lucide-react, plain CSS per page |
| Frontend tooling | react-scripts 5 (CRA), Testing Library, web-vitals |
| Runtime | Node.js 18+ |
| API framework | Express 4 |
| Database | MongoDB 7 + Mongoose 8 |
| Auth | jsonwebtoken (JWT) + bcryptjs |
| Validation | express-validator |
| Uploads | Multer — local disk or Cloudinary (`multer-storage-cloudinary`) |
| Report parsing | pdf-parse (text PDFs) + tesseract.js (OCR for scans) |
| AI | catalog-grounded rules engine, optional `@google/generative-ai` (Gemini) |
| Security | helmet, express-mongo-sanitize, hpp, express-rate-limit, CORS allowlist |
| Logging | winston (file + console), morgan piped through it |
| API docs | swagger-jsdoc + swagger-ui-express at `/api/docs` |
| Testing | jest + supertest + mongodb-memory-server |
| Containers | Docker, Docker Compose |

---

## Repository layout

```
Health_Sphere/
├── README.md               # this file
├── docker-compose.yml      # API + MongoDB stack, secrets from backend/.env
│
├── backend/
│   ├── server.js           # entry point
│   ├── Dockerfile
│   ├── .env.example        # every key the backend reads
│   ├── plan.md             # phased implementation plan + audit log
│   ├── README.md           # full backend reference
│   ├── src/
│   │   ├── app.js          # Express app assembly
│   │   ├── config/         # db, env, logger, swagger, cloudinary
│   │   ├── models/         # User, Patient, Doctor, Admin, Appointment,
│   │   │                   # Report, Disease, Medicine, ChatSession,
│   │   │                   # DoctorPatientLink
│   │   ├── controllers/    # auth, patient, doctor, appointment, report,
│   │   │                   # medicine, ai, admin
│   │   ├── routes/         # one router per controller
│   │   ├── middleware/     # auth, role, rateLimit, validate, errorHandler
│   │   ├── validators/     # auth, appointment, report, profile
│   │   └── utils/          # jwt, ApiError, asyncHandler, paginate, slugify,
│   │                       # labRanges, reportParser, riskCalculator,
│   │                       # aiEngine, seeder, seedData/
│   ├── tests/              # auth, appointments, reports, catalog,
│   │                       # security, parser + setup/helpers
│   ├── uploads/            # local report + avatar store (git-ignored)
│   └── logs/               # winston output (git-ignored)
│
├── frontend/
│   ├── public/
│   ├── build/              # production bundle
│   └── src/
│       ├── App.js          # route table
│       ├── context/AuthContext.js
│       ├── services/api.js # axios instance + per-domain API modules
│       ├── layouts/        # Navbar, Footer
│       └── pages/          # one page component + CSS per screen,
│                           # plus pages/admin/ for the admin console
│
└── docs/                   # path/architecture notes per area
    ├── backend_docs/  frontend_docs/  ml_docs/  common_docs/
```

---

## Getting started

### Prerequisites

- Node.js **v18+**
- MongoDB running locally, or a MongoDB Atlas connection string
- (Optional) Docker + Docker Compose, if you prefer the containerised stack

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env       # then edit .env — see the table below
npm run seed               # optional: load sample data
npm run dev                # http://localhost:5000
```

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm start                  # http://localhost:3000
```

The frontend talks to `http://localhost:5000/api` by default. Point it
elsewhere with `REACT_APP_API_URL` in `frontend/.env`:

```
REACT_APP_API_URL=http://localhost:5000/api
```

The backend's CORS allowlist contains exactly one origin — `CLIENT_URL` — so if
you move the frontend off port 3000, update `CLIENT_URL` in `backend/.env` too.

### 3. Verify

- API health: <http://localhost:5000/api/health>
- Interactive API docs: <http://localhost:5000/api/docs>
- Raw OpenAPI spec: <http://localhost:5000/api/docs.json>

---

## Environment variables

All backend keys, read only through `src/config/env.js`:

| Key | Required | Default | Notes |
|---|---|---|---|
| `NODE_ENV` | no | `development` | `production` enables strict boot checks and quiets debug logs |
| `PORT` | no | `5000` | |
| `MONGO_URI` | **in production** | `mongodb://localhost:27017/healthsphere` | Server exits on boot if missing when `NODE_ENV=production` |
| `JWT_SECRET` | **in production** | insecure dev fallback | Exits in production if missing; warns in development |
| `JWT_EXPIRE` | no | `7d` | |
| `SESSION_SECRET` | no | — | Reserved; not currently read |
| `CLIENT_URL` | no | `http://localhost:3000` | The **only** allowed CORS origin, and the base for password-reset links |
| `AI_PROVIDER` | no | `rules` | `rules` = catalog-grounded engine only (no key, no quota). `gemini` = Gemini overlay, falling back to `rules` on any error |
| `GEMINI_API_KEY` | only if `AI_PROVIDER=gemini` | — | Free key, no card: <https://aistudio.google.com/apikey> |
| `GEMINI_MODEL` | no | `gemini-3.6-flash` | Tried first; on failure the engine falls back to `gemini-3.6-flash`, then `gemini-1.5-flash`, then the rules engine |
| `STORAGE_DRIVER` | no | `local` | `local` writes to `backend/uploads/`. `cloudinary` needs all three keys below and **silently downgrades to `local`** with a warning if any is missing |
| `CLOUDINARY_CLOUD_NAME` | only if cloudinary | — | |
| `CLOUDINARY_API_KEY` | only if cloudinary | — | |
| `CLOUDINARY_API_SECRET` | only if cloudinary | — | |

Frontend:

| Key | Default | Notes |
|---|---|---|
| `REACT_APP_API_URL` | `http://localhost:5000/api` | API base URL, baked in at build time |

`backend/.env` is git-ignored — and so is `.env.example`, so keep it
placeholders-only and never commit real credentials to either.

> **Uploads are not static.** Medical reports are streamed through
> `GET /api/reports/:id/file` behind an ownership check. Only
> `/uploads/avatars` is publicly mounted. With `STORAGE_DRIVER=local` the
> `uploads/` directory **is** the report store — back it up, and use a volume
> (or Cloudinary) on any host with an ephemeral disk.

---

## Seeding sample data

```bash
cd backend
npm run seed              # idempotent: adds only what is missing, deletes nothing
npm run seed -- --fresh   # DESTRUCTIVE: wipes the seeded collections first
npm run seed -- --help    # usage and test credentials
```

The default mode is safe against a database holding real accounts: it upserts by
email/slug and never resets an existing password. Use `--fresh` only for a clean
demo dataset.

Seeds 1 admin, 5 patients, 13 doctors (12 verified + 1 awaiting verification, so
the admin queue is not empty), 15 diseases, 12 medicines, 8 appointments across
past and future dates, and 4 analysed reports — including two lipid panels for
the same patient so the trends endpoint has history to compare. Doctor coverage
spans every `specialistType` the disease catalog references, so the "find a
specialist" CTA on a disease page is never a dead end; the seeder warns if that
ever stops being true.

| Role | Email | Password |
|---|---|---|
| Admin | `admin@healthsphere.com` | `Admin@1234` |
| Patient | `harsh@example.com` | `Patient@1234` |
| Doctor | `rahul.doc@healthsphere.com` | `Doctor@1234` |

---

## Running with Docker

From the repository root (secrets are read from `backend/.env`):

```bash
docker compose up --build                          # start API + MongoDB
docker compose exec api npm run seed -- --fresh    # seed the container's DB
docker compose down                                # stop; data survives in volumes
docker compose down -v                             # stop and DELETE the data
```

Named volumes back `uploads/`, `logs/`, and the database. `JWT_SECRET` must be
set in `backend/.env` — the API refuses to boot in production without it.
MongoDB is not published to the host by default; only the `api` service reaches
it. The frontend is not containerised — run it with `npm start`, or serve
`frontend/build/` from any static host.

---

## API overview

Base URL: `http://localhost:5000/api`

### Auth (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Register a user (patient / doctor / admin) |
| POST | `/login` | Public | Log in |
| GET | `/me` | Private | Current user, role profile, and `isVerified` |
| PUT | `/password` | Private | Change password (returns a rotated token) |
| POST | `/forgot-password` | Public | Request a reset token |
| POST | `/reset-password/:token` | Public | Reset the password with that token |
| POST | `/avatar` | Private | Upload an avatar (`avatar` field, image, 2 MB) |
| POST | `/logout` | Private | Stateless logout acknowledgement |

### Patients (`/api/patients`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/profile` | Patient | Own profile |
| PUT | `/profile` | Patient | Update profile |
| GET | `/dashboard` | Patient | Dashboard summary |
| GET | `/:id` | Doctor/Admin | View a patient |

### Doctors (`/api/doctors`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Public | List verified doctors (`?search=&specialization=&page=&limit=`) |
| GET | `/:id` | Public | Doctor by ID |
| GET | `/:id/slots?date=` | Public | Available slots for a date |
| PUT | `/profile` | Doctor | Update own profile |
| GET | `/dashboard` | Doctor | Stat tiles + next appointment |
| GET | `/schedule` | Doctor | Weekly schedule as `{ Monday: { enabled, slots } }` |
| PUT | `/schedule` | Doctor | Save the weekly schedule |
| GET | `/appointments/upcoming` | Doctor | Next appointments |
| GET | `/patients` | Doctor | Patients who booked with this doctor (`?search=&status=&page=`) |
| GET | `/patients/:patientId` | Doctor | One patient's profile, appointments, and reports |
| PUT | `/patients/:patientId/status` | Doctor | Set `Active` / `Follow Up` / `Discharged` |

### Appointments (`/api/appointments`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/` | Patient | Book an appointment |
| GET | `/` | Private | My appointments |
| GET | `/today` | Private | Today's appointments (role-aware) |
| GET | `/:id` | Private | Appointment detail |
| GET | `/:id/receipt` | Private | Consultation-fee receipt |
| PUT | `/:id` | Doctor/Admin | Update status / prescription |
| PUT | `/:id/reschedule` | Patient | Move to a new available slot |
| PUT | `/:id/confirm` | Doctor/Admin | Confirm a pending appointment |
| PUT | `/:id/complete` | Doctor/Admin | Complete, with prescription and notes |
| PUT | `/:id/cancel` | Private | Cancel (with a reason) |

### Reports (`/api/reports`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/upload` | Patient | Upload a medical report |
| GET | `/` | Patient | My reports |
| GET | `/pending-review` | Doctor | Reports awaiting the doctor's comment |
| GET | `/:id` | Owner/Doctor/Admin | Report with analysis |
| GET | `/:id/file` | Owner/Doctor/Admin | Stream the report file |
| GET | `/:id/trends` | Owner/Doctor/Admin | The same parameters across earlier reports |
| POST | `/:id/reanalyze` | Owner | Re-run the parser |
| DELETE | `/:id` | Owner | Delete the report and its file |
| PUT | `/:id/review` | Doctor | Review a report |

### AI (`/api/ai`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/symptom-check` | Public | Score symptoms against the disease catalog |
| GET | `/diseases` | Public | List diseases (`?search=&category=`) |
| GET | `/diseases/categories` | Public | Distinct categories, for filter chips |
| GET | `/diseases/:slug` | Public | Disease detail |
| GET | `/diseases/:slug/doctors` | Public | Verified doctors matching `specialistType` |
| POST | `/chat` | Private | Assistant reply + suggestion chips (30/hr) |
| GET | `/chat/sessions` | Private | The caller's chat sessions |
| GET | `/chat/:sessionId` | Private | One session with full history |
| DELETE | `/chat/:sessionId` | Private | Delete a session |

### Medicines (`/api/medicines`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Public | List medicines (`?search=&category=&type=&page=&limit=`) |
| GET | `/categories` | Public | Distinct categories with counts |
| GET | `/:slug` | Public | Medicine detail |

### Admin (`/api/admin`) — every route requires the `admin` role
| Method | Endpoint | Description |
|---|---|---|
| GET | `/stats` | Platform counts |
| GET | `/users` | All users |
| PUT | `/users/:id/status` | Activate / deactivate |
| DELETE | `/users/:id` | Delete a user |
| GET | `/doctors/pending` | Doctors awaiting verification |
| PUT | `/doctors/:id/verify` | Approve a doctor |
| GET | `/appointments` | All appointments |
| GET/POST/DELETE | `/content/diseases[/:id]` | Disease catalog management |
| GET/POST/DELETE | `/content/medicines[/:id]` | Medicine catalog management |

### Health check
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Server status |

---

## API conventions

Every endpoint answers with the same envelope:

```json
{ "success": true, "data": {}, "count": 0, "page": 1, "pages": 1 }
```

```json
{ "success": false, "message": "...", "errors": { "field": "why" } }
```

- List endpoints go through `utils/paginate.js`, so `count`, `page` and `pages`
  are always present — including on search branches.
- Controllers throw; `middleware/errorHandler.js` maps the failure to a status
  and the envelope above. A Mongoose `ValidationError` becomes a 400 with
  field-level `errors`, a `CastError` a 400, a duplicate key a 409.
- **Authorization failures return 403, never 401.** The web client wipes the
  session and redirects to `/login` on any 401, so a 401 for "logged in but not
  allowed" would silently sign a valid user out. `ApiError.forbidden()` exists
  to make the right choice the easy one.
- Every response carries an `X-Request-Id` (echoing the request's own if it sent
  one) which is attached to the matching log lines in `backend/logs/`.

---

## Frontend routes

| Path | Screen |
|---|---|
| `/` | Home |
| `/login`, `/signup` | Auth (full-screen — no navbar/footer) |
| `/forgot-password`, `/reset-password/:token` | Password recovery |
| `/symptoms` | Symptom checker |
| `/ai-assistant` | AI assistant chat |
| `/diseases`, `/diseases/:slug` | Disease listing / detail |
| `/medicines`, `/medicines/:slug` | Medicine listing / detail |
| `/doctors` | Doctor listing |
| `/appointments` | Book an appointment |
| `/my-appointments` | Appointment history |
| `/dashboard` | Patient dashboard |
| `/upload`, `/reports` | Report upload |
| `/analysis`, `/analysis/:id` | Report analysis |
| `/doc-dashboard` | Doctor dashboard |
| `/patients` | A doctor's linked patients |
| `/schedule` (also `/doc-schedule`, `/doc_schedule`) | Doctor schedule |
| `/profile` | User profile |
| `/admin/dashboard` | Admin overview |
| `/admin/users` | User management |
| `/admin/doctors` | Doctor verification queue |
| `/admin/content` | Disease & medicine catalog management |
| `/admin/appointments` | All appointments |
| `*` | Not found |

---

## Security

- **Helmet** security headers; **CORS** restricted to a single allowlisted
  origin (`CLIENT_URL`).
- **express-mongo-sanitize** strips operator injection from request payloads;
  **hpp** blocks HTTP parameter pollution.
- **Rate limiting** — a global limiter (600 requests / 15 min in production);
  all `/api/auth` routes are limited to 30 / 15 min / IP (10 for the credential
  endpoints); the public symptom checker is 60 / 15 min; AI chat is 30 / hour.
- **Passwords** are bcrypt-hashed. Changing or resetting a password invalidates
  every token issued before the change.
- **Password reset** stores only a SHA-256 hash of the token on
  `User.resetPasswordToken`, with a 30-minute expiry, single use.
  Forgot-password answers identically for unknown emails, so it is not an
  email-enumeration oracle. Mail delivery is not wired up yet: the reset URL is
  logged server-side and, outside production, also returned in the response body
  so the flow stays testable.
- **Doctor verification** — self-registered doctors are `isVerified: false` and
  are excluded from `GET /api/doctors` until an admin approves their license.
  They can log in, and `/me` reports `isVerified: false` so the UI can show a
  pending state.
- **PHI access control** — reports are never statically served.
  `GET /api/reports/:id/file` streams the file only to the owning patient, a
  linked doctor, or an admin. Only `uploads/avatars/` is public.
- **Validation** — every mutating route runs `express-validator` rules and
  returns `400 { success, message, errors: { field } }` on failure.

---

## Testing

```bash
cd backend
npm test              # full suite
npm run test:watch    # watch mode
npm run test:coverage # with coverage
```

**120 tests across 6 suites.** Every suite runs against a throwaway in-memory
MongoDB (`mongodb-memory-server`), so tests never touch a real database. The
first run downloads a MongoDB binary.

| Suite | Tests | Covers |
|---|---|---|
| `auth.test.js` | 20 | registration (incl. rollback), login, token rotation, reset flow, role guards |
| `appointments.test.js` | 17 | booking rules, sequential and concurrent double-booking, authorization |
| `reports.test.js` | 14 | PHI access control, file streaming, deletion |
| `catalog.test.js` | 28 | diseases, medicines, symptom checker, pagination |
| `security.test.js` | 15 | headers, CORS, injection, HPP, error envelope |
| `parser.test.js` | 26 | lab extraction, aliases, sex-aware ranges, trends, risk scoring |

The frontend has only the Create React App placeholder test
(`cd frontend && npm test`); page-level tests are not written yet.

---

## Documentation

| Where | What |
|---|---|
| <http://localhost:5000/api/docs> | Interactive Swagger UI (server running) |
| <http://localhost:5000/api/docs.json> | Raw OpenAPI spec |
| `backend/README.md` | Full backend reference — env, endpoints, structure |
| `frontend/README.md` | Frontend setup, structure, and API client reference |
| `backend/plan.md` | Phased implementation plan, audit findings, verification logs |
| `docs/` | Per-area path and architecture notes (backend, frontend, ml, common) |

---

## Project status

The implementation plan in `backend/plan.md` is **complete**. All ten phases
are done:

| Phase | Scope | Status |
|---|---|---|
| 0 | Stabilise the existing API (access control, slugs, env) | ✅ |
| 1 | Auth, accounts, validation, rate limiting | ✅ |
| 2 | Medicine module + disease catalog | ✅ |
| 3 | Doctor module (dashboard, schedule, patients) | ✅ |
| 4 | Appointment lifecycle (reschedule, confirm, complete, receipts) | ✅ |
| 5 | Report parsing, trends, and analysis | ✅ |
| 6 | AI assistant chat | ✅ |
| 7 | Admin module | ✅ |
| 8 | Hardening (security middleware, errors, logging, Swagger) | ✅ |
| 9 | Tests, idempotent seeder, Docker | ✅ |

No page in `frontend/src/pages/` renders mock or fallback data any more; every
screen loads from the API with loading, empty, and error states.

### Known gaps

- **Admin content editing** — diseases and medicines can be created and
  deleted from the admin console, but not edited (there is no `PUT` endpoint).
- **Frontend tests** — all 120 tests are backend tests.
- **Email delivery** — password-reset and appointment mail need SMTP
  credentials; the reset link is logged server-side for now.
- **Docker image build** — `docker compose config` validates, but the image
  build has not been run end to end.
- **ML service** — a separate Python service for trained models was dropped
  from scope; lab analysis runs in-process (`labRanges.js` +
  `riskCalculator.js`). `docs/ml_docs/ml_path.md` keeps the original sketch.
- **Frontend containerisation** and a production static-hosting setup.

---

## Disclaimer

HealthSphere is an academic/demo project. Its symptom checker, report analysis,
and AI assistant are informational only and are **not** a substitute for
professional medical diagnosis or treatment.
