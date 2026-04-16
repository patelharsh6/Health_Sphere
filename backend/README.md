# 🏥 HealthSphere Backend API

Node.js + Express + MongoDB REST API for the HealthSphere digital healthcare platform.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (jsonwebtoken) + bcryptjs
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

### Auth (`/api/auth`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/register` | Public | Register new user |
| POST | `/login` | Public | Login user |
| GET | `/me` | Private | Get current user |

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
    │   └── roleMiddleware.js  # Role-based access
    └── utils/
        ├── jwt.js             # Token helpers
        ├── reportParser.js    # AI report analysis (mock)
        ├── riskCalculator.js  # Health risk scoring
        └── seeder.js          # Sample data seeder
```
