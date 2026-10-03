# HealthSphere — Interview Questions & Answers

A preparation sheet for defending this project in a technical interview or viva.
Every answer is grounded in the code that actually exists in this repository, with
file references so you can open the source mid-conversation if asked to.

**How to use this:** don't memorise the long answers verbatim. Learn the *decision*
and the *reason* behind it — interviewers probe the "why", and the strongest
answers here are the ones where a naive implementation was rejected for a
specific reason.

---

## Table of contents

1. [Project overview & pitch](#1-project-overview--pitch)
2. [Architecture & design decisions](#2-architecture--design-decisions)
3. [Authentication & authorization](#3-authentication--authorization)
4. [Security](#4-security)
5. [Database & data modelling](#5-database--data-modelling)
6. [Appointments & concurrency](#6-appointments--concurrency)
7. [Report parsing & analysis](#7-report-parsing--analysis)
8. [The AI assistant](#8-the-ai-assistant)
9. [API design & error handling](#9-api-design--error-handling)
10. [Frontend](#10-frontend)
11. [Testing](#11-testing)
12. [DevOps & deployment](#12-devops--deployment)
13. [Scaling & performance](#13-scaling--performance)
14. [Known limitations & what you would improve](#14-known-limitations--what-you-would-improve)
15. [Behavioural & project-management questions](#15-behavioural--project-management-questions)
16. [Rapid-fire round](#16-rapid-fire-round)

---

## 1. Project overview & pitch

### Q1. Give me a two-minute overview of HealthSphere.

HealthSphere is a full-stack digital healthcare platform with three roles —
patient, doctor, and admin — built as a React 19 SPA on top of a Node.js/Express
REST API with MongoDB.

A patient can check symptoms against a disease catalog, browse diseases and
medicines, book an appointment with a verified doctor using real availability
from that doctor's weekly schedule, upload a lab report and get it parsed and
risk-scored automatically, and chat with an AI assistant grounded in the
platform's own catalog. A doctor manages their schedule, sees their linked
patients, updates appointment status and prescriptions, and reviews patients'
analysed reports. An admin verifies doctors' medical licenses, manages users, and
curates the disease and medicine catalog.

Technically the three things I'd point at are: **the report analysis pipeline** —
PDF text extraction with an OCR fallback, 28 lab parameters matched through an
alias table against sex-aware reference ranges, then a proportional risk score
and trend comparison against the patient's previous report; **the two-tier AI
design** — a deterministic catalog-grounded rules engine that works with no API
key at all, with an optional Gemini overlay that degrades back to rules on any
error; and **the security model around PHI** — medical reports are never served
statically, they're streamed through an endpoint that enforces ownership.

### Q2. Why did you build this? What problem does it solve?

Patients get lab reports as PDFs full of numbers with no interpretation, and they
don't know which specialist a given symptom actually calls for. The platform
closes that loop: symptoms map to conditions, conditions map to a
`specialistType`, and that maps to actual bookable verified doctors. The report
analysis turns "Hemoglobin 11.2" into "low, below the 13.5–17.5 male range,
trending down from your last report."

The deliberate constraint is that it never pretends to diagnose. Every AI reply
carries a disclaimer, emergency keywords short-circuit to "call 112 / 911 now"
before any model runs, and report findings are flagged for a doctor to review
rather than presented as conclusions.

### Q3. Who is it for, and what's the scope boundary?

It's an academic/demo platform, not a certified medical device. I deliberately did
*not* build: prescription fulfilment, payments, video consultation, or anything
claiming regulatory compliance (HIPAA/DISHA). I'd rather defend a clean scope than
claim compliance I haven't audited.

---

## 2. Architecture & design decisions

### Q4. Walk me through the architecture.

Two deployables plus MongoDB:

```
React SPA (frontend/)  ──JSON + Bearer JWT──►  Express API (backend/)  ──►  MongoDB
                                                       │
                                          ┌────────────┼────────────┐
                                     file storage   AI tier    logs (winston)
                                   local or Cloudinary  rules/Gemini
```

Inside the API every request follows the same chain, and that uniformity is the
point:

```
route → protect (JWT) → authorize(role) → rate limiter → express-validator rules
      → validate → controller → model
```

Controllers only ever contain business logic and *throw* on failure;
`middleware/errorHandler.js` is the single place a failure becomes an HTTP
status and a response body. `src/config/env.js` is the only file that reads
`process.env`.

### Q5. Why is `env.js` the only place `process.env` is read?

Because scattered `process.env.FOO` reads are how you get a variable that's
validated in one file and silently `undefined` in another. Centralising it gives
me one place to apply defaults, one place to enforce "this is mandatory in
production", and one place to look when onboarding. Concretely, `env.js` exits the
process at boot if `JWT_SECRET` or `MONGO_URI` is missing when
`NODE_ENV=production` — I'd rather crash on deploy than serve traffic signing
tokens with a development fallback secret.

It also lets me implement graceful degradation in exactly one spot: if
`STORAGE_DRIVER=cloudinary` but any of the three Cloudinary keys is missing, it
logs a warning and downgrades to `local` instead of throwing at the first upload.

### Q6. Why a layered controller/route/model structure instead of putting logic in the routes?

Route files stay a readable table of contents — you can see every endpoint, its
middleware chain, and its access level at a glance (`src/routes/`). Controllers
are then plain async functions that can be reasoned about and tested without
Express in the way. It also made the middleware chain the enforcement point for
auth and validation, so I can audit "is this route protected?" by reading one line
rather than the whole handler.

### Q7. What is `asyncHandler` and why do you need it?

Express 4 does not catch rejected promises from an async handler — the request
just hangs and eventually times out, with no error logged. `utils/asyncHandler.js`
wraps each controller so a rejection is forwarded to `next()` and lands in the
central error handler. That's what makes "controllers throw and move on" safe;
every export in `doctorController.js` is wrapped in it
(`controllers/doctorController.js:433`).

### Q8. What was the hardest architectural decision?

Whether the AI layer should be an LLM call or a rules engine. An LLM is the
impressive answer, but it made the whole product depend on a paid key, a network
round-trip, and non-deterministic output on a medical surface — and it will
confidently invent a medicine dosage.

I inverted it: the **rules engine is the default and the source of truth**, and it
only ever answers from the disease/medicine collections in my own database.
Gemini is an optional overlay for phrasing and open-ended questions, and any
failure — bad key, quota, timeout, malformed response — falls back to rules.
So the demo never breaks, output is reproducible for tests, and no fact reaches
the user that isn't in my catalog.

---

## 3. Authentication & authorization

### Q9. How does authentication work end to end?

Registration hashes the password with bcrypt (cost 12) in a Mongoose `pre('save')`
hook, so no controller ever handles a plaintext password
(`models/User.js`). Login compares with `comparePassword` and signs a JWT carrying
the user id. The client stores it in `localStorage` as `hs_token`; an axios request
interceptor attaches `Authorization: Bearer <token>` to every call
(`frontend/src/services/api.js`). On mount, `AuthContext` calls
`GET /api/auth/me` to rehydrate the user, so the UI never trusts a stale cached
user object.

Server-side, `protect` (`middleware/authMiddleware.js`) pulls the token, verifies
it, loads the user, and runs three additional checks beyond signature validity:
the user still exists, the password hasn't changed since the token was issued, and
the account is still active.

### Q10. How do you invalidate a JWT? They're stateless.

That's the classic weakness, and I handle the case that matters most — password
change/reset — without adding a token store. `User` has a `passwordChangedAt`
field, set in a `pre('save')` hook whenever the password is modified. `protect`
then calls `user.passwordChangedAfter(decoded.iat)` and rejects any token issued
before that timestamp. So resetting your password invalidates every session
everywhere, which is exactly what you want after a suspected compromise.

One detail worth mentioning: `passwordChangedAt` is deliberately backdated by one
second. The JWT is often signed in the same tick as the save, and second-precision
`iat` would otherwise make the *fresh* token look older than the change and
immediately reject the user who just changed their password.

Deactivating an account works similarly — `protect` checks `isActive`, so an admin
disabling a user takes effect on their next request rather than when their token
expires.

### Q11. Why do authorization failures return 403 and never 401?

Because of a specific interaction with the client. The axios response interceptor
treats any 401 as "session is dead": it wipes `localStorage` and redirects to
`/login`. If the API returned 401 for "you're logged in but you're not allowed to
do this", a patient hitting an admin endpoint would be silently signed out of a
perfectly valid session.

So the contract is strict: **401 means your identity is unusable** (no token,
invalid, expired, password changed), **403 means we know who you are and the
answer is no**. `authorize()` returns 403 (`middleware/roleMiddleware.js`), the
deactivated-account check returns 403, and `ApiError.forbidden()` exists so the
right choice is the easy one. The rate limiters return 429 for the same reason —
a 429 rendered as a 401 would log the user out for typing their password too fast.

### Q12. How does role-based access control work?

`authorize(...roles)` is a middleware factory: it checks `req.user.role` against
the allowed list and returns 403 otherwise. It's composed after `protect` in the
route definition, e.g. every route in `adminRoutes.js` is mounted behind
`protect` + `authorize('admin')`.

Role alone isn't always enough, though. For record-level access I check ownership
in the controller — `GET /api/reports/:id/file` allows the owning patient, a
linked doctor, or an admin. Role-based middleware answers "can this *kind* of user
use this endpoint"; the controller answers "can this *specific* user see this
*specific* record".

### Q13. Explain the doctor verification flow and why it exists.

Anyone can self-register as a doctor, which is an obvious trust hole — you'd be
letting an unverified stranger appear as a bookable physician. So a
newly-registered doctor gets `isVerified: false` and is **excluded from
`GET /api/doctors`**, which is what the public doctor listing and the "find a
specialist" CTA read from. They can still log in, and `/me` returns a top-level
`isVerified` flag so the UI shows a "pending verification" banner instead of a
broken dashboard.

An admin then approves the license via `PUT /api/admin/doctors/:id/verify`, with
`GET /api/admin/doctors/pending` as the queue. Note the flag is returned as
top-level and is always `true` for non-doctors — that way the frontend gates on
one field regardless of role, rather than branching on role first.

### Q14. Walk me through the forgot-password flow.

1. `POST /api/auth/forgot-password` — `createPasswordResetToken()` generates
   `crypto.randomBytes(32)`, stores **only the SHA-256 hash** in
   `resetPasswordToken` with a 30-minute `resetPasswordExpire`, and returns the
   raw token to be put in the URL.
2. `POST /api/auth/reset-password/:token` — hashes the incoming token and looks up
   the unexpired match, sets the new password, and clears the reset fields so the
   token is single use.

Three deliberate details:

- **Only the hash is stored.** A database leak can't be replayed against the reset
  endpoint — same reasoning as storing password hashes.
- **Forgot-password answers identically for unknown emails**, so it isn't an
  account-enumeration oracle.
- **Mail delivery isn't wired up yet.** Rather than pretend, the reset URL is
  logged server-side and, outside production, returned in the response body so
  the flow stays testable. That's a known gap on the roadmap, not an oversight.

### Q15. `localStorage` vs `httpOnly` cookies — defend your choice.

`localStorage` is XSS-exposed: any injected script can read the token. An
`httpOnly` cookie can't be read by JavaScript, which is strictly better for token
theft, but it moves you onto CSRF as the threat and needs `SameSite`, a CSRF token
for state-changing routes, and cross-origin cookie configuration between ports
3000 and 5000.

I chose `localStorage` for the simpler cross-origin story and mitigated what I
could: React escapes interpolated content by default so the XSS surface is small,
the token has a 7-day expiry, and a password change invalidates every outstanding
token. For anything handling real PHI I'd move to `httpOnly` + `SameSite=Strict`
refresh cookies with short-lived access tokens — I'd call this the single biggest
security upgrade the project needs, and I'd rather state that plainly than defend
`localStorage` as ideal.

---

## 4. Security

### Q16. What security measures are in place?

Layered, and each one answers a specific attack:

| Concern | Measure |
|---|---|
| Header hardening | `helmet` (`app.js`) |
| Cross-origin abuse | CORS allowlist of exactly one origin (`CLIENT_URL`) |
| NoSQL injection | `express-mongo-sanitize` strips `$`/`.` keys from payloads |
| Parameter pollution | `hpp` collapses duplicated query params |
| Credential stuffing | `express-rate-limit`: 30/15min on `/api/auth`, 10 on credential routes |
| Scraping / runaway clients | global limiter, 600/15min in production |
| Password storage | bcrypt, cost 12, `select: false` on the field |
| Session revocation | `passwordChangedAt` vs JWT `iat` |
| PHI exposure | reports streamed behind an ownership check, never static |
| Input validation | `express-validator` on every mutating route |
| Info leakage | stack traces never sent in production |
| Traceability | `X-Request-Id` on every response, correlated in logs |

### Q17. Why not just use `cors()` with no options?

Bare `cors()` reflects whatever `Origin` the request carries. Combined with
`credentials: true` that means *any* website can call the API as the signed-in
user. So the origin callback allows exactly `CLIENT_URL`, plus requests with no
`Origin` header at all — which is same-origin traffic and non-browser callers like
curl and container health checks, not a bypass, since a browser always sends
`Origin` on a cross-origin request.

The tradeoff is that moving the frontend off port 3000 requires updating
`CLIENT_URL`, which I documented rather than worked around.

### Q18. How would a NoSQL injection attack work here, and what stops it?

Classic payload: `POST /api/auth/login` with `{"email": {"$gt": ""}, "password": ...}`.
If that object reaches `User.findOne({ email })`, Mongo interprets `$gt` as an
operator and matches the first user in the collection — an auth bypass.

`express-mongo-sanitize` runs after the body parsers and before any route, and
replaces `$`/`.` in keys with `_`, so the operator becomes an inert field name.
Belt and braces, `express-validator` also asserts `email` is a string in a valid
email format, so the payload fails validation regardless. `security.test.js`
covers this case explicitly.

### Q19. Medical reports are PHI. How do you protect them?

The key decision is that `uploads/` is **not** a static mount. The obvious
`app.use('/uploads', express.static(...))` would make every patient's report
readable by anyone who could guess or leak a filename — no auth at all, and
filenames leak through browser history, logs, and referrers.

Instead `GET /api/reports/:id/file` loads the report, checks that the caller is
the owning patient, a linked doctor, or an admin, and only then streams the file.
The one exception is `uploads/avatars`, which gets its own narrowly-scoped public
mount with `index: false` and `dotfiles: 'deny'` — profile pictures aren't medical
data, and the mount is scoped so nothing else under `uploads/` is reachable
through it (`app.js`).

### Q20. Why are your rate limiters 10× looser outside production?

Because a limiter that locks you out during your own manual testing gets disabled,
and a disabled limiter protects nothing. `middleware/rateLimit.js` multiplies the
cap by 10 when `NODE_ENV !== 'production'` and the global limiter is skipped
entirely under `test` — otherwise the test suite, which fires hundreds of requests
from one IP, would exhaust it and fail for the wrong reason.

Also note `app.set('trust proxy', 1)`: behind a reverse proxy, `req.ip` is the
proxy's address, so every user would share one bucket and the limiter would either
lock everyone out at once or be trivially bypassed.

### Q21. Someone reports a bug in production. How do you trace it?

Every request gets an id — either echoed from an inbound `X-Request-Id` or a fresh
6-byte hex value — set on the response header and attached to every log line for
that request (`middleware/errorHandler.js`). morgan writes through winston so
access logs and application logs land in one destination
(`backend/logs/combined.log`, errors also in `error.log`). A user can quote the
`X-Request-Id` from a screenshot and I can find the exact request, its status, and
its stack.

The error handler also logs by severity deliberately: 5xx logs the full stack
because it's a bug, 4xx logs one warning line because it's expected traffic and
shouldn't drown the log.

---

## 5. Database & data modelling

### Q22. Why MongoDB rather than a relational database?

Honest answer: the data is document-shaped and the schema moved a lot during
development. A `Report` holds a variable-length array of findings, each with its
own parameter, value, unit, range, status, and trend. A `Doctor` holds a weekly
schedule of days each with a slot array. In SQL those are join tables you almost
always read whole; in Mongo they're one embedded document and one query.

The honest counterpoint: appointments are relational, and the one place I actually
want a transaction is double-booking (see Q26) — I solved it with a unique index
instead. A production system with billing and audit requirements would be a
defensible case for PostgreSQL, and I wouldn't argue hard against it.

### Q23. Why separate `User` from `Patient` / `Doctor` / `Admin`?

`User` owns identity and authentication only — credentials, role, active flag,
reset token. The role profiles own domain data: `Patient` has medical history,
`Doctor` has specialisation, license, fee, and weekly schedule, `Admin` has
`hospitalId` and permissions.

This keeps auth queries small and, more importantly, keeps a login lookup from
dragging in a doctor's entire schedule. It also avoids one sparse collection where
two-thirds of the fields are null for any given row. The cost is a second lookup
to build a full profile, which is why `GET /api/auth/me` returns `user` and
`profile` together — one round-trip for the client.

### Q24. What indexes did you create and why?

- `User.email` — unique, from the `unique: true` on the field. Every login is a
  lookup by email, and it also enforces "one account per email" at the database
  level rather than in a race-prone controller check.
- `User { role: 1, isActive: 1 }` — the admin console lists and filters by role,
  and the doctor-verification queue filters role + active.
- `Appointment { patient: 1, date: -1 }` and `{ doctor: 1, date: -1 }` — both
  dashboards read "my appointments, newest first". Descending date means the index
  order *is* the sort order, so no in-memory sort.
- `Appointment { doctor: 1, date: 1, time: 1 }` — **unique, partial**. This is the
  double-booking guard, covered next.

The compound-index rule I applied is equality fields first, then the range/sort
field — which is why `doctor` precedes `date`.

### Q25. Explain the partial unique index on `Appointment`.

```js
appointmentSchema.index(
  { doctor: 1, date: 1, time: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['pending', 'confirmed'] } } }
);
```

A plain unique index on `(doctor, date, time)` would be wrong: once an appointment
is cancelled, that slot should become bookable again, but the old row still
occupies the unique key and blocks it forever. The `partialFilterExpression`
restricts the constraint to *live* appointments only — `pending` and `confirmed` —
so cancelled and completed rows drop out of the index and free the slot.

---

## 6. Appointments & concurrency

### Q26. Two patients book the same slot at the same instant. What happens?

This is a genuine race. The controller checks availability and then inserts, and
between those two steps another request can insert the same slot — an
application-level check cannot close that window without a transaction or a lock.

So the real guarantee lives in the database: the partial unique index from Q25
means the second insert **cannot** succeed. Mongo raises duplicate-key error
11000, which the central error handler already maps to a `409 Conflict` with a
"that value is already in use" message. The controller check still earns its place
because it produces a clearer message in the common non-concurrent case; the index
is what makes the invariant true.

That's the pattern I'd defend generally: validate in the application for good UX,
enforce in the database for correctness.

### Q27. How are available slots computed?

`GET /api/doctors/:id/slots?date=` (`controllers/doctorController.js:135`):

1. Map the date to a weekday name and find that day in the doctor's
   `weeklySchedule`.
2. If the date is in `blockedDates`, or the day is absent/disabled/has no slots,
   return an empty list with "Doctor is not available on this day" — a 200 with no
   slots, not an error, because "closed on Sunday" is a valid answer.
3. Otherwise take the day's configured slots, query appointments for that doctor
   within the day boundary with status `pending` or `confirmed`, and mark matching
   times `available: false`.

Note the status filter — cancelled appointments must not hold a slot, which is the
same invariant the partial index encodes. And note that slots are returned with an
`available` flag rather than filtered out, so the UI can show a booked slot greyed
out instead of silently missing.

### Q28. Is there a bug in the slot logic?

Yes, and it's worth naming before an interviewer finds it: `getAvailableSlots`
doesn't exclude times that have already passed today. Ask for today's slots at
4pm and the 10am slot still comes back `available: true`. The fix is a comparison
against the current time when the requested date is today, and the booking
validator should reject past datetimes server-side too, since a client-side check
is trivially bypassed.

The day-boundary arithmetic is also local-timezone dependent — `new Date(date)`
on a bare `YYYY-MM-DD` parses as UTC, so a deployment in a non-UTC timezone can
land slots on the wrong day. Storing an explicit timezone per doctor and
normalising on the way in is the correct fix.

### Q29. What's the appointment lifecycle?

`pending → confirmed → completed`, with `cancelled` reachable from `pending` or
`confirmed`. A patient books (`pending`), the doctor or admin confirms and later
completes it with a prescription and notes, and either side can cancel with a
reason and `cancelledBy` recorded.

The model also carries an `auditTrail` array of `{action, date, previousDate,
previousTime, by}`. In a medical context "who moved this appointment and when" is
not a nice-to-have, and reconstructing it from application logs is unreliable — so
it's part of the record.

---

## 7. Report parsing & analysis

### Q30. Walk me through the report analysis pipeline.

Upload → extract text → find parameters → evaluate → trend → score.

1. **Upload** — Multer accepts a PDF or image, 10 MB cap, to local disk or
   Cloudinary depending on `STORAGE_DRIVER`.
2. **Text extraction** — `pdf-parse` for text PDFs; if that yields nothing usable
   the file is a scan, so it falls back to `tesseract.js` OCR.
3. **Parameter extraction** — `extractMetrics` walks the text **line by line**,
   matching each line against an alias table (`utils/labRanges.js`).
4. **Evaluation** — `evaluateParameter` compares the value to the reference range
   for that parameter, using the patient's sex where the range is sex-specific,
   and returns `low` / `normal` / `high` / `critical`.
5. **Trends** — `applyTrends` compares each finding against the same parameter in
   the patient's most recent previous report and sets `up` / `down` / `stable`.
6. **Risk** — `calculateRisk` turns the findings into a 0–100 score and a level.

### Q31. Why line-by-line, and what's the hard part of the extraction?

The hard part is that lab reports print the reference range on the same line as
the result:

```
Hemoglobin        11.2      g/dL      13.5 - 17.5
```

A regex for "any number on the line" grabs `13.5` — the bottom of the normal
range — and reports a perfectly healthy result. So `valueFromLine` walks every
number *after* the matched label and skips any number immediately followed by
`- <digit>`, because that number is opening a reference range, not reporting a
result.

Working line-by-line matters for the same class of reason: parse the document as
one blob and a value can be pulled from a different test's row entirely.

### Q32. How do you handle different labs naming the same test differently?

An alias table. Every parameter in `labRanges.js` lists the strings that actually
appear on Indian and US reports — `Hemoglobin` carries
`['hemoglobin', 'haemoglobin', 'hb', 'hgb']` — and the extractor matches aliases,
not canonical names. Supporting another lab's formatting is a one-line addition
rather than a code change.

Two details: matching uses `\b` word boundaries so `hb` doesn't fire inside
`hba1c`, which would silently mis-attribute a diabetes marker to haemoglobin. And
each canonical parameter is captured only once — the first match wins — because
reports typically repeat test names in a summary section.

### Q33. Why are some reference ranges sex-specific?

Because for some parameters they genuinely differ, and using one range produces
wrong flags. Male haemoglobin is 13.5–17.5 g/dL, female 12.0–15.5; the same is
true of haematocrit and creatinine. Flagging a healthy woman's 12.5 as "low" is
exactly the kind of false alarm that destroys trust in the feature.

When the patient's sex is unknown the range widens to the union of both, which is
the conservative direction — better to miss a borderline flag than to alarm a
healthy user with a number that's normal for them.

### Q34. Explain the risk score. Why proportional rather than a flat sum?

`utils/riskCalculator.js` weights each finding by severity — normal 0, low/high 1,
critical 4 — sums them, and divides by the number of parameters actually read,
scaled to 100. So one abnormal value in four scores 25.

A flat sum was my first version, and it breaks precisely as the extractor gets
*better*: a panel where 5 of 28 values are mildly off is a moderate result, but at
a flat +20 each it scores 100 and reports "critical". Proportional scoring is
stable as coverage grows.

Two corrections on top:

- **A floor of 6 on the denominator.** A ratio is meaningless on a tiny sample —
  a scan where only haemoglobin was legible and came back mildly low is one
  abnormal out of one, which without the floor scores 100 and reports critical.
- **Floors for critical values.** One critical value forces the score to at least
  55, two to at least 80. A single badly out-of-range electrolyte matters more
  than ten borderline ones, and a large normal panel shouldn't dilute it to
  nothing.

Bands: <20 low, 20–49 moderate, 50–74 high, 75+ critical.

### Q35. Why does `trend` describe movement rather than judgement?

`trend: 'up'` means the number rose — nothing more. Whether rising is good or bad
depends on the parameter: rising haemoglobin toward normal is improvement, rising
LDL is deterioration. Encoding judgement into `trend` would need the direction
baked into every comparison; instead the parameter carries a `higherIsWorse` flag
and the UI pairs `trend` with `status` to decide what to show. One field, one
meaning.

### Q36. How do you keep this from being medical advice?

Report findings are presented as flagged measurements against published ranges,
with a doctor-review step (`PUT /api/reports/:id/review`) — never as a diagnosis.
The AI layer appends a disclaimer to every reply, and the `User` model has an
`aiDisclaimerAccepted` flag. The README carries an explicit disclaimer. The
feature interprets numbers; it doesn't diagnose people.

---

## 8. The AI assistant

### Q37. Is this "real AI"? How does the assistant actually work?

It's a two-tier design, and I'd rather describe it accurately than oversell it.

**Tier 1 is a deterministic rules engine** (`utils/aiEngine.js`). It classifies
intent — greeting, medicine, symptom, disease, booking, report — with ordered
regex patterns, extracts keywords after stripping stopwords, and queries the
`Disease` and `Medicine` collections. A medicine question returns that medicine's
real generic name, uses, adult dose, common side effects, prescription status, and
a deep link to its page — all from my own database.

**Tier 2 is an optional Gemini overlay**, on only when `AI_PROVIDER=gemini` with a
key present, for phrasing and open-ended questions. Any error — bad key, quota,
timeout, malformed response — falls back to tier 1.

So the honest framing: the intelligence is retrieval and rules over a curated
catalog, with an LLM as an optional presentation layer. That's deliberate, not a
shortcut — on a health surface, "I can only tell you what's in my catalog" is a
feature.

### Q38. Why is the rules engine the default rather than the LLM?

Four reasons: it needs no API key or quota so the project runs for anyone who
clones it; it's deterministic so I can actually write tests against it; it cannot
hallucinate a dosage because every fact comes from a database row; and it can't be
taken down by an upstream outage mid-demo. Making the LLM the default would trade
all four for better prose.

### Q39. What happens if a user types something urgent?

`EMERGENCY_KEYWORDS` is checked first and short-circuits **every** other branch,
including any model call. Chest pain, difficulty breathing, stroke, suicide,
overdose, coughing blood and similar return a fixed reply telling the user to stop
using the app and call 112 (India) or 911 (US) immediately.

This is hardcoded on purpose. It's the one path where I want zero variability, no
network dependency, and no chance of a model deciding to be conversational. It
runs before intent detection, so it can't be missed by a misclassification.

### Q40. Order-dependent regex intent detection sounds fragile. Defend it.

The order is the design, not an accident. `detectIntent` checks greeting first so
"hi" never routes as a symptom — without that, `hi` matching a symptom pattern
sends a greeting into the disease matcher. `medicine` precedes `symptom` because
"side effects of paracetamol" contains both.

Its real limits are that it's English-only and can't handle compound questions.
The mitigation is the fallthrough architecture: each handler returns `null` when
it finds nothing rather than answering badly, so a misclassified message falls
through to the next strategy instead of producing a confidently wrong reply.

### Q41. You build a RegExp from user input. Isn't that dangerous?

Yes, on two counts, and both are handled. `escapeRx` escapes regex metacharacters
before user words become a pattern — otherwise a stray `(` throws and takes the
whole reply down with a 500, which is a trivial denial-of-service on the chat
endpoint. And keywords are filtered to words longer than two characters that
aren't stopwords, so a common word can't turn into a pattern matching every
catalog row. The remaining exposure is catastrophic backtracking on pathological
input; the patterns here are simple alternations of escaped literals, which don't
exhibit it.

### Q42. How does the symptom checker score conditions?

`POST /api/ai/symptom-check` matches submitted symptoms against the `Disease`
catalog and returns ranked candidates with their `specialistType`. That last field
is the product point — it's what makes `GET /api/ai/diseases/:slug/doctors` able
to return *verified, bookable* doctors for the condition, so the result is an
action rather than a dead end.

The seeder enforces this invariant: doctor coverage spans every `specialistType`
the disease catalog references, and it prints a warning if that ever stops being
true. A "find a specialist" button that leads to an empty list is worse than no
button.

---

## 9. API design & error handling

### Q43. Describe your response format and why it's uniform.

Success and failure share one envelope:

```json
{ "success": true, "data": {}, "count": 0, "page": 1, "pages": 1 }
{ "success": false, "message": "...", "errors": { "field": "why" } }
```

The client reads `message` for every error and `errors` for field-level detail, so
form error rendering is one shared code path rather than per-endpoint parsing.

### Q44. Why does every list endpoint go through `paginate.js`?

Because of an actual bug. Several endpoints returned `count` alone — notably the
doctor-search branch — while the frontend pager reads `count`, `page`, and
`pages`. Search silently broke the pager: it rendered as a single page regardless
of how many results there were. Building every list response through
`paginated()` makes the inconsistency impossible rather than something you have to
remember.

`parsePagination` also normalises untrusted input: `page=0`, `page=-3`,
`limit=abc` and `limit=99999` all become sane values, with `limit` capped at 100.
That cap is the important one — without it `?limit=999999` is an unbounded query
that will happily try to serialise the whole collection.

### Q45. How does centralised error handling work?

`middleware/errorHandler.js` is mounted last, after `notFound`, and translates
whatever was thrown into the envelope:

| Thrown | Status | Notes |
|---|---|---|
| `ApiError` | its own | explicit application errors |
| `MulterError` | 400 | reports the limit that actually applied — 2 MB avatar vs 10 MB report |
| Mongoose `ValidationError` | 400 | field-level `errors` map |
| `CastError` | 400 | a malformed ObjectId is the client's mistake, not a server fault |
| duplicate key 11000 | 409 | names the conflicting field |
| `JsonWebTokenError` | 401 | |
| `TokenExpiredError` | 401 | "session expired, sign in again" |
| anything else | 500 | generic message; full stack logged |

Two details I'd point out. `CastError` → 400 rather than 500 matters because a bad
ObjectId in a URL is *not* a server fault, and letting it 500 poisons your error
rate metrics with client noise. And a stack trace is never included in a
production response body — that's information disclosure.

### Q46. Why 429 for rate limits instead of reusing an existing status?

Same reason as the 403 rule: the axios interceptor treats 401 as "wipe the
session". A rate-limited login attempt returning 401 would log out a user for
typing too fast. The limiters also return the project's envelope rather than
express-rate-limit's default plain text, so the client renders the message
normally instead of choking on a non-JSON body.

---

## 10. Frontend

### Q47. How is the frontend structured?

Create React App with React 19 and react-router-dom v7. `App.js` is the route
table; `layouts/` holds the shared `Navbar` and `Footer`, hidden on `/login` and
`/signup` for a full-screen auth experience. Each screen is a page component in
`pages/` with its own CSS file, and `pages/admin/` holds the five admin console
screens. `context/AuthContext.js` owns session state; `services/api.js` owns the
axios instance and exports one module per API domain (`authAPI`, `doctorAPI`, …).

### Q48. Why an API service layer instead of calling axios in components?

Because the alternative is base URLs and auth headers duplicated across 30 page
components. Centralising it gives me one interceptor that attaches the token, one
that handles 401 globally, one place to change the base URL, and named functions
that read as intent (`authAPI.getMe()`) rather than a string literal in a
component. When I added the `X-Request-Id`/asset-URL handling, it was one file.

### Q49. There's a subtle bug the logout function had to work around. What was it?

Logout clears `localStorage` first, so by the time the request goes out the
request interceptor finds no token to attach. The call comes back 401, which the
*response* interceptor reads as "session dead" and redirects — during a logout
that's harmless-looking but it's the interceptor firing for the wrong reason, and
it masks real failures. So `authAPI.logout(token)` takes the token explicitly and
passes it as a header. It's a good example of two sensible interceptors combining
into surprising behaviour.

### Q50. How is state managed? Why not Redux?

React Context for auth (`AuthContext`) and local component state for everything
else. Redux would be overhead for this shape of app: there's exactly one piece of
truly global state — who's signed in — and the rest is server data fetched per
page. Adding a store, reducers, and middleware to hold one user object is
ceremony, not architecture. If cross-page caching and invalidation became a real
problem I'd reach for React Query before Redux, because the problem would be
server-state caching rather than client-state management.

### Q51. How does the app know a doctor is unverified?

`AuthContext` reads a top-level `isVerified` from `/me` and defaults it to `true`,
since every non-doctor role is trivially verified. Pages gate on that one flag —
no role branching — and `UserProfile` renders a pending banner. Defaulting to
`true` is the deliberate choice: a field missing from an older response shouldn't
lock a patient out of their own dashboard.

### Q52. Is client-side routing secured?

Partially, and this is the honest answer. Route guarding is done **per page** —
`PatientDashboard` reads `isAuthenticated` from `useAuth()` and calls
`navigate('/login')` when it's false — rather than with a shared `ProtectedRoute`
wrapper in `App.js`. That works but it's repeated in every protected page, and any
new page that forgets the check is unguarded by default, which is the wrong
default.

The fix is a `<ProtectedRoute roles={[...]}>` wrapper composed in the route table,
so protection is declared where routes are declared. Worth stressing: this is a
UX concern, not a security boundary. Client-side routing is bypassable by anyone
with dev tools; the real enforcement is `protect` + `authorize` on the server, and
that's already in place on every protected endpoint.

---

## 11. Testing

### Q53. How did you test this?

Jest + Supertest against an in-memory MongoDB (`mongodb-memory-server`), so the
suite never touches a real database and needs no running Mongo. Seven suites:

| Suite | Covers |
|---|---|
| `auth.test.js` | registration, login, token rotation, reset flow, role guards |
| `appointments.test.js` | booking rules, double-booking, authorization |
| `reports.test.js` | PHI access control, file streaming, deletion |
| `catalog.test.js` | diseases, medicines, symptom checker, pagination |
| `security.test.js` | headers, CORS, injection, error envelope |
| `parser.test.js` | lab extraction, trend computation, risk scoring |
| `setup.js` / `helpers.js` | in-memory Mongo bootstrap and fixture builders |

Jest runs with `--runInBand` because the suites share one in-memory database, and
coverage excludes `swagger.js`, the seeder, and seed data — config and fixtures,
not logic.

### Q54. Which tests do you consider most valuable?

`security.test.js` and `reports.test.js`. Security regressions are silent — nobody
files a bug report saying "CORS got looser last Tuesday" — so the injection, CORS,
and header assertions are the ones earning their keep. `reports.test.js` guards
PHI access control, where a regression means one patient reading another's medical
report; that's the failure I least want to find in production.

`parser.test.js` is the one I'd point to for *design* value: the extractor's edge
cases (a reference range on the same line, `hb` inside `hba1c`, a one-parameter
scan) are exactly the cases I got wrong first, and the tests are what let me fix
the risk formula without fear.

### Q55. What isn't tested well?

The frontend. There's CRA's Testing Library setup and the default `App.test.js`,
but no meaningful component or integration coverage — the backend got the testing
budget because that's where the security boundaries and the parsing logic live.
The Gemini tier is also untested against the real API, only its fallback path;
mocking a paid non-deterministic API has limited value, but I'd want a contract
test around the fallback boundary. And there's no load or concurrency test that
fires simultaneous bookings at the unique index — I reason about that race, I
haven't measured it.

---

## 12. DevOps & deployment

### Q56. Walk me through the Docker setup.

`docker-compose.yml` brings up two services: `mongo:7` and the API built from
`backend/Dockerfile`. Points worth making:

- **`depends_on` uses `condition: service_healthy`**, with a `mongosh ping`
  healthcheck on Mongo. Plain `depends_on` only waits for the container to
  *start*, so the API would race the database and crash on first connect.
- **Named volumes** for `mongo-data`, `uploads`, and `logs`. With
  `STORAGE_DRIVER=local` the uploads volume *is* the report store — losing it
  loses patient files, which is why it's a volume and not container-local disk.
- **Mongo isn't published to the host.** Only the `api` service needs it; the port
  mapping is commented out for GUI inspection when needed.
- **No hardcoded secrets.** Everything substitutes from `backend/.env`, so the
  compose file is safe to commit. `JWT_SECRET` uses `${JWT_SECRET:?...}`, so
  compose refuses to start with a clear message rather than booting insecurely.

### Q57. What would you change to deploy this for real?

`docker compose down -v` currently deletes everything, and there's no backup
story — so: managed MongoDB (Atlas) with automated backups, Cloudinary or S3
instead of local disk so the API becomes stateless and horizontally scalable, the
frontend built and served from a CDN, TLS termination and secrets from a real
secret manager rather than a `.env` file, and log shipping to something queryable
instead of files in a volume. The frontend also isn't containerised yet.

### Q58. Why is `.env.example` git-ignored?

To remove the failure mode where someone adds a real credential to the example
file "temporarily" and it gets committed. It's documented as placeholders-only,
and the README carries the full variable table, so the onboarding information
exists without a file that's one careless edit away from leaking a key.

### Q59. Explain the seeder's idempotency. Why did that matter?

The first version wiped `users`, `patients`, and `doctors` before inserting —
which deletes real test accounts and, worse, orphans their reports, because
`reports` wasn't in the wipe list. So `npm run seed` is now **idempotent**: it
upserts by email/slug, adds only what's missing, deletes nothing, and never resets
an existing password. Destruction is opt-in behind `--fresh`.

It seeds 1 admin, 5 patients, 13 doctors (12 verified + 1 pending, so the admin
queue isn't empty), 15 diseases, 12 medicines, 8 appointments across past and
future dates, and 4 analysed reports — including **two lipid panels for the same
patient**, so the trends feature has history to compare and isn't a blank panel on
a fresh demo. Seed data that exercises the features is the difference between a
demo that works and a demo that renders empty states.

---

## 13. Scaling & performance

### Q60. Where does this break under load first?

**The report analysis pipeline**, without question. OCR via `tesseract.js` is
CPU-bound and can take tens of seconds on a large scan, and it runs inside the
request. Concurrent uploads will saturate the event loop and degrade every other
endpoint on that instance.

The fix is to make analysis asynchronous: accept the upload, return a `pending`
report immediately, push a job to a queue (BullMQ/Redis), process it in a separate
worker pool, and have the client poll or receive a websocket update. That also
gives retries on a failed parse, which today just fails the request.

### Q61. What's next after that?

- **The API is stateful with local storage.** `STORAGE_DRIVER=local` means uploads
  live on one container's disk, so you can't add instances behind a load balancer
  without shared storage. Switching to Cloudinary/S3 makes it stateless.
- **Catalog reads are uncached.** Diseases and medicines change rarely and are
  read constantly — a textbook Redis cache, or at minimum HTTP cache headers.
- **Rate limits are in-memory**, so each instance has its own counters and the
  effective limit multiplies by the instance count. Needs a Redis store.
- **No connection pooling tuning or query profiling** has been done; I'd want
  `explain()` on the dashboard aggregations before scaling anything.

### Q62. How would you optimise the dashboard endpoints?

They currently fire several independent `countDocuments` calls. Two steps: run
independent counts concurrently with `Promise.all` rather than sequentially, and
where they're facets of the same collection, collapse them into a single
aggregation with `$facet` so it's one round-trip instead of four. Then cache the
result for a short TTL — a dashboard count being 60 seconds stale is fine, and
that's the cheapest win available.

---

## 14. Known limitations & what you would improve

### Q63. What are the weakest parts of this project?

Being direct about this is better than being caught out:

1. **Tokens in `localStorage`** — XSS-exposed. Should be `httpOnly` refresh
   cookies with short-lived access tokens. Biggest security upgrade available.
2. **No email delivery** — reset links are logged, not mailed. The flow is
   complete apart from the transport.
3. **No shared `ProtectedRoute`** — client-side guards are repeated per page, so
   a new page is unguarded by default (Q52).
4. **Synchronous OCR in the request path** — the scaling bottleneck (Q60).
5. **Past slots shown as available** — a real bug (Q28), plus timezone-dependent
   day arithmetic.
6. **No refresh tokens** — a 7-day token is a long window, and there's no
   revocation mechanism other than a password change.
7. **The `ml/` service doesn't exist** — it's in the planned structure in
   `docs/ml_docs/ml_path.md`; prediction is rules + optional Gemini. I list it as
   roadmap rather than implying trained models exist.
8. **Frontend barely tested**, and `frontend/package.json` still says
   `"name": "fronend"` — a typo I should fix.
9. **Doctor-patient linking** is a `DoctorPatientLink` collection whose lifecycle
   I'd want to define more tightly — when exactly a link is created and revoked.

### Q64. If you had two more weeks, what would you build?

In priority order: move auth to `httpOnly` refresh cookies; make report analysis
a queued background job; wire up real email; add the shared `ProtectedRoute`
wrapper and fix the past-slots bug; then frontend integration tests. That's
roughly "close the security gap, then the scaling gap, then the correctness gaps,
then the coverage gap" — and I'd deliberately do none of the ML work first,
because it's the most impressive-sounding and the least load-bearing.

### Q65. What would you do differently if you started over?

Two things. I'd define the response envelope, pagination contract, and error
mapping on day one — all three were retrofits, and the pagination bug in Q44
exists only because they weren't. And I'd decide the storage abstraction up front:
`STORAGE_DRIVER` with a silent downgrade to local works, but a proper storage
interface with local and cloud implementations behind it would have been cleaner
than a branch at every call site.

---

## 15. Behavioural & project-management questions

### Q66. How did you plan and track this project?

`backend/plan.md` is a phased plan — Phase 0 stabilisation, then auth, catalog,
doctor module, appointments, reports, AI chat, admin, hardening, and
testing/seeding/deployment — with each phase carrying tasks, acceptance criteria,
verification notes, and an explicit "outstanding" list.

It opens with an audit of the *existing* state, including a frontend→backend
coverage matrix and a list of defects found during that audit. That mattered
because the frontend existed first, so several screens were calling endpoints that
didn't exist; the matrix is what turned "build a backend" into an ordered list.

### Q67. Tell me about a bug that taught you something.

The risk score. My first version added a flat penalty per abnormal finding, and it
tested fine — because the extractor could only read a handful of parameters. When
I expanded `labRanges` to 28, every moderately imperfect panel started scoring 100
and reporting "critical". The bug wasn't in the formula I wrote; it was in the
assumption that the input size was fixed.

That's what pushed me to proportional scoring, and then to the two corrections
that a naive ratio needs: a floor on the denominator so a one-parameter scan can't
score 100, and floors for critical values so a big normal panel can't dilute a
genuinely urgent result to nothing. The lesson I actually took: a metric that
works at one input scale is not validated: I now ask "what happens when this input
gets 10× bigger" of any scoring code.

### Q68. What was the hardest bug to find?

The pagination one, because nothing errored. Search results rendered as a single
page no matter how many matches existed, because the search branch returned
`count` without `page`/`pages` and the pager silently computed one page. Fixing
the branch would have worked; routing every list through `paginated()` meant it
couldn't recur. I now prefer fixes that remove a whole class of mistake over
fixes that correct one instance.

### Q69. How do you decide when to add a dependency versus write it yourself?

Security primitives, always a library — bcrypt, jsonwebtoken, helmet. Getting
those subtly wrong is catastrophic and unnoticeable. Small project-specific logic,
write it: `paginate.js`, `ApiError.js`, and `asyncHandler.js` are a few dozen
lines each and encode *my* contract, which no library knows. The test I apply is
whether the dependency would own a decision I need to be able to change.

---

## 16. Rapid-fire round

**Why bcrypt cost 12?** Roughly a quarter-second per hash on commodity hardware —
slow enough to make offline brute force expensive, fast enough that login doesn't
feel slow. It's the current common default; I'd raise it as hardware improves.

**Why `select: false` on `password`?** So a password hash can never leak through a
forgotten `.select()`. Any query that needs it opts in explicitly with
`.select('+password')` — secure by default, insecure by intent.

**What's in the JWT?** The user id, plus standard `iat`/`exp`. Deliberately not
the role — roles change, and a token carrying a stale role would grant access
after an admin revoked it. `protect` loads the fresh user on every request.

**Why 7-day expiry?** UX compromise with no refresh-token flow. Shorter would mean
frequent surprise logouts; the mitigation is that a password change kills every
outstanding token.

**Why `crypto.randomBytes` and not `Math.random` for tokens?** `Math.random` is
not cryptographically secure — its output is predictable from prior values, so a
reset token could be guessed.

**Why the 10 MB body limit?** Reports are the largest legitimate payload; anything
bigger is either a mistake or a memory-exhaustion attempt.

**What does `hpp` actually prevent?** `?page=1&page=2` arrives as an array, so
`parseInt` on it misbehaves. `hpp` collapses duplicates to a single value.

**Why is Helmet's CSP disabled?** The API serves JSON and avatar images, never
HTML embedding scripts, so a restrictive default CSP protects nothing here and
breaks Swagger UI. The frontend is where CSP belongs.

**Why `trust proxy`?** Behind a reverse proxy, `req.ip` is the proxy's address, so
every user shares one rate-limit bucket.

**Difference between `authLimiter` and `credentialsLimiter`?** 30/15min across all
of `/api/auth`, tightened to 10 for the endpoints that actually guess or reset
credentials — login, register, forgot/reset password.

**Why does `/api/health` exist?** Container healthchecks and load-balancer probes,
and it's the fastest way to confirm the API and its environment are up.

**Why `swagger-jsdoc` rather than a hand-written spec?** The docs live in JSDoc
comments next to the routes, so they're likelier to be updated with the code than
a separate file that drifts.

**Why does `/api/docs.json` exist separately?** For generating clients or
importing into Postman — the UI is for humans, the raw spec for tooling.

**What's `X-Request-Id` for?** Correlating a user's report with exact log lines;
inbound values are echoed so a caller can supply their own trace id.

**Why does morgan write through winston?** One log destination and one format, so
access and application logs are correlatable instead of split across streams.

**Why `slugify`?** Diseases and medicines are addressed by readable slugs
(`/medicines/paracetamol`) rather than ObjectIds — better URLs and better SEO on
public catalog pages.

**Why is `ChatSession` a collection?** So the assistant has conversation history
per user — listable, resumable, and deletable by the owner.

**Biggest thing you learned?** That most of the good decisions here were about
choosing where an invariant lives — the database for double-booking, the
middleware for auth, one helper for pagination — rather than about any individual
piece of code.
