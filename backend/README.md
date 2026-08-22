# 🏥 HealthSphere Backend API

Node.js + Express + MongoDB REST API for the HealthSphere digital healthcare platform.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (jsonwebtoken) + bcryptjs
- **Validation:** express-validator
- **Rate limiting:** express-rate-limit
- **File Upload:** Multer (local disk or Cloudinary)
- **Report parsing:** pdf-parse (text PDFs) + tesseract.js (OCR for scans)
- **AI assistant:** catalog-grounded rules engine, optional Google Gemini
- **Security:** helmet, express-mongo-sanitize, hpp, express-rate-limit, CORS allowlist
- **Logging:** winston (file + console), morgan piped through it
- **Docs:** swagger-jsdoc + swagger-ui-express at `/api/docs`
- **Testing:** jest + supertest + mongodb-memory-server

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB running locally (or a MongoDB Atlas URI)

### Installation

```bash
cd backend
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill it in. Every key the backend reads is
listed below; the code reads them **only** through `src/config/env.js`.

| Key | Required | Default | Notes |
|---|---|---|---|
| `NODE_ENV` | no | `development` | `production` enables strict checks and quiets debug logs |
| `PORT` | no | `5000` | |
| `MONGO_URI` | **in production** | `mongodb://localhost:27017/healthsphere` | Server exits on boot if missing when `NODE_ENV=production` |
| `JWT_SECRET` | **in production** | insecure dev fallback | Exits in production if missing; warns in development |
| `JWT_EXPIRE` | no | `7d` | |
| `SESSION_SECRET` | no | - | Reserved; not currently read |
| `CLIENT_URL` | no | `http://localhost:3000` | The **only** allowed CORS origin, and the base for password-reset links |
| `AI_PROVIDER` | no | `rules` | `rules` = catalog-grounded engine only (no key, no quota). `gemini` = Gemini overlay, falling back to `rules` on any error |
| `GEMINI_API_KEY` | only if `AI_PROVIDER=gemini` | - | Free key, no card: <https://aistudio.google.com/apikey>. Warns at boot if the provider is `gemini` but this is empty |
| `GEMINI_MODEL` | no | `gemini-2.5-flash` | Override if Google renames the free-tier model |
| `STORAGE_DRIVER` | no | `local` | `local` writes to `backend/uploads/`. `cloudinary` needs all three keys below and **silently downgrades to `local`** with a warning if any is missing |
| `CLOUDINARY_CLOUD_NAME` | only if cloudinary | - | |
| `CLOUDINARY_API_KEY` | only if cloudinary | - | |
| `CLOUDINARY_API_SECRET` | only if cloudinary | - | |

`.env` is git-ignored. So is `.env.example` - keep it placeholders-only, and
never commit real credentials to either.

> **Uploads are not static.** Medical reports are streamed through
> `GET /api/reports/:id/file` behind an ownership check. Only
> `/uploads/avatars` is publicly mounted. With `STORAGE_DRIVER=local` the
> `uploads/` directory **is** the report store - back it up, and use a volume
> (or Cloudinary) on any host with an ephemeral disk.

### Run Development Server

```bash
npm run dev
```

### Seed Database (Sample Data)

```bash
npm run seed              # idempotent: adds only what is missing, deletes nothing
npm run seed -- --fresh   # DESTRUCTIVE: wipes the seeded collections first
npm run seed -- --help    # usage and test credentials
```

The default mode is safe to run against a database that already holds real
accounts: it upserts by email/slug, and never resets an existing password.
Use `--fresh` only when you want a clean demo dataset.

Seeds 1 admin, 5 patients, 13 doctors (12 verified + 1 awaiting verification so
the admin queue is not empty), 15 diseases, 12 medicines, 8 appointments across
past and future dates, and 4 analysed reports - including two lipid panels for
the same patient so the trends endpoint has history to compare.

Doctor coverage spans every `specialistType` the disease catalog references, so
the "find a specialist" CTA on a disease page is never a dead end. The seeder
prints a warning if that ever stops being true.

| Role | Email | Password |
|---|---|---|
| Admin | `admin@healthsphere.com` | `Admin@1234` |
| Patient | `harsh@example.com` | `Patient@1234` |
| Doctor | `rahul.doc@healthsphere.com` | `Doctor@1234` |

### Tests

```bash
npm test              # full suite
npm run test:coverage # with coverage
```

Every suite runs against a throwaway in-memory MongoDB (`mongodb-memory-server`),
so tests never touch a real database. The first run downloads a MongoDB binary.

### API Documentation

With the server running:

- Interactive UI - <http://localhost:5000/api/docs>
- Raw OpenAPI spec - <http://localhost:5000/api/docs.json>

### Docker

```bash
# from the repository root; reads secrets from backend/.env
docker compose up --build
docker compose exec api npm run seed -- --fresh
```

Brings up the API plus its own MongoDB, with named volumes for `uploads/`,
`logs/` and the database. `docker compose down -v` deletes that data.

## API Endpoints

All `/api/auth` routes are rate limited (30 requests / 15 min / IP; 10 for the
credential endpoints). Every mutating route runs `express-validator` rules and
returns `400 { success, message, errors: { field } }` on a validation failure.

### Auth (`/api/auth`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/register` | Public | Register new user (patient / doctor / admin) |
| POST | `/login` | Public | Login user |
| GET | `/me` | Private | Get current user, role profile, and `isVerified` |
| PUT | `/password` | Private | Change password (returns a rotated token) |
| POST | `/forgot-password` | Public | Request a reset token |
| POST | `/reset-password/:token` | Public | Reset the password with that token |
| POST | `/avatar` | Private | Upload an avatar (`avatar` field, image, 2 MB) |
| POST | `/logout` | Private | Stateless logout acknowledgement |

**Doctor verification** — a new doctor is created with `isVerified: false` and is
excluded from `GET /api/doctors` until an admin approves the medical license
(`PUT /api/admin/doctors/:id/verify`, Phase 7). They can log in, and `/me`
reports `isVerified: false` so the UI can show a pending state.

**Password reset** — only a SHA-256 hash of the token is stored, on
`User.resetPasswordToken`, with a 30-minute expiry. Tokens are single use.
Mail delivery arrives in Phase 8; until then the reset URL is logged
server-side and, outside production, also returned in the response body so the
flow is testable. Changing or resetting a password invalidates every token
issued before the change.

**Avatars** — written to `uploads/avatars/` and served from the public
`/uploads/avatars` static mount. Everything else under `uploads/` stays
auth-gated: medical reports are streamed through `GET /api/reports/:id/file`.

### Patients (`/api/patients`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/profile` | Patient | Get own profile |
| PUT | `/profile` | Patient | Update profile |
| GET | `/dashboard` | Patient | Get dashboard summary |
| GET | `/:id` | Doctor/Admin | View a patient |

### Doctors (`/api/doctors`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | List all doctors |
| GET | `/:id` | Public | Get doctor by ID |
| GET | `/:id/slots?date=` | Public | Get available slots |
| PUT | `/profile` | Doctor | Update own profile |

### Appointments (`/api/appointments`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Patient | Book appointment |
| GET | `/` | Private | Get my appointments |
| GET | `/:id` | Private | Get appointment detail |
| PUT | `/:id` | Doctor/Admin | Update status/prescription |
| PUT | `/:id/cancel` | Private | Cancel appointment |

### Reports (`/api/reports`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/upload` | Patient | Upload medical report |
| GET | `/` | Patient | Get my reports |
| GET | `/:id` | Private | Get report with analysis |
| GET | `/:id/file` | Owner/Doctor/Admin | Stream the report file |
| PUT | `/:id/review` | Doctor | Review a report |

### AI (`/api/ai`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/symptom-check` | Public | Score symptoms against the disease catalog |
| GET | `/diseases` | Public | List diseases (`?search=&category=`) |
| GET | `/diseases/categories` | Public | Distinct categories, for the filter chips |
| GET | `/diseases/:slug` | Public | Disease detail |
| GET | `/diseases/:slug/doctors` | Public | Verified doctors matching `specialistType` |
| POST | `/chat` | Private | Assistant reply + suggestion chips (30/hr) |
| GET | `/chat/sessions` | Private | List the caller's chat sessions |
| GET | `/chat/:sessionId` | Private | One session with full history |
| DELETE | `/chat/:sessionId` | Private | Delete a session |

### Medicines (`/api/medicines`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | List medicines (`?search=&category=&type=&page=&limit=`) |
| GET | `/categories` | Public | Distinct categories with counts |
| GET | `/:slug` | Public | Medicine detail |

### Admin (`/api/admin`) - all routes require the `admin` role
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats` | Platform counts |
| GET | `/users` | All users |
| PUT | `/users/:id/status` | Activate / deactivate |
| DELETE | `/users/:id` | Delete a user |
| GET | `/doctors/pending` | Doctors awaiting verification |
| PUT | `/doctors/:id/verify` | Approve a doctor |
| GET | `/appointments` | All appointments |
| GET/POST/DELETE | `/content/diseases[/:id]` | Disease catalog management |
| GET/POST/DELETE | `/content/medicines[/:id]` | Medicine catalog management |

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server status |

## Response & error conventions

Every endpoint answers with the same envelope:

```json
{ "success": true, "data": {}, "count": 0, "page": 1, "pages": 1 }
{ "success": false, "message": "...", "errors": { "field": "why" } }
```

- List endpoints go through `utils/paginate.js`, so `count`, `page` and `pages`
  are always present - including on search branches.
- Controllers throw; `middleware/errorHandler.js` maps the failure to a status
  and the envelope above. Mongoose `ValidationError` becomes a 400 with
  field-level `errors`, `CastError` a 400, duplicate keys a 409.
- **Authorization failures return 403, never 401.** The web client wipes the
  session and redirects to `/login` on any 401, so a 401 for "logged in but not
  allowed" would silently sign a valid user out. `ApiError.forbidden()` exists
  to make the right choice the easy one.
- Every response carries an `X-Request-Id` (echoing the request's own if it sent
  one) which is attached to the matching log lines in `logs/`.

## Project Structure

```
backend/
├── server.js              # Entry point
├── package.json
├── .env
├── .gitignore
└── src/
    ├── app.js             # Express app setup
    ├── config/
    │   ├── db.js          # MongoDB connection
    │   ├── env.js         # THE only place process.env is read
    │   ├── logger.js      # winston (file + console)
    │   ├── swagger.js     # OpenAPI spec for /api/docs
    │   └── cloudinary.js  # Optional remote storage driver
    ├── models/
    │   ├── User.js        # User schema (auth)
    │   ├── Patient.js     # Patient profile
    │   ├── Doctor.js      # Doctor profile
    │   ├── Appointment.js # Appointments
    │   ├── Report.js      # Medical reports
    │   ├── Admin.js       # Admin profile (hospitalId, permissions)
    │   └── Disease.js     # Disease reference
    ├── controllers/
    │   ├── authController.js
    │   ├── patientController.js
    │   ├── doctorController.js
    │   ├── appointmentController.js
    │   ├── reportController.js
    │   └── aiController.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── patientRoutes.js
    │   ├── doctorRoutes.js
    │   ├── appointmentRoutes.js
    │   ├── reportRoutes.js
    │   └── aiRoutes.js
    ├── middleware/
    │   ├── authMiddleware.js  # JWT verification
    │   ├── roleMiddleware.js  # Role-based access
    │   ├── rateLimit.js       # Auth, credential and global limiters
    │   ├── errorHandler.js    # requestId + 404 + global error translation
    │   └── validate.js        # express-validator → 400 envelope
    ├── validators/
    │   ├── authValidators.js
    │   ├── appointmentValidators.js
    │   ├── reportValidators.js
    │   └── profileValidators.js
    └── utils/
        ├── jwt.js             # Token helpers
        ├── slugify.js         # Shared slug helper
        ├── ApiError.js        # Error carrying an HTTP status
        ├── asyncHandler.js    # Wraps handlers so rejections reach Express
        ├── paginate.js        # One pagination contract for all lists
        ├── labRanges.js       # 28 lab parameters, aliases, sex-aware ranges
        ├── reportParser.js    # PDF/OCR extraction + trend computation
        ├── riskCalculator.js  # Health risk scoring
        ├── aiEngine.js        # Rules engine + optional Gemini tier
        ├── seedData/          # Static seed content (diseases, medicines)
        └── seeder.js          # Idempotent sample data seeder

tests/
├── setup.js              # in-memory Mongo bootstrap
├── helpers.js            # fixture builders
├── auth.test.js          # registration, login, tokens, reset, role guards
├── appointments.test.js  # booking rules, double-booking, authorization
├── reports.test.js       # PHI access control, file streaming, deletion
├── catalog.test.js       # diseases, medicines, symptom checker, pagination
├── security.test.js      # headers, CORS, injection, error envelope
└── parser.test.js        # lab extraction, trends, risk scoring
```
