# HealthSphere — Backend Implementation Plan

**Goal:** bring the Node/Express/MongoDB backend to full parity with the React frontend that already exists in `frontend/`, phase by phase.

**Status legend:** ✅ done · ⚠️ exists but broken/incomplete · ❌ missing

---

## 1. Current state audit

### 1.1 What already exists

| Area | Files | Status |
|---|---|---|
| App bootstrap | `server.js`, `src/app.js`, `src/config/{db,env}.js` | ✅ |
| Auth | `authController` (register/login/getMe/password/reset/avatar/logout), `utils/jwt.js`, `middleware/{authMiddleware,roleMiddleware,rateLimit,validate}.js`, `validators/` | ✅ |
| Models | `User`, `Patient`, `Doctor`, `Admin`, `Appointment`, `Report`, `Disease` | ✅ |
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
| Login / Signup | `/login`, `/signup` | `POST /auth/login`, `/auth/register` | ✅ works |
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
| UserProfile | `/profile` | `PUT /patients/profile`, `PUT /doctors/profile`, `PUT /auth/password`, `POST /auth/avatar` | ✅ works |
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
9. ✅ **Doctors self-verify** — `register()` hardcoded `isVerified: true` and the medical license was never checked. Self-registered doctors now land `isVerified: false`.
10. ✅ **Admin registration is a no-op** — `hospitalId` was destructured then thrown away. `Admin` model added; `register()` creates the document and `getMe` returns it.
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

## Phase 1 — Auth, accounts, and validation ✅ COMPLETE

**Goal:** a production-grade auth surface plus a real validation layer.
**Unblocks:** Signup (admin tab), UserProfile (avatar, password change), session robustness.

### Tasks

1. ✅ **Validation middleware** — `src/middleware/validate.js` runs `validationResult` and returns `400 { success, message, errors: { field } }`; `message` carries the first failure so existing `alert(message)` paths still read well. It also unlinks whatever multer already wrote, so a rejected multipart request leaves no orphaned file on disk. `src/validators/{auth,appointment,report,profile}Validators.js` are wired to every mutating route, and to `:id` params so a malformed ObjectId is a 400 instead of a CastError 500. Enum rules read `schema.path(...).enumValues` off the models, so they cannot drift from the schema.
2. ✅ **Admin model + registration** — `src/models/Admin.js` (`user`, `hospitalId`, `permissions[]`, defaulting to everything except `manage_users`); created in `register()` and returned by `getMe`. Profile creation is now rolled back if it throws, so a failed signup no longer strands a `User` whose email could never be registered again.
3. ✅ **Doctor verification flow** — self-registered doctors are `isVerified: false`. They can still log in; `login` and `getMe` both return a top-level `isVerified` (always `true` for non-doctors, so the UI gates on one flag), `register` answers with a "pending verification" message, and `UserProfile` shows a pending banner. Admin verifies in Phase 7.
4. ✅ **New auth endpoints** (`authController` + `authRoutes`):
   - `PUT /api/auth/password` — returns **403**, not 401, on a wrong current password, so the axios interceptor does not wipe a valid session. Responds with a rotated token.
   - `POST /api/auth/forgot-password` / `POST /api/auth/reset-password/:token` — `crypto.randomBytes(32)`, SHA-256 hashed onto `User.resetPasswordToken` with a 30-minute `resetPasswordExpire`, single use. Forgot-password answers identically for unknown emails so it is not an email-enumeration oracle. Mail delivery lands in Phase 8; until then the URL is logged server-side and, outside production, returned in the response so the flow is testable.
   - `POST /api/auth/logout` — stateless ack. The client passes its token explicitly, because it clears local storage first and the request interceptor would otherwise find nothing to attach.
5. ✅ **Avatar upload** — `POST /api/auth/avatar` (multer, JPEG/PNG/WebP, 2 MB) writes `<userId>-<timestamp>.<ext>` to `uploads/avatars/` and stores `/uploads/avatars/<file>` on `User.avatar`; the replaced file is deleted. `app.js` mounts `/uploads/avatars` statically — scoped to that one directory, so medical reports stay behind `GET /api/reports/:id/file`.
6. ✅ **Rate limiting** — `express-rate-limit` across `/api/auth/*`: 30 requests / 15 min / IP, tightened to 10 for register, login, forgot-password and reset-password. Limits are relaxed 10× outside production so manual testing cannot lock itself out, and 429 responses use the standard envelope (a 401 there would have tripped the redirect interceptor).
7. ✅ **Session robustness (added)** — `User.passwordChangedAt` plus a check in `authMiddleware` reject any token issued before a password change or reset, so a stolen token stops working the moment the owner resets.

### Frontend follow-up

- ✅ `services/api.js`: `authAPI.changePassword`, `forgotPassword`, `resetPassword`, `uploadAvatar`, `logout`, plus an `assetUrl()` helper — static files are served from the server root, not under `/api`.
- ✅ `AuthContext`: `changePassword` (stores the rotated token — without it the next request 401s and bounces to `/login`), `uploadAvatar`, an `isVerified` flag, and `refreshProfile` now goes through `getMe`, which fixes doctors and admins silently not refreshing.
- ✅ `UserProfile.js`: avatar picker with client-side type and size checks, and a change-password modal mirroring the server's strength rule.

### Verification (run 2026-08-20)

67/67 checks passed against a throwaway database (`phase1_scratch`), dropped afterwards; the live database was untouched. Covered: field-level validation failures, patient/doctor/admin registration, the verification gate against `GET /api/doctors`, password change with token rotation and old-token rejection, the full forgot/reset cycle including single use and hash-only storage, avatar upload (type, size, replacement cleanup, public serving, path traversal), logout, validators on the appointment/report/profile routes with Phase 0's zero-and-null behaviour intact, and rate limiting.

### Acceptance criteria

- ✅ Registering with a 6-character password returns a 400 with a field-level message, not a 500.
- ✅ Admin signup creates an `Admin` document carrying `hospitalId`.
- ✅ A newly registered doctor does not appear in `GET /api/doctors` until verified.

### Outstanding

- **No `/forgot-password` or `/reset-password/:token` page exists in the frontend.** The backend builds `${CLIENT_URL}/reset-password/:token`, so that link currently lands on `NotFound`. Those pages were not in this phase's frontend follow-up list — the reset flow works end to end through the API, but not yet from the UI.
- Seeded doctors are still created `isVerified: true` on purpose, so a freshly seeded demo has bookable doctors. Only self-registration is gated.

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

---

## Post-Phase-7 audit (2026-08-22)

Verified against the running app, not just the code. Corrections to earlier notes:

### Fixed in this pass

1. ✅ **`adminRoutes.js` imported `authorize` from `authMiddleware`**, which only exports `protect` — `TypeError: authorize is not a function` at require time. **The entire server refused to boot.** Now imported from `roleMiddleware`.
2. ✅ **Phase 6 overwrote `aiController.js` / `aiRoutes.js`**, deleting `symptom-check`, `diseases`, `diseases/categories`, `diseases/:slug` and `diseases/:slug/doctors` — all five still called by the frontend. Recovered from `6032e97` and merged with the chat handlers. `router.use(protect)` was also blanket-gating the public catalog; `protect` is now per-route on the chat endpoints only.
3. ✅ **All 5 admin pages imported `../../../services/api`** (one level too deep), so `react-scripts build` failed outright — the frontend had not compiled since `0198bb9`. Fixed to `../../services/api`; build now succeeds.
4. ✅ **`fallbackDiseases` removed** from `DiseaseListing.js` (12 fixtures) and `DiseaseDetail.js` (222 lines). These were masking gap 2 — the pages looked fine while the API 404'd. Both now show real loading / error / empty states, and DiseaseListing sources its category chips from `GET /ai/diseases/categories` instead of a hardcoded list that had drifted from the enum.
5. ✅ **AI assistant reworked.** Provider is now Gemini (free tier) via `@google/generative-ai`; `@anthropic-ai/sdk` removed along with the retired `claude-3-haiku-20240307` id. Tier 1 is the real catalog-grounded intent router the plan specified — it queries `Disease` and `Medicine`, reuses the symptom-overlap scoring, and returns the `suggestions[]` the contract promised. Tier 2 injects retrieved catalog snippets so Gemini answers from our data, and falls back to Tier 1 on any error (quota, network, safety block). Emergency keywords short-circuit before either tier.
6. ✅ **`ML_SERVICE_URL` dropped from the plan.** Phase 5.6 assumed a self-built Python microservice, not a third-party API. `labRanges.js` + `riskCalculator.js` already do this in-process; a second deployable is not worth it here.
7. ✅ **Report parsing made real.** `labRanges.js` grew from 5 parameters to 28, each with the aliases real labs actually print (`Hb`, `Haemoglobin`, `HGB`, `TLC`, `PCV`, `SGPT (ALT)`, …) and sex-specific ranges where they genuinely differ. `reportParser.js` now matches line-by-line and skips the reference-range column — the old regex would read `13.5` out of `Hb 11.2 g/dL 13.5 - 17.5`. Verified: 17 parameters extracted from a realistic panel where the old parser managed 5. Trends are computed against the patient's previous report with a 5% noise threshold, replacing the hardcoded `trend: 'stable'`; with no history the field is left empty rather than claiming stability. The mock fixture text for unsupported formats is gone — it throws honestly. Summary and recommendations are derived from the specific parameters that came back abnormal.
8. ✅ **`riskCalculator.js` rescored.** The flat `+20` per abnormality broke once extraction improved: 5 mild deviations scored 100 and reported `critical`. Now a weighted proportion of the panel, with a floor so one critical value is not diluted, and a `MIN_PANEL` guard so a scan yielding a single mildly-abnormal value does not score 100.
9. ✅ **`/forgot-password` and `/reset-password/:token` pages added**, wired into `App.js`, and the dead `<a href="#">Forgot Password?</a>` in `Login.js` now links to them. `ResetPassword.js` mirrors the server's `STRONG_PASSWORD` rule so the user never eats a surprise 400.
10. ✅ **Env centralised.** `AI_PROVIDER`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `STORAGE_DRIVER` and `CLOUDINARY` are exported from `config/env.js`; nothing outside it reads `process.env` any more. `STORAGE_DRIVER=cloudinary` downgrades to local with a warning when the keys are incomplete, rather than booting a half-configured uploader. `.env.example` is a real placeholder template again — it had been overwritten with live credentials (it is gitignored, and all 89 commits were scanned: no secret was ever committed).

### Corrections to the Phase 0 "Outstanding" note

- **The database is not empty.** It holds 15 diseases, 12 medicines and 6 doctors. **Do not run `npm run seed`** — it still `deleteMany`s users/patients/doctors and would destroy the existing accounts. Seeder v2 remains outstanding.
- 6 of the 10 `specialistType` values diseases point to have no matching verified doctor (`Endocrinologist`, `Hematologist`, `Psychiatrist`, `Pulmonologist`, `Rheumatologist`, `Urologist`), so `GET /ai/diseases/:slug/doctors` correctly returns `[]` on those pages. This is a data gap, not a bug — it needs an additive doctor seed that does not wipe users.

### Still outstanding

- **Phase 8**: `helmet`, `express-mongo-sanitize`, `hpp`, global rate limiting, `winston`, `ApiError`/`asyncHandler` (61 duplicated try/catch blocks across 8 controllers), swagger at `/api/docs`. `getAllDoctors` still filters and paginates **in memory**, and its search branch returns `count` with no `page`/`pages`.
- **Phase 9**: no `jest`/`supertest`/`mongodb-memory-server`, no `tests/`, no `npm test`, no `Dockerfile`/`docker-compose`. Seeder v2 (idempotent, `--fresh`, sample appointments and reports) not started.
- Admin content management has POST + DELETE but no PUT — diseases and medicines can be created and deleted, not edited.

---

## Phases 8 & 9 (2026-08-22)

Both phases are now complete. `npm test` passes: **120 tests across 6 suites**,
all against an in-memory MongoDB, so the suite never touches a real database.

### Phase 8 — Hardening

1. Security middleware in `app.js`: `helmet`, `express-mongo-sanitize`
   (`$`/`.` keys stripped, so `{"email": {"$gt": ""}}` can no longer be an auth
   bypass), `hpp` (a duplicated `?page=1&page=2` no longer arrives as an array),
   and a global rate limiter (600/15min in production, skipped under test).
   **CORS is now an allowlist** — the previous `cors({ origin: CLIENT_URL })`
   plus `credentials: true` is fine, but an unrecognised Origin is now rejected
   outright rather than reflected.
2. `utils/ApiError.js` + `utils/asyncHandler.js` + `middleware/errorHandler.js`.
   **61 duplicated try/catch blocks across 8 controllers are gone**; the 3 that
   remain do real work (the `register()` rollback, and two domain-specific 409s
   for double-booking). Mongoose `ValidationError` → 400 with field-level
   `errors`, `CastError` → 400, duplicate key → 409, JWT errors → 401. Handlers
   are wrapped at the export site, so a rejected promise can no longer hang a
   request. `ApiError.forbidden()` exists to keep authorization failures at 403,
   since the client signs the user out on any 401.
3. `config/logger.js` — winston with rotating file transports plus a coloured
   console, morgan piped through it, and an `X-Request-Id` on every response
   (echoing the caller's if supplied) tying a response to its log lines.
4. Route protection audit: `/api/ai/symptom-check` is public but now
   rate-limited separately (60/15min in production); chat stays at 30/hour.
5. Indexes added for the real access paths: `Doctor {isVerified, specialization,
   rating}`, `Disease {category, name}` + `{specialistType}` + text,
   `Medicine {category, name}` + `{isActive, category}`, `User {role, isActive}`,
   `Report {status, createdAt}`.
6. **`getAllDoctors` rewritten as a `$lookup` + `$facet` aggregation.** It used
   to load every verified doctor and filter in memory, and its search branch
   returned `count` with no `page`/`pages` — the client pager silently broke on
   any search. It also crashed on `doc.user.fullName` when a doctor's User had
   been deleted; the `$unwind` now skips those. Search input is regex-escaped,
   so `?search=.*` matches nothing instead of everything.
7. `utils/paginate.js` — one contract (`parsePagination` + `paginated`) so
   `count`/`page`/`pages` are always present, and a nonsense `?page=-1&limit=abc`
   is clamped rather than producing an unbounded query.
8. Swagger at `/api/docs` (UI) and `/api/docs.json` (raw spec): **61 operations
   across all 8 tags**, annotated next to the routes they describe.
   Two traps worth remembering — `swagger-jsdoc`'s `apis` glob needs forward
   slashes (`path.resolve` on Windows yields backslashes and the spec builds
   with **zero** operations and no error), and a `description` containing `": "`
   must be quoted or the whole file is dropped with a YAMLSemanticError.

**Not done:** nodemailer. Phase 8 listed it as optional, it needs SMTP
credentials that do not exist here, and the reset flow already works end to end
through the UI (the link is logged server-side and returned in the response
outside production).

### Phase 9 — Testing, seeding, deployment

1. **120 tests, 6 suites** (`jest` + `supertest` + `mongodb-memory-server`):
   - `auth.test.js` (20) — registration incl. the profile-creation rollback,
     login, token handling, the reset cycle, role guards
   - `appointments.test.js` (17) — booking rules, sequential *and concurrent*
     double-booking, slot release on cancel, authorization
   - `reports.test.js` (14) — PHI access control across owner / treating doctor /
     stranger / admin, file streaming, deletion, uploads not served statically
   - `catalog.test.js` (28) — diseases, medicines, symptom checker, and the
     pagination contract on both list and search branches
   - `security.test.js` (15) — headers, CORS, NoSQL injection, HPP, error envelope
   - `parser.test.js` (26) — lab extraction, aliases, sex-aware ranges, trends,
     risk scoring
2. **Seeder v2** — idempotent by default (upserts by email/slug, never deletes,
   never resets an existing password), with `--fresh` for a clean wipe and
   `--help` for usage. Verified idempotent: a second run changes no counts, and
   `--fresh` reproduces the dataset exactly. Now seeds 1 admin, 5 patients,
   13 doctors, 15 diseases, 12 medicines, 8 appointments (past and future) and
   4 analysed reports — including two lipid panels for one patient so the trends
   endpoint has history. **It also closes the specialist gap**: every
   `specialistType` the disease catalog references now has a verified doctor, so
   the "find a specialist" CTA is never a dead end, and the seeder warns if that
   stops being true.
3. **Env matrix** documented in `backend/README.md` — every key, whether it is
   required, its default, and its failure mode. `.env` and `.env.example` are
   both git-ignored; all 89 commits were scanned and no secret was ever
   committed. `logs/` and `coverage/` added to `.gitignore`.
4. **Deployment** — `backend/Dockerfile` (multi-stage, `npm ci --omit=dev`,
   non-root `node` user, `dumb-init` as PID 1 so `docker stop` is a clean
   SIGTERM, healthcheck reusing `/api/health`), `.dockerignore`, and a root
   `docker-compose.yml` (api + mongo, named volumes for uploads/logs/db,
   `depends_on: service_healthy`, secrets read from `backend/.env`).
   `docker compose config` validates. **The image build is unverified** —
   Docker Desktop was not running on this machine.

### Bug found and fixed while writing the tests

**Unverified doctors were bookable.** `GET /api/doctors` hides them, but
`POST /api/appointments` never checked `isVerified`, so anyone holding a Doctor
profile id could book a doctor whose medical license had never been approved —
defeating the whole Phase 1 verification gate. `bookAppointment` now returns 403
for an unverified doctor, and `appointments.test.js` covers it.

### Non-bugs confirmed while testing

- **`passwordChangedAt` has a bounded ≤1s window.** It is deliberately backdated
  one second so the token a password change hands back stays valid, and JWT
  `iat` only has second granularity. A token issued in the *same second* as the
  change still passes; anything older is correctly rejected. Verified across
  0/1/2/5/60s offsets. Documented rather than changed — closing it properly
  needs a token version or `jti` counter, not a smaller backdate.
- `register()` returns `publicUser()`, which deliberately omits `isVerified`.
  Only `login` and `getMe` surface that flag; the UI gates on those.

### Still outstanding

- **Admin content management has no PUT** — diseases and medicines can be
  created and deleted, not edited. `adminAPI` in the frontend matches, so this
  is a genuine feature gap rather than a wiring bug.
- Frontend has no tests (the 120 above are all backend).
- `nodemailer` (see above).
- The Docker image build has not been executed.
