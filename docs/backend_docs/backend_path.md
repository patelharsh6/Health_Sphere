backend/                  # Node + Express API
   ├── src/
   │   ├── config/           # DB, env, cloud configs
   │   │   ├── db.js
   │   │   └── env.js
   │   │
   │   ├── models/           # MongoDB schemas
   │   │   ├── User.js
   │   │   ├── Patient.js
   │   │   ├── Doctor.js
   │   │   ├── Appointment.js
   │   │   ├── Report.js
   │   │   └── Disease.js
   │   │
   │   ├── controllers/      # Business logic
   │   │   ├── authController.js
   │   │   ├── patientController.js
   │   │   ├── doctorController.js
   │   │   ├── appointmentController.js
   │   │   ├── reportController.js
   │   │   └── aiController.js
   │   │
   │   ├── routes/           # API routes
   │   │   ├── authRoutes.js
   │   │   ├── patientRoutes.js
   │   │   ├── doctorRoutes.js
   │   │   ├── appointmentRoutes.js
   │   │   ├── reportRoutes.js
   │   │   └── aiRoutes.js
   │   │
   │   ├── middleware/       # Auth, role checks
   │   │   ├── authMiddleware.js
   │   │   └── roleMiddleware.js
   │   │
   │   ├── utils/            # Helpers
   │   │   ├── jwt.js
   │   │   ├── reportParser.js
   │   │   └── riskCalculator.js
   │   │
   │   └── app.js            # Express app
   │
   ├── server.js             # Entry point
   └── package.json