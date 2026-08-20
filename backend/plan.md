# HealthSphere — Backend Implementation Plan

**Goal:** bring the Node/Express/MongoDB backend to full parity with the React frontend that already exists in `frontend/`, phase by phase.

**Status legend:** ✅ done · ⚠️ exists but broken/incomplete · ❌ missing

---

## 1. Current state audit

### 1.1 What already exists

| Area | Files | Status |
|---|---|---|
| App bootstrap | `server.js`, `src/app.js`, `src/config/{db,env}.js` | ✅ |
| Auth | `authController` (register/login/getMe), `utils/jwt.js`, `middleware/authMiddleware.js`, `middleware/roleMiddleware.js` | ✅ |
| Models | `User`, `Patient`, `Doctor`, `Appointment`, `Report`, `Disease` | ✅ |
| Patients | profile GET/PUT, dashboard | ⚠️ |
| Doctors | list, by id, slots, profile PUT | ⚠️ |
| Appointments | book, list, by id, update, cancel | ⚠️ |
| Reports | upload + mock AI, list, by id, doctor review | ⚠️ |
| AI | symptom-check, disease list, disease by slug | ⚠️ |
| Seeder | `utils/seeder.js` (users, doctors, diseases) | ✅ |

### 1.2 Frontend → backend coverage matrix

| Page | Route | Backend today | Gap |
|---|---|---|---|
| Home | `/` | none needed | — |
| Login / Signup | `/login`, `/signup` | `POST /auth/login`, `/auth/register` | admin `hospitalId` discarded; doctors self-verify |
| SymptomChecker | `/symptoms` | `POST /ai/symptom-check` | ✅ works |
| DiseaseListing | `/diseases` | `GET /ai/diseases` | ⚠️ `description` not selected → cards render `undefined...`; category enums mismatch |
| DiseaseDetail | `/diseases/:slug` | `GET /ai/diseases/:slug` | ⚠️ falls back to hardcoded data when DB is empty |
| MedicineListing | `/medicines` | ❌ nothing | full module missing (page is 100% static) |
| MedicineDetail | `/medicines/:slug` | ❌ nothing | full module missing (page is 100% static JSX) |
| DoctorListing | `/doctors` | `GET /doctors` | ⚠️ in-memory search, no pagination meta on the search branch |
| BookAppointment | `/appointments` | `GET /doctors`, `/doctors/:id/slots`, `POST /appointments` | ✅ works |
| AppointmentHistory | `/my-appointments` | `GET /appointments`, `PUT /:id/cancel` | ✅ works |
| PatientDashboard | `/dashboard` | `GET /patients/dashboard` | ✅ works |
| DoctorDashboard | `/doc-dashboard` | `GET /appointments?status=confirmed` | ❌ no doctor stats endpoint |
| DoctorPatients | `/patients` | ❌ nothing | page renders `mockPatients` |
| DoctorSchedule | `/schedule` | ❌ nothing | page renders `mockSchedule`; model shape incompatible |
| ReportUpload | `/upload`, `/reports` | `POST /reports/upload`, `GET /reports` | ⚠️ AI analysis is mocked; no delete/download |
| ReportAnalysis | `/analysis/:id` | `GET /reports/:id` | ❌ page never calls the API; response lacks `unit`/`trend`/lab |
| AIAssistant | `/ai-assistant` | ❌ nothing | page fakes replies with `setTimeout` |
| UserProfile | `/profile` | `PUT /patients/profile`, `PUT /doctors/profile` | ⚠️ falsy values silently dropped; no avatar upload |
| NotFound | `*` | — | — |

### 1.3 Defects found during the audit

1. ✅ **`GET /api/ai/diseases` omits `description`** — `aiController.js:97` selected `name slug category severity specialistType symptoms`. `DiseaseListing.js` calls `disease.description?.substring(0,100)` → rendered `undefined...`.
2. ✅ **Seeded diseases had no slug at all** — `seeder.js` uses `Disease.insertMany()`, which bypasses the `pre('save')` slug hook entirely. Every seeded disease landed with `slug: undefined`, so `/diseases/:slug` could never resolve and the unique slug index would reject the second insert.
3. ✅ **Disease category enum mismatch** — the frontend filters on `Endocrine, Musculoskeletal, Hematological, Urological`; `Disease.js` had none of them. Those filter chips could never return results.
4. ✅ **`specialistType` values are unroutable** — diseases reference `Endocrinologist` / `Pulmonologist`, which were not in the `Doctor.specialization` enum, so "find a specialist" could never match a doctor.
5. ✅ **`GET /api/patients/:id` had no access control** — the handler does honour `:id` (an earlier draft of this plan said otherwise), but any doctor could read any patient's full medical profile, treating them or not.
6. ✅ **`PUT /api/appointments/:id` has no ownership check** — `appointmentController.js:146`; any authenticated doctor could rewrite any appointment's status/prescription.
7. ✅ **Uploaded reports are world-readable** — `app.use('/uploads', express.static(...))` served PHI with no auth; anyone with the path could read another patient's report. `GET /api/reports/:id` also let *any* doctor read *any* report.
8. ✅ **Truthy-guard updates drop legitimate values** — `updateDoctorProfile` / `updatePatientProfile` used `if (value)`, so `consultationFee: 0`, `experience: 0`, or clearing `bio` were silently ignored.
9. ⬜ **Doctors self-verify** — `register()` hardcodes `isVerified: true`; the medical license is never checked. *(Phase 1)*
10. ⬜ **Admin registration is a no-op** — `hospitalId` is destructured then thrown away; no Admin model exists, yet Signup offers an admin tab. *(Phase 1)*
11. ✅ **`.env` was missing keys** read by `config/env.js`: `NODE_ENV`, `JWT_EXPIRE`, `CLIENT_URL`. A missing `JWT_SECRET` silently fell back to `fallback_secret_key`.

### 1.4 Conventions to keep

- Response envelope: `{ success, message?, data, count?, page?, pages? }` — every new endpoint must match; the frontend checks `res.data.success` everywhere.
- Auth: `Authorization: Bearer <jwt>`. A 401 makes the axios interceptor wipe the token and redirect to `/login`, so **never return 401 for authorization failures — use 403**.
- Base URL: `http://localhost:5000/api` (`REACT_APP_API_URL`).
- Every new client call goes through a named group in `frontend/src/services/api.js`.

---

## Phase 0 — Stabilise the existing API ✅ COMPLETE

**Goal:** everything already wired to the frontend works correctly and safely before new modules land.
**Unblocks:** DiseaseListing, UserProfile saves, all report pages.

### Tasks

1. ✅ **`src/controllers/aiController.js`** — `getAllDiseases` now selects `description`, searches name **and** description, and treats `category=All` as no filter.
2. ✅ **`src/models/Disease.js`** — `category` enum extended to the union the UI uses. The slug hook now honours an explicitly supplied slug, and a new `pre('insertMany')` hook fills slugs for seeded documents.
3. ✅ **`src/utils/slugify.js`** (new) — shared slug helper; drops apostrophes rather than turning them into gaps (`Alzheimer's Disease` → `alzheimers-disease`).
4. ✅ **`src/models/Doctor.js`** — `specialization` extended with `Endocrinologist, Pulmonologist, Nephrologist, Gastroenterologist, Rheumatologist, Hematologist`.
5. ✅ **`patientController.js` / `patientRoutes.js`** — split into `getPatientProfile` (self) and `getPatientById`; a doctor may only read a patient they share an appointment with (403 otherwise), admins may read anyone.
6. ✅ **`appointmentController.js`** — `updateAppointment` rejects anyone who is not the appointment's doctor or an admin (403).
7. ✅ **Protect uploads** — static `/uploads` mount removed; `GET /api/reports/:id/file` streams the file behind an owner / treating-doctor / admin check, with a path-traversal guard. `getReportById` uses the same check, so a non-treating doctor no longer reads arbitrary reports. `Report.filePath` is stripped from JSON and replaced by a `fileUrl` virtual.
8. ✅ **Profile updates** — `undefined` checks instead of truthiness in both profile controllers; numbers coerced; `null` from a cleared numeric input leaves `consultationFee` intact (it feeds the required `Appointment.consultationFee`).
9. ✅ **`.env` / `config/env.js`** — `NODE_ENV`, `JWT_EXPIRE`, `CLIENT_URL` added; the server exits in production when `MONGO_URI` or `JWT_SECRET` is missing and warns in development. `.env.example` added.
10. ✅ **Seed data** — diseases moved to `src/utils/seedData/diseases.js`: 15 conditions with pinned slugs, covering all 12 the frontend links to plus 3 extras for the symptom checker.

### Verification (run 2026-08-20)

- 15/15 seed diseases validate against the schema; all 12 frontend slugs present; all 9 category chips return data; every `specialistType` resolves to a real `Doctor.specialization`.
- `insertMany` now produces 15/15 slugs (previously 0).
- `GET /api/health` 200 · `GET /uploads/<file>` 404 · `GET /api/reports/:id/file` 401 unauthenticated · `GET /api/patients/:id` 401 unauthenticated.
- Query checks ran against a throwaway database, which was cleaned up afterwards; the live database was only read.

### Outstanding

- **The database has no diseases and no doctors** (1 patient, 1 report, 0 doctors, 0 diseases). Nothing renders from the catalog until `npm run seed` runs — note that the seeder wipes `users`, `patients`, and `doctors` first, which would delete the existing test patient (and orphan their report, since `reports` is not cleared). Seeder v2 in Phase 9 makes this idempotent.

---

## Phase 1 — Auth, accounts, and validation

**Goal:** a production-grade auth surface plus a real validation layer.
**Unblocks:** Signup (admin tab), UserProfile (avatar, password change), session robustness.

### Tasks

1. **Validation middleware** — `express-validator` is installed but unused. Add `src/middleware/validate.js` (runs `validationResult`, returns 400 in the standard envelope) and `src/validators/{auth,appointment,report,profile}Validators.js`; wire to every mutating route.
2. **Admin model + registration** — `src/models/Admin.js` (`user`, `hospitalId`, `permissions[]`); create it in `register()`; return it from `getMe`.
3. **Doctor verification flow** — default `isVerified: false`. Unverified doctors are already excluded from `GET /doctors`; let them log in and expose `isVerified` via `getMe` so the UI can show a "pending verification" state. Admin verifies in Phase 7.
4. **New auth endpoints** (`authController` + `authRoutes`):
   - `PUT /api/auth/password` — change password (current + new).
   - `POST /api/auth/forgot-password` / `POST /api/auth/reset-password/:token` — crypto token hashed onto `User.resetPasswordToken` + `resetPasswordExpire`.
   - `POST /api/auth/logout` — stateless ack (or blacklist, if refresh tokens are added).
5. **Avatar upload** — `POST /api/auth/avatar` (multer, image-only, 2 MB) writing to `uploads/avatars/`, storing the URL on `User.avatar`.
6. **Rate limiting** — `express-rate-limit` on `/api/auth/*` (e.g. 10 requests / 15 min / IP) to blunt credential stuffing.

### Frontend follow-up

- `services/api.js`: add `authAPI.changePassword`, `forgotPassword`, `resetPassword`, `uploadAvatar`.
- `UserProfile.js`: wire the password and avatar controls.

### Acceptance criteria

- Registering with a 6-character password returns a 400 with a field-level message, not a 500.
- Admin signup creates an `Admin` document carrying `hospitalId`.
- A newly registered doctor does not appear in `GET /api/doctors` until verified.

---

## Phase 2 — Content catalog: Medicines (new module) + Diseases

**Goal:** replace the hardcoded arrays in `MedicineListing.js` / `MedicineDetail.js` and finish the disease catalog.
**Unblocks:** `/medicines`, `/medicines/:slug`, DiseaseDetail sidebars.

### 2.1 `src/models/Medicine.js`

Fields driven directly by what the two pages render:

```
name, slug (auto), genericName, summary, description,
category   enum: Pain Relief | Antibiotic | Diabetes | Cardiovascular |
                 Gastrointestinal | Allergy | Thyroid | Respiratory | Supplement | Other
type       enum: Tablet | Capsule | Syrup | Injection | Softgel | Ointment | Drops | Inhaler
prescriptionRequired  Boolean
uses[]                                      // "Primary Uses" chips
howItWorks            String                // "How it Works"
dosage: { adult, child, maxDaily, notes }   // "Dosage Guidelines"
sideEffects: { common[], serious[] }        // two-column grid
precautions[]
interactions: [{ with, effect, severity }]
quickInfo: { usedFor, safeForChildren, pregnancySafe }
relatedDiseases[]   // disease slugs   → sidebar "Used in Diseases"
alternatives[]      // medicine slugs  → sidebar "Alternative Medicines"
isActive
```

Indexes: unique `slug`; text index on `name, genericName, description`.

### 2.2 Controller / routes — `medicineController.js`, `medicineRoutes.js`, mounted at `/api/medicines`

| Method | Route | Access | Notes |
|---|---|---|---|
| GET | `/api/medicines` | public | `?search=&category=&type=&prescriptionRequired=&page=&limit=` — list-card projection |
| GET | `/api/medicines/categories` | public | distinct categories + counts, for the filter row |
| GET | `/api/medicines/:slug` | public | full detail doc, with `relatedDiseases` / `alternatives` resolved to `{name, slug}` |
| POST / PUT / DELETE | `/api/medicines[/:id]` | admin | catalog management (Phase 7 UI) |

Register `/categories` **before** `/:slug` — Express matches in declaration order.

### 2.3 Disease additions

- `GET /api/ai/diseases/categories` — same idea, for the DiseaseListing chips.
- Add `relatedMedicineSlugs[]` to `Disease` and cross-link both directions.
- `GET /api/ai/diseases/:slug/doctors` — doctors matching `specialistType`, for the DiseaseDetail CTA.

### 2.4 Seed data

Extend `utils/seeder.js` with the 12 medicines already listed in `MedicineListing.js` (paracetamol … montelukast), each with detail content modelled on the Paracetamol page.

### Frontend follow-up

```js
export const medicineAPI = {
  getAll:        (params) => api.get('/medicines', { params }),
  getBySlug:     (slug)   => api.get(`/medicines/${slug}`),
  getCategories: ()       => api.get('/medicines/categories'),
};
```

`MedicineListing.js`: drop `medicinesData`, fetch on mount, debounce `searchTerm` into the query. `MedicineDetail.js`: read `useParams().slug`, fetch, render dynamically — it is currently pure static JSX, the largest frontend change in this plan.

### Acceptance criteria

- `/medicines` renders 12 DB-backed cards; category and OTC/Rx filters hit the API.
- `/medicines/paracetamol` renders from the DB, with sidebar links resolving to real slugs.
- An unknown slug renders the not-found state instead of crashing.

---

## Phase 3 — Doctor module

**Goal:** kill `mockPatients` and `mockSchedule`; give DoctorDashboard real numbers.
**Unblocks:** `/doc-dashboard`, `/patients`, `/schedule`.

### 3.1 Schedule model change (breaking — do this first)

`Doctor.availableSlots` is `[{ day, startTime, endTime }]`, but `DoctorSchedule.js` edits **discrete 30-minute slots per day**. Replace with:

```js
weeklySchedule: [{
  day: enum[Monday..Sunday],
  enabled: Boolean,
  slots: [String],          // ["09:00","09:30", ...]
}],
slotDuration: { type: Number, default: 30 },
blockedDates: [Date],       // holidays / leave
```

`getAvailableSlots` and `bookAppointment` both read the old field — migrate them together and reseed.

### 3.2 Endpoints (`doctorController.js`)

| Method | Route | Access | Serves |
|---|---|---|---|
| GET | `/api/doctors/dashboard` | doctor | today's appointment count, week count, unique patients, pending report reviews, next appointment |
| GET | `/api/doctors/schedule` | doctor | `weeklySchedule` in the exact `{ Monday: { enabled, slots } }` shape the page holds in state |
| PUT | `/api/doctors/schedule` | doctor | bulk save behind the "Save Schedule" button |
| GET | `/api/doctors/appointments/upcoming` | doctor | next N appointments with patient name / time / reason / status (right rail of `/schedule`) |
| GET | `/api/doctors/patients` | doctor | distinct patients derived from this doctor's appointments — `?search=&status=&page=` |
| GET | `/api/doctors/patients/:patientId` | doctor | one patient's profile + appointment history + reports |
| PUT | `/api/doctors/patients/:patientId/status` | doctor | set `Active` / `Follow Up` / `Discharged` |

**Derived patient list** — aggregate `Appointment` where `doctor = req.user._id`, group by `patient`, `$lookup` `User` + `Patient`, project `{ _id, fullName, email, phone, age, gender, lastVisit, condition, status }` — the exact keys `DoctorPatients.js` already reads, so only the data source changes.

`condition` and `status` are not derivable from appointments: add a `DoctorPatientLink` collection (`doctor`, `patient`, `status`, `primaryCondition`, `notes`), upserted on first appointment.

### 3.3 Route-ordering caveat

`doctorRoutes.js` declares `GET /:id` before these new literal paths. **Register `/dashboard`, `/schedule`, `/patients` above `/:id`**, or `/api/doctors/schedule` is parsed as a doctor id and throws a CastError.

### Frontend follow-up

Extend `doctorAPI` with `getDashboard`, `getSchedule`, `saveSchedule`, `getUpcoming`, `getPatients`, `getPatientById`. Replace the mock state in `DoctorPatients.js` / `DoctorSchedule.js`, and make `handleSave` call `saveSchedule` instead of the 1.5 s `setTimeout`.

### Acceptance criteria

- A doctor's `/patients` list contains exactly the patients who booked with them.
- Toggling slots and saving persists; a patient booking that day sees the updated slots in BookAppointment.
- `/doc-dashboard` stat tiles come from the API, not placeholders.

---

## Phase 4 — Appointments completion

**Goal:** close the lifecycle both dashboards imply. Depends on Phase 3's `weeklySchedule`.

### Tasks

1. `PUT /api/appointments/:id/reschedule` — patient-initiated, re-checks availability, keeps an audit trail on the document.
2. `PUT /api/appointments/:id/confirm` and `/complete` — doctor actions with validated prescription + notes.
3. `GET /api/appointments/today` — role-aware, for both dashboards.
4. Booking rules in `bookAppointment`: reject past dates; reject days disabled in `weeklySchedule` or listed in `blockedDates`; reject a time not in that day's `slots`; cap open bookings per patient per doctor.
5. Concurrency: partial unique compound index on `{ doctor, date, time }` where `status ∈ {pending, confirmed}` — the current `findOne` pre-check races.
6. Cancellation policy: block cancels inside N hours; let a doctor cancel with a reason (`cancelledBy`, `cancellationReason`).
7. `GET /api/appointments/:id/receipt` — consultation-fee summary.

### Acceptance criteria

- Two concurrent bookings of the same slot → one 201, one 409.
- Booking a Sunday slot for a doctor with Sunday disabled → 400.

---

## Phase 5 — Reports and AI analysis

**Goal:** make `/analysis/:id` real and move parsing off the mock.
**Unblocks:** ReportAnalysis (currently entirely static).

### 5.1 Model additions — `src/models/Report.js`

```
labName, reportDate, status: enum[uploaded, processing, analyzed, failed]
aiAnalysis.findings[]: add unit, trend enum[up, down, stable], numericValue
aiAnalysis.riskScore: Number
```

`ReportAnalysis.js` renders `unit`, `range`, and a trend arrow — none of which exist server-side today.

### 5.2 Endpoints

| Method | Route | Access | Notes |
|---|---|---|---|
| GET | `/api/reports/:id/file` | owner / doctor / admin | added in Phase 0 |
| DELETE | `/api/reports/:id` | owner | removes the document and the file on disk |
| POST | `/api/reports/:id/reanalyze` | owner | re-runs the parser |
| GET | `/api/reports/:id/trends` | owner | the same parameter across past reports → chart series |
| GET | `/api/reports/pending-review` | doctor | reports awaiting a doctor comment |

### 5.3 Real parsing — `utils/reportParser.js`

Replace the mock behind the same `parseReport(filePath, type)` signature:

1. `pdf-parse` for text PDFs; `tesseract.js` OCR for images and scans.
2. Regex/dictionary extraction of lab parameters (Hemoglobin, WBC, FBS, cholesterol, …) into `{ parameter, value, unit, normalRange, status }`.
3. Status computed against a `utils/labRanges.js` reference table (age/sex aware where it matters).
4. `riskCalculator.js` consumes the findings for `riskLevel` + `riskScore`.
5. Long uploads: set `status: 'processing'`, respond 201 immediately, analyse asynchronously, let the client poll `GET /reports/:id`.
6. Optional ML hop — if `ML_SERVICE_URL` is set, POST the extracted findings to the Flask/FastAPI service sketched in `docs/ml_docs/ml_path.md` and merge its summary/recommendations; fall back to the rule engine when unreachable.

### 5.4 Storage

Cloudinary keys already sit in `.env` but nothing uses them. Add `src/config/cloudinary.js` and a `STORAGE_DRIVER=local|cloudinary` switch so deployments with ephemeral disks don't lose reports.

### Frontend follow-up

`reportAPI`: add `delete`, `reanalyze`, `getFileUrl`, `getTrends`. Rewrite `ReportAnalysis.js` to read `useParams().id`, fetch, and render `aiAnalysis.findings`, dropping its `indicators` mock.

### Acceptance criteria

- Uploading a real blood-test PDF yields findings extracted from that file, not fixtures.
- `/analysis/:id` shows the logged-in patient's own values.
- A second patient requesting the same id gets 403.

---

## Phase 6 — AI Assistant chat

**Goal:** back `/ai-assistant` with a server endpoint instead of the client-side `setTimeout` keyword match.

### Tasks

1. **`src/models/ChatSession.js`** — `user`, `messages[{ sender, text, createdAt }]`, `title`, timestamps.
2. **Endpoints** (`aiController` / `aiRoutes`):
   - `POST /api/ai/chat` → `{ message, sessionId? }` → `{ reply, sessionId, suggestions[] }`
   - `GET /api/ai/chat/sessions`, `GET /api/ai/chat/:sessionId`, `DELETE /api/ai/chat/:sessionId`
3. **Reply engine, two tiers:**
   - *Tier 1 (no external dependency):* intent router over the existing catalog — symptom intent → reuse `symptomCheck`; medicine intent → Medicine lookup; navigation intent ("how do I book") → canned help; unknown → safe fallback.
   - *Tier 2 (optional):* Claude via `@anthropic-ai/sdk` with a strict system prompt (educational only, never diagnose, always recommend a professional) and disease/medicine snippets injected as retrieved context. Gate on `AI_PROVIDER=rules|claude`.
4. **Safety layer** — an emergency-keyword list (chest pain, severe bleeding, stroke signs) short-circuits to an urgent-care message; every response carries the standard disclaimer; record `aiDisclaimerAccepted` at first chat.
5. Rate-limit chat per user (e.g. 30 messages/hour).

### Frontend follow-up

`aiAPI.chat`, `getSessions`, `getSession`, `deleteSession`; `AIAssistant.js` posts to the API, keeps `isTyping` for the in-flight state, and persists history across reloads.

### Acceptance criteria

- "I have a headache and fever" returns catalog-grounded conditions plus the disclaimer.
- "chest pain" returns the emergency response.
- Chat history survives a page refresh.

---

## Phase 7 — Admin module

**Goal:** operate the platform. Nothing in the frontend covers this yet, so new pages are required — note that Signup already offers an admin tab with nowhere to land.

### Endpoints — `adminController.js` / `adminRoutes.js` at `/api/admin` (all `protect` + `authorize('admin')`)

- `GET /stats` — users by role, appointments by status, reports uploaded, signups over time.
- `GET /users`, `PUT /users/:id/status` (activate/deactivate), `DELETE /users/:id`.
- `GET /doctors/pending`, `PUT /doctors/:id/verify` — closes the Phase 1 self-verification hole.
- CRUD for diseases and medicines (content management).
- `GET /appointments` — all, filterable.

### Frontend follow-up

New `AdminDashboard`, `AdminUsers`, `AdminDoctors`, `AdminContent` pages, `/admin/*` routes, and an admin branch in `Navbar.js`.

---

## Phase 8 — Hardening and cross-cutting concerns

1. **Security** — `helmet`, `express-mongo-sanitize`, `hpp`, global rate limiting, CORS locked to `CLIENT_URL`, cookie-based refresh tokens if session length becomes an issue.
2. **Error handling** — `src/utils/ApiError.js` + an `asyncHandler` wrapper; move Mongoose `ValidationError` / `CastError` / duplicate-key `11000` translation into the global handler in `app.js` and delete the repeated try/catch blocks.
3. **Logging** — `winston` with file + console transports, a request id per call, `morgan` piped into winston.
4. **Route protection audit** — `POST /api/ai/symptom-check` is public and unthrottled; decide between public-with-rate-limit and authenticated.
5. **Performance** — indexes on `Doctor.specialization`, `Disease.slug/category`, `Medicine.slug/category`, plus text indexes for search; replace the in-memory doctor search in `getAllDoctors` with a `$regex`/`$text` + `$lookup` aggregation so pagination is correct.
6. **Pagination contract** — one helper returning `{ count, page, pages, data }`; the doctor search branch currently returns `count` without `page`/`pages`.
7. **Notifications (optional)** — `nodemailer` for booking confirmation, cancellation, and report-ready mails.
8. **API docs** — `swagger-jsdoc` + `swagger-ui-express` at `/api/docs`; keep `backend/README.md` in sync.

---

## Phase 9 — Testing, seeding, deployment

1. **Tests** — `jest` + `supertest` + `mongodb-memory-server`:
   - auth (register / login / role guard / expired token)
   - appointment booking (double-book, past date, out-of-schedule)
   - report access control (cross-patient 403)
   - medicine / disease list + filter
   Target: every controller has at least a happy path and an authorization-failure case.
2. **Seeder v2** — idempotent with a `--fresh` flag; full medicine + disease catalog, 5 doctors with real weekly schedules, 5 patients, sample appointments and reports so every dashboard has data on a clean clone.
3. **Env matrix** — document every key in `backend/README.md`; ship `.env.example`; confirm `.env` is git-ignored (it is, via `backend/.gitignore`) and check the committed history for leaked secrets.
4. **Deployment** — `Dockerfile` + `docker-compose` (api + mongo), `NODE_ENV=production` config, MongoDB Atlas connection, a persistent volume or Cloudinary for uploads. The healthcheck at `/api/health` already exists.

---

## Suggested sequencing

```
Phase 0  ──► Phase 1  ──┬─► Phase 2 (Medicines)   ── frontend: /medicines pages
                        ├─► Phase 3 (Doctor)      ── frontend: /patients, /schedule
                        └─► Phase 5 (Reports)     ── frontend: /analysis
Phase 3  ──► Phase 4 (Appointments — needs weeklySchedule)
Phase 2  ──► Phase 6 (AI chat — grounds answers in the catalog)
Phase 1  ──► Phase 7 (Admin — needs the Admin model)
Phases 8 and 9 run alongside from Phase 2 onward.
```

Phases 2, 3, and 5 are independent of one another and can be built in parallel.

## Definition of done for the whole plan

- No `mock*` / `fallback*` / static data array remains in `frontend/src/pages/`.
- Every page in the coverage matrix loads from `/api` with loading, empty, and error states.
- No endpoint returns another user's medical data; report files are auth-gated.
- `npm test` passes in `backend/`; `npm run seed` produces a fully populated demo environment.
