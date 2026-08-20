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

### 1.3 Defects found during the audit (fixed in Phase 0)

1. **`GET /api/ai/diseases` omits `description`** — `aiController.js:97` selects `name slug category severity specialistType symptoms`. `DiseaseListing.js` calls `disease.description?.substring(0,100)` → renders `undefined...`.
2. **Disease category enum mismatch** — the frontend filters on `Endocrine, Musculoskeletal, Hematological, Urological`; `Disease.js` has `Chronic, Digestive, Skin, Autoimmune, Other`. Those filter chips can never return results.
3. **`specialistType` values are unroutable** — diseases reference `Endocrinologist` / `Pulmonologist`, which are not in the `Doctor.specialization` enum, so "find a specialist" can never match a doctor.
4. **`GET /api/patients/:id` is wrong** — `patientRoutes.js:19` maps it to `getPatientProfile`, which looks up `Patient.findOne({ user: req.user._id })` and ignores `:id`. A doctor hitting it gets a 404 for their own missing patient profile.
5. **`PUT /api/appointments/:id` has no ownership check** — `appointmentController.js:146`; any authenticated doctor can rewrite any appointment's status/prescription.
6. **Uploaded reports are world-readable** — `app.use('/uploads', express.static(...))` serves PHI with no auth; anyone with the path reads another patient's report.
7. **Truthy-guard updates drop legitimate values** — `updateDoctorProfile` / `updatePatientProfile` use `if (value)`, so `consultationFee: 0`, `experience: 0`, or clearing `bio` are silently ignored.
8. **Doctors self-verify** — `register()` hardcodes `isVerified: true`; the medical license is never checked.
9. **Admin registration is a no-op** — `hospitalId` is destructured then thrown away; no Admin model exists, yet Signup offers an admin tab.
10. **`.env` is missing keys** read by `config/env.js`: `NODE_ENV`, `JWT_EXPIRE`, `CLIENT_URL`. A missing `JWT_SECRET` silently falls back to `fallback_secret_key`.

### 1.4 Conventions to keep

- Response envelope: `{ success, message?, data, count?, page?, pages? }` — every new endpoint must match; the frontend checks `res.data.success` everywhere.
- Auth: `Authorization: Bearer <jwt>`. A 401 makes the axios interceptor wipe the token and redirect to `/login`, so **never return 401 for authorization failures — use 403**.
- Base URL: `http://localhost:5000/api` (`REACT_APP_API_URL`).
- Every new client call goes through a named group in `frontend/src/services/api.js`.

---

## Phase 0 — Stabilise the existing API

**Goal:** everything already wired to the frontend works correctly and safely before new modules land.
**Unblocks:** DiseaseListing, UserProfile saves, all report pages.

### Tasks

1. **`src/controllers/aiController.js`** — add `description` (and `causes`, for search) to the `.select()` in `getAllDiseases`.
2. **`src/models/Disease.js`** — extend the `category` enum to the union the UI uses: `Infectious, Chronic, Respiratory, Cardiovascular, Neurological, Digestive, Skin, Autoimmune, Mental Health, Endocrine, Musculoskeletal, Hematological, Urological, Other`. Also make the slug hook run on `isNew`, not only `isModified('name')`, so `insertMany` seeds get slugs.
3. **`src/models/Doctor.js`** — extend `specialization` with `Endocrinologist, Pulmonologist, Nephrologist, Gastroenterologist, Rheumatologist, Hematologist` so `specialistType` → doctor lookup resolves.
4. **`src/routes/patientRoutes.js` + `patientController.js`** — split into `getPatientProfile` (self) and a new `getPatientById` (doctor/admin, honours `req.params.id`).
5. **`src/controllers/appointmentController.js`** — in `updateAppointment`, reject unless `appointment.doctor.equals(req.user._id)` or the role is `admin` (403).
6. **Protect uploads** — remove the static `/uploads` mount; add `GET /api/reports/:id/file` (`protect` + owner / treating-doctor / admin check) that `res.sendFile`s the stored path.
7. **Profile updates** — replace `if (x)` with `if (x !== undefined)` in `updateDoctorProfile` and `updatePatientProfile`; coerce numbers; ignore the `null` the profile form sends for cleared numeric fields.
8. **`.env` / `config/env.js`** — add `NODE_ENV`, `JWT_EXPIRE=7d`, `CLIENT_URL=http://localhost:3000`; exit on boot if `JWT_SECRET` or `MONGO_URI` is unset in production rather than falling back.
9. **Seeder** — reseed diseases with the exact 12 slugs the frontend fallback uses (`diabetes, hypertension, asthma, migraine, arthritis, covid-19, depression, anemia, pneumonia, alzheimers, kidney-stones, thyroid-disorder`) so DB data cleanly replaces the fallback.

### Acceptance criteria

- `GET /api/ai/diseases` returns `description`; all 10 DiseaseListing category chips return results.
- A doctor can `GET /api/patients/<patientId>` and receive that patient's profile.
- A doctor not on an appointment gets 403 from `PUT /api/appointments/:id`.
- `GET /uploads/<file>` 404s; `GET /api/reports/:id/file` returns the PDF only to the owner.
- Saving a profile with `consultationFee = 0` persists `0`.

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
