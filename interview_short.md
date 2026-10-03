# HealthSphere — 30-Minute Revision Sheet

Compressed from `interview.md`. Every likely question, with the shortest answer
that still lands. Read top to bottom once; the **Must-not-forget** box and the
**Killer lines** at the end are the highest-value 3 minutes.

---

## Must-not-forget (read this if you only have 5 minutes)

| # | The line | Why it wins |
|---|---|---|
| 1 | **403 never 401** — the axios interceptor treats 401 as "session dead", so a 401 for "logged in but not allowed" would silently log out a valid user. | Shows you reason across the stack |
| 2 | **Double-booking is stopped by a partial unique index, not the controller check** — the app check can't close the race, the DB can. | Shows you know app-level checks are racy |
| 3 | **Risk score is proportional, not a flat sum** — flat broke as the extractor improved (5 of 28 mildly off → scored 100 → "critical"). | A real bug you diagnosed |
| 4 | **Rules engine is the default, Gemini is the optional overlay** — no key needed, deterministic, can't hallucinate a dosage. | Deliberate, not a shortcut |
| 5 | **`uploads/` is NOT static** — reports stream through an ownership-checked endpoint; static serving would expose PHI to anyone with a filename. | Security instinct |
| 6 | **`passwordChangedAt` vs JWT `iat`** — how I revoke stateless tokens on password reset. | Answers the classic JWT objection |

---

## 1. Pitch (30 seconds)

Full-stack healthcare platform, 3 roles. **Patients**: symptom check, disease/medicine
catalog, book verified doctors on real slot availability, upload lab reports for
automated analysis, AI assistant. **Doctors**: schedule, linked patients,
appointment status/prescriptions, report review. **Admins**: verify doctor
licenses, manage users, curate catalog.

React 19 SPA + Node/Express/MongoDB REST API, Dockerized.

**Three things I'd highlight:** the report pipeline (PDF + OCR fallback, 28 lab
params, risk score, trends), the two-tier AI (rules engine default + optional
Gemini), and PHI access control (reports never served statically).

---

## 2. Architecture

```
React SPA ──JSON + Bearer JWT──► Express API ──► MongoDB
                                      └──► file storage (local | Cloudinary)
                                      └──► AI tier (rules | Gemini)
```

**Every request:** `route → protect (JWT) → authorize(role) → rate limit → validators → validate → controller → model`

- Controllers only **throw**; `errorHandler.js` is the single place a failure becomes an HTTP status.
- `config/env.js` is the **only** file reading `process.env` → one place for defaults, one place to enforce "required in production" (exits at boot if `JWT_SECRET`/`MONGO_URI` missing), one place for the Cloudinary→local graceful downgrade.
- `asyncHandler` wraps every controller — Express 4 doesn't catch rejected promises, so without it a failed request just hangs with no log.

---

## 3. Auth & authorization

| Q | A |
|---|---|
| **Flow?** | bcrypt cost 12 hashed in a `pre('save')` hook → JWT on login → `localStorage` as `hs_token` → axios interceptor attaches Bearer → `AuthContext` rehydrates via `GET /me` |
| **`protect` checks?** | Signature **+** user still exists **+** password not changed since `iat` **+** account still active |
| **Revoke a stateless JWT?** | `passwordChangedAt` set on password change; `protect` rejects tokens with an older `iat`. So a reset kills every session everywhere. |
| **Why backdate it 1 second?** | JWT is signed in the same tick as the save; second-precision `iat` would make the *fresh* token look older and instantly reject the user who just changed their password |
| **403 vs 401?** | 401 = identity unusable (no/invalid/expired token, password changed). 403 = we know you, answer is no. Because the client wipes the session on any 401. |
| **RBAC?** | `authorize(...roles)` middleware factory checks `req.user.role` → 403. Record-level ownership checked in the controller (e.g. report file = owner \| linked doctor \| admin). |
| **Why isn't role in the JWT?** | Roles change — a token carrying a stale role would grant access after an admin revoked it. `protect` loads the fresh user every request. |
| **Doctor verification?** | Self-registered doctors are `isVerified: false` and **excluded from `GET /api/doctors`** (the public listing). Can log in; `/me` returns top-level `isVerified` so the UI shows a pending banner. Admin approves. |
| **Why top-level & default true?** | Frontend gates on one flag regardless of role; always `true` for non-doctors so no role branching. |
| **Forgot password?** | `randomBytes(32)`, only the **SHA-256 hash** stored, 30-min expiry, single use. Identical response for unknown emails (no enumeration oracle). Email not wired yet — URL logged, returned in body outside production so it's testable. |
| **`localStorage` vs `httpOnly` cookie?** | Chose `localStorage` for the simpler cross-origin story; it's XSS-exposed. Mitigated: React escapes by default, 7-day expiry, password change revokes all. **Real answer: `httpOnly` refresh cookies + short-lived access tokens is the #1 upgrade needed.** |

---

## 4. Security

| Attack | Defence |
|---|---|
| Header/misc | `helmet` (CSP off — API serves JSON, not script-embedding HTML; it only broke Swagger UI) |
| Cross-origin | CORS allowlist of **exactly one** origin. Bare `cors()` + `credentials: true` lets *any* site call the API as the signed-in user. No-`Origin` requests allowed = same-origin + curl/healthchecks. |
| NoSQL injection | `express-mongo-sanitize` strips `$`/`.` keys. Attack: `{"email": {"$gt": ""}}` → `findOne` matches first user = auth bypass. Validators also assert string. |
| Param pollution | `hpp` — `?page=1&page=2` arrives as an array and breaks `parseInt` |
| Credential stuffing | 30/15min on `/api/auth`, **10** on credential routes, 600/15min global |
| Password storage | bcrypt cost 12 (~0.25s/hash), `select: false` so a hash can't leak via a forgotten `.select()` |
| PHI exposure | reports streamed via ownership-checked endpoint; only `uploads/avatars` publicly mounted (`index: false`, `dotfiles: 'deny'`) |
| Info leakage | stack traces never in a production response body |

- **Limiters 10× looser outside production** — a limiter that locks you out of your own testing gets disabled, and a disabled limiter protects nothing. Skipped entirely in `test` or the suite exhausts it.
- **`trust proxy: 1`** — otherwise `req.ip` is the proxy's, so all users share one bucket.
- **429 not 401** for rate limits — same interceptor reason as 403.
- **Tracing:** `X-Request-Id` on every response (echoes inbound), attached to every log line; morgan writes through winston = one destination. 5xx logs full stack (a bug), 4xx logs one line (expected traffic).

---

## 5. Database

| Q | A |
|---|---|
| **Why Mongo?** | Data is document-shaped: a report has a variable-length findings array, a doctor has a weekly schedule of days×slots — one embedded doc vs join tables you always read whole. **Honest counterpoint:** appointments are relational and Postgres would be defensible. |
| **Why split `User` from `Patient`/`Doctor`/`Admin`?** | `User` = identity/auth only. Keeps login lookups small (no dragging in a doctor's whole schedule) and avoids one sparse collection where ⅔ of fields are null. Cost: 2 lookups → `/me` returns `user` + `profile` in one round-trip. |
| **Indexes?** | `email` unique (login lookup + DB-level "one account per email"); `{role, isActive}` (admin lists, pending-doctor queue); `{patient, date:-1}` and `{doctor, date:-1}` (both dashboards read "mine, newest first" — descending so index order *is* sort order); `{doctor, date, time}` unique+partial. |
| **Compound index rule?** | Equality fields first, then range/sort field — hence `doctor` before `date`. |
| **The partial unique index?** | `unique: true, partialFilterExpression: {status: {$in: ['pending','confirmed']}}`. A plain unique index would keep a cancelled appointment occupying the key and block that slot **forever**; the partial filter drops dead rows out of the index and frees the slot. |

---

## 6. Appointments

- **Race condition:** controller checks availability then inserts — another request can insert between. App-level checks **cannot** close that without a transaction/lock. The partial unique index means the second insert *can't* succeed → error 11000 → error handler maps to **409**. Pattern: **validate in the app for UX, enforce in the DB for correctness.**
- **Slot computation:** weekday → `weeklySchedule` entry → blocked-date check → if absent/disabled/empty return **200 with empty list** ("closed Sunday" is a valid answer, not an error) → query that day's appointments with status `pending|confirmed` → mark matches `available: false`. Returned with a flag, not filtered out, so the UI greys them instead of hiding them.
- **Known bugs (say these before they're found):** past times today still return `available: true`; day-boundary math is local-timezone dependent (`new Date('YYYY-MM-DD')` parses as UTC).
- **Lifecycle:** `pending → confirmed → completed`, `cancelled` from either live state. Plus an `auditTrail` array — in a medical context "who moved this and when" isn't optional, and log reconstruction is unreliable.

---

## 7. Report pipeline

**Upload → extract text → find params → evaluate → trend → score**

1. Multer, PDF/image, 10 MB, local or Cloudinary
2. `pdf-parse`; nothing usable → it's a scan → `tesseract.js` OCR fallback
3. `extractMetrics` walks **line by line** against an alias table
4. `evaluateParameter` → `low`/`normal`/`high`/`critical`, sex-aware
5. `applyTrends` vs the patient's previous report → `up`/`down`/`stable`
6. `calculateRisk` → 0–100 + level

| Q | A |
|---|---|
| **Hardest part?** | Reports print the reference range on the result line: `Hemoglobin 11.2 g/dL 13.5 - 17.5`. "Any number on the line" grabs **13.5** and reports a healthy result. `valueFromLine` takes the first number after the label and skips any number followed by `- <digit>`. |
| **Why line-by-line?** | Parse as one blob and a value gets pulled from a different test's row. |
| **Different lab spellings?** | Alias table — `Hemoglobin: ['hemoglobin','haemoglobin','hb','hgb']`. New lab = one-line addition. `\b` boundaries so `hb` doesn't fire inside `hba1c`. First match wins, each param captured once (reports repeat names in summaries). |
| **Why sex-aware ranges?** | Male Hb 13.5–17.5, female 12.0–15.5. Flagging a healthy woman's 12.5 as "low" destroys trust. Sex unknown → widen to the union (conservative). |
| **Risk formula?** | Weights normal 0 / low-high 1 / critical 4, summed, ÷ params read, ×100. **Flat sum broke as the extractor improved** — 5 of 28 mildly off scored 100 = "critical". Two corrections: denominator floored at 6 (a 1-param legible scan would otherwise score 100), and critical floors (1 crit → ≥55, 2 → ≥80) so a big normal panel can't dilute an urgent value. Bands: <20 low, 20–49 moderate, 50–74 high, 75+ critical. |
| **Why does `trend` mean movement, not judgement?** | Rising Hb toward normal = good, rising LDL = bad. So `trend` = direction only; the param carries `higherIsWorse` and the UI pairs `trend` with `status`. One field, one meaning. |
| **Not medical advice?** | Flagged measurements vs published ranges + a doctor-review endpoint, never a diagnosis. Disclaimer on every AI reply, `aiDisclaimerAccepted` on the user. |

---

## 8. AI assistant

- **Tier 1 (default): deterministic rules engine.** Ordered-regex intent detection (greeting/medicine/symptom/disease/booking/report) → stopword-stripped keywords → queries **my own** `Disease`/`Medicine` collections → returns real generic name, uses, adult dose, side effects, prescription status, deep link.
- **Tier 2 (optional): Gemini overlay** for phrasing/open-ended, on only with `AI_PROVIDER=gemini` + key. **Any** error (key, quota, timeout, malformed) falls back to tier 1.
- **Why rules first?** No key/quota so it runs for anyone who clones it; deterministic so it's testable; can't hallucinate a dosage (every fact is a DB row); can't be killed by an upstream outage mid-demo.
- **Emergency handling:** `EMERGENCY_KEYWORDS` short-circuits **everything**, before intent detection and before any model call → fixed "call 112/911 now" reply. Hardcoded on purpose: zero variability, no network dependency, can't be lost to a misclassification.
- **Order-dependent regex — fragile?** The order *is* the design: greeting first so "hi" never routes as a symptom; medicine before symptom because "side effects of paracetamol" matches both. Limits: English-only, no compound questions. Mitigation: each handler returns `null` when it finds nothing, so a misclassified message falls through instead of answering badly.
- **User input → RegExp?** `escapeRx` escapes metacharacters — a stray `(` would throw and 500 the chat endpoint (trivial DoS). Keywords also filtered to >2 chars and non-stopwords so a common word can't match every row.
- **Symptom checker:** returns ranked conditions **with `specialistType`** → that's what makes `/diseases/:slug/doctors` return bookable verified doctors. The seeder enforces doctor coverage for every referenced `specialistType` and warns if it breaks — a "find a specialist" button leading to an empty list is worse than no button.

---

## 9. API design

**Envelope:** `{success, data, count, page, pages}` / `{success:false, message, errors:{field}}` — client reads `message` everywhere, so form errors are one shared code path.

**Why one pagination helper?** A real bug: some endpoints (notably doctor search) returned `count` alone while the pager reads `count`/`page`/`pages` → search silently rendered as a single page. Routing every list through `paginated()` makes it impossible rather than something to remember. `parsePagination` also sanitizes `page=0`/`-3`/`abc` and **caps `limit` at 100** — without the cap `?limit=999999` is an unbounded query.

**Error mapping:** `ApiError`→own status · `MulterError`→400 (reports the limit that *actually* applied: 2 MB avatar vs 10 MB report) · Mongoose `ValidationError`→400 + field map · `CastError`→400 (**a bad ObjectId is the client's mistake — letting it 500 poisons your error-rate metrics**) · dup key 11000→409 · JWT errors→401 · else 500.

---

## 10. Frontend

- CRA + React 19 + react-router v7. `App.js` = route table; `layouts/` Navbar+Footer hidden on `/login`/`/signup`; page-per-screen with its own CSS; `pages/admin/` for the console; `AuthContext` for session; `services/api.js` for the axios instance + per-domain modules.
- **Why a service layer?** Otherwise base URL and auth headers are duplicated across 30 components. One token interceptor, one global 401 handler, one place to change the base URL, named intent (`authAPI.getMe()`).
- **The interceptor bug:** logout clears `localStorage` first, so the request interceptor finds no token → 401 → the *response* interceptor fires a redirect for the wrong reason and masks real failures. Fix: `authAPI.logout(token)` passes it explicitly. Two sensible interceptors combining into surprising behaviour.
- **Why not Redux?** Exactly one piece of truly global state (who's signed in); everything else is per-page server data. Adding a store + reducers to hold one user object is ceremony. If caching became the problem I'd reach for React Query, not Redux — that's server-state, not client-state.
- **Route guarding — honest answer:** done **per page** (`PatientDashboard` reads `isAuthenticated` → `navigate('/login')`), not a shared `ProtectedRoute`. So a new page is unguarded by default = wrong default. **But it's UX, not a security boundary** — client routing is bypassable with dev tools; real enforcement is `protect`+`authorize`, already on every protected endpoint.

---

## 11. Testing

Jest + Supertest against **in-memory MongoDB** (`mongodb-memory-server`) — never touches a real DB, needs no running Mongo. `--runInBand` because suites share one DB. Coverage excludes swagger/seeder/seed data (config + fixtures, not logic).

7 suites: `auth` · `appointments` · `reports` · `catalog` · `security` · `parser` · `setup/helpers`

- **Most valuable?** `security.test.js` (security regressions are *silent* — nobody reports "CORS got looser on Tuesday") and `reports.test.js` (a regression = one patient reading another's medical report). `parser.test.js` for design value — its edge cases are the ones I got wrong first.
- **Weakest?** Frontend (only CRA default) · Gemini tier only tested on its fallback path · no load test firing simultaneous bookings at the unique index — I reason about that race, I haven't measured it.

---

## 12. Docker & deployment

- Two services: `mongo:7` + API from `backend/Dockerfile`.
- **`depends_on: condition: service_healthy`** with a `mongosh ping` healthcheck — plain `depends_on` only waits for the container to *start*, so the API races the DB and crashes on first connect.
- **Named volumes** for mongo-data/uploads/logs — with `STORAGE_DRIVER=local` the uploads volume **is** the report store.
- Mongo **not published** to the host; only the API needs it.
- **No hardcoded secrets** — all from `backend/.env`, so the compose file is safe to commit. `${JWT_SECRET:?...}` makes compose refuse to start rather than boot insecurely.
- **Why is `.env.example` git-ignored?** Removes the failure mode where someone adds a real credential "temporarily" and commits it. The README carries the full variable table instead.
- **Seeder idempotency:** v1 wiped users/patients/doctors — deleting real test accounts and **orphaning their reports** (reports weren't in the wipe list). Now it upserts by email/slug, deletes nothing, never resets a password; destruction is opt-in behind `--fresh`. Seeds 1 admin, 5 patients, 13 doctors (12 verified + 1 pending so the queue isn't empty), 15 diseases, 12 medicines, 8 appointments, 4 reports — including **two lipid panels for one patient so trends have history**. Seed data that exercises features = the difference between a demo that works and empty states.
- **For real production:** managed Mongo + backups, S3/Cloudinary so the API is stateless, frontend on a CDN, TLS + real secret manager, shipped logs. Frontend isn't containerized yet.

---

## 13. Scaling

1. **First bottleneck: synchronous OCR.** `tesseract.js` is CPU-bound, tens of seconds on a big scan, **inside the request** — concurrent uploads saturate the event loop and degrade every endpoint. Fix: accept upload → return `pending` → queue job (BullMQ/Redis) → worker pool → poll/websocket. Also gives retries, which today just fails the request.
2. **Stateful local storage** — can't add instances behind a LB without shared storage.
3. **Uncached catalog reads** — diseases/medicines change rarely, read constantly → Redis or HTTP cache headers.
4. **In-memory rate limits** — per-instance counters, so the effective limit multiplies by instance count. Needs a Redis store.
5. **Dashboards** — sequential `countDocuments` calls → `Promise.all`, or collapse same-collection facets into one `$facet` aggregation, then short-TTL cache (a 60s-stale count is fine).

---

## 14. Limitations & improvements (be direct — this scores well)

1. Tokens in `localStorage` (XSS) → `httpOnly` refresh cookies + short access tokens ← **biggest upgrade**
2. No email delivery (reset links logged, not mailed)
3. No shared `ProtectedRoute`; guards repeated per page
4. Synchronous OCR in the request path
5. Past slots shown available + timezone-dependent day math
6. No refresh tokens; 7-day window, revocation only via password change
7. **`ml/` service doesn't exist** — it's in the planned structure; prediction is rules + optional Gemini. Listed as roadmap, never implied as built.
8. Frontend barely tested; `frontend/package.json` still says `"name": "fronend"`
9. `DoctorPatientLink` lifecycle (when a link is created/revoked) needs tightening

**Two more weeks, in order:** httpOnly cookies → queued report analysis → real email → `ProtectedRoute` + past-slots fix → frontend integration tests. *"Close the security gap, then the scaling gap, then the correctness gaps, then coverage — and deliberately none of the ML work first, because it's the most impressive-sounding and the least load-bearing."*

**Start over differently:** define the response envelope, pagination contract, and error mapping on **day one** — all three were retrofits, and the pagination bug exists only because they weren't. And decide the storage abstraction up front instead of branching at each call site.

---

## 15. Behavioural

- **Planning:** `backend/plan.md` — 10 phases, each with tasks, acceptance criteria, verification notes, explicit "outstanding". Opens with an audit of the existing state including a **frontend→backend coverage matrix**, because the frontend existed first and several screens called endpoints that didn't exist. That matrix turned "build a backend" into an ordered list.
- **Bug that taught you most:** the risk score. It tested fine when the extractor read few params; expanding to 28 made every imperfect panel score "critical". *The bug wasn't the formula, it was assuming fixed input size.* Now I ask "what if this input gets 10× bigger" of any scoring code.
- **Hardest bug:** pagination — nothing errored, search just silently rendered one page. Fixing the branch would have worked; routing everything through `paginated()` meant it couldn't recur. **I prefer fixes that remove a class of mistake over fixes that correct one instance.**
- **Library vs DIY:** security primitives always a library (bcrypt, jsonwebtoken, helmet) — subtly wrong is catastrophic and invisible. Small project-specific contracts by hand (`paginate`, `ApiError`, `asyncHandler`). Test: would the dependency own a decision I need to change?

---

## 16. Rapid-fire

| Q | A |
|---|---|
| bcrypt cost 12? | ~0.25s/hash — brute force expensive, login still fast |
| `select: false` on password? | Can't leak via a forgotten `.select()`; opt in with `.select('+password')` |
| In the JWT? | User id + `iat`/`exp`. **Not** the role (stale role after revocation) |
| 7-day expiry? | UX compromise, no refresh flow; mitigated by password-change revocation |
| `randomBytes` not `Math.random`? | `Math.random` isn't cryptographically secure — predictable from prior output |
| 10 MB body limit? | Reports are the largest legit payload; bigger = mistake or memory attack |
| Helmet CSP off? | API serves JSON + avatars, never script-embedding HTML; only broke Swagger UI. CSP belongs on the frontend |
| `authLimiter` vs `credentialsLimiter`? | 30/15min across `/api/auth`; tightened to 10 on login/register/forgot/reset |
| `/api/health`? | Container healthchecks + LB probes |
| `swagger-jsdoc` not a hand-written spec? | Docs live next to the routes, so they get updated with the code |
| `/api/docs.json` separately? | Client generation / Postman import — UI for humans, spec for tooling |
| `X-Request-Id`? | Correlate a user's report with exact log lines; inbound values echoed for tracing |
| morgan through winston? | One destination, one format — access and app logs correlatable |
| `slugify`? | `/medicines/paracetamol` over ObjectIds — better URLs and SEO on public pages |
| `ChatSession` collection? | Per-user history: listable, resumable, owner-deletable |
| Numbers | 3 roles · ~45+ endpoints · 10 models · 8 route groups · 7 test suites · 28 lab params · 15 diseases / 12 medicines / 13 doctors seeded |

---

## Killer lines to drop unprompted

> "Validate in the application for good UX, enforce in the database for correctness."

> "A limiter that locks you out of your own testing gets disabled, and a disabled limiter protects nothing."

> "The bug wasn't in the formula I wrote — it was in assuming the input size was fixed."

> "I prefer fixes that remove a whole class of mistake over fixes that correct one instance."

> "On a health surface, 'I can only tell you what's in my catalog' is a feature, not a limitation."

> "Client-side routing is a UX concern, not a security boundary."

**If you don't know something:** name the tradeoff you'd investigate rather than
guessing. "I haven't measured that — I'd profile X before claiming Y" reads far
better than a confident wrong answer, and it's the same instinct the honest
limitations list demonstrates.
