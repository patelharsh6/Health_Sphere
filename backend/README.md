# 🏥 HealthSphere Backend API

Node.js + Express + MongoDB REST API for the HealthSphere digital healthcare platform.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (jsonwebtoken) + bcryptjs
- **Validation:** express-validator
- **Rate limiting:** express-rate-limit
- **File Upload:** Multer
- **Logging:** Morgan

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

Copy the `.env` file and update the values:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/healthsphere
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
```

### Run Development Server

```bash
npm run dev
```

### Seed Database (Sample Data)

```bash
npm run seed
```

This creates:
- 1 Admin (`admin@healthsphere.com` / `Admin@1234`)
- 2 Patients (`harsh@example.com` / `Patient@1234`)
- 6 Doctors (`rahul.doc@healthsphere.com` / `Doctor@1234`)
- 6 Diseases for the symptom checker

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
| POST | `/symptom-check` | Public | Check symptoms |
| GET | `/diseases` | Public | List all diseases |
| GET | `/diseases/:slug` | Public | Get disease detail |

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server status |

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
    │   └── env.js         # Environment config
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
    │   ├── rateLimit.js       # Auth rate limiters
    │   └── validate.js        # express-validator → 400 envelope
    ├── validators/
    │   ├── authValidators.js
    │   ├── appointmentValidators.js
    │   ├── reportValidators.js
    │   └── profileValidators.js
    └── utils/
        ├── jwt.js             # Token helpers
        ├── slugify.js         # Shared slug helper
        ├── reportParser.js    # AI report analysis (mock)
        ├── riskCalculator.js  # Health risk scoring
        ├── seedData/          # Static seed content (diseases)
        └── seeder.js          # Sample data seeder
```
