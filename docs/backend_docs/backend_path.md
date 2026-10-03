# Backend — folder structure

This is the actual layout of `backend/`. Endpoints, environment variables and
conventions are documented in [`backend/README.md`](../../backend/README.md).

```
backend/                       # Node + Express API
├── server.js                  # Entry point
├── package.json               # start, dev, seed, test, test:watch, test:coverage
├── Dockerfile                 # Multi-stage, non-root, dumb-init, healthcheck
├── .env / .env.example        # Both git-ignored
├── plan.md                    # Implementation plan + audit log (complete)
├── README.md                  # Backend reference
│
├── src/
│   ├── app.js                 # Express app: security middleware, routes, errors
│   │
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   ├── env.js             # The only place process.env is read
│   │   ├── logger.js          # winston (file + console)
│   │   ├── swagger.js         # OpenAPI spec → /api/docs
│   │   └── cloudinary.js      # Optional remote storage driver
│   │
│   ├── models/
│   │   ├── User.js            # Auth identity, role, reset token
│   │   ├── Patient.js
│   │   ├── Doctor.js          # weeklySchedule, blockedDates, isVerified
│   │   ├── Admin.js
│   │   ├── Appointment.js     # Partial unique index blocks double-booking
│   │   ├── Report.js          # aiAnalysis.findings, riskScore, status
│   │   ├── Disease.js
│   │   ├── Medicine.js
│   │   ├── ChatSession.js
│   │   └── DoctorPatientLink.js
│   │
│   ├── controllers/           # auth, patient, doctor, appointment, report,
│   │                          # medicine, ai, admin
│   ├── routes/                # One router per controller, Swagger-annotated
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js  # protect (JWT + passwordChangedAt check)
│   │   ├── roleMiddleware.js  # authorize(...roles)
│   │   ├── rateLimit.js       # Global, auth, credential, symptom, chat limiters
│   │   ├── validate.js        # express-validator → 400 envelope
│   │   └── errorHandler.js    # Request id, 404, global error translation
│   │
│   ├── validators/            # auth, appointment, report, profile
│   │
│   └── utils/
│       ├── jwt.js
│       ├── ApiError.js        # Error carrying an HTTP status
│       ├── asyncHandler.js
│       ├── paginate.js        # { count, page, pages } contract
│       ├── slugify.js
│       ├── labRanges.js       # 28 lab parameters, aliases, sex-aware ranges
│       ├── reportParser.js    # pdf-parse / tesseract.js extraction + trends
│       ├── riskCalculator.js  # Weighted risk score
│       ├── aiEngine.js        # Emergency check → rules engine → Gemini chain
│       ├── seeder.js          # Idempotent; --fresh, --help
│       └── seedData/          # diseases.js, medicines.js
│
├── tests/                     # jest + supertest + mongodb-memory-server
│   ├── setup.js, helpers.js
│   └── auth, appointments, reports, catalog, security, parser .test.js
│
├── uploads/                   # Local report + avatar store (git-ignored)
└── logs/                      # winston output (git-ignored)
```
