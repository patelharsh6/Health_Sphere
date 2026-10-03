# Frontend — folder structure

This is the actual layout of `frontend/`. Setup, routes and the API client are
documented in [`frontend/README.md`](../../frontend/README.md).

The original plan split API calls into `src/api/*.api.js` files and pages into
per-area folders of `.jsx` files. The project went flatter instead: one
`services/api.js`, and a single `pages/` folder with `admin/` as its only
subfolder.

```
frontend/
├── public/                    # index.html, favicon, manifest, logos
├── build/                     # Production bundle (npm run build)
├── package.json
├── README.md
│
└── src/
    ├── App.js                 # Route table
    ├── App.css, index.css
    ├── index.js               # Entry point
    ├── accets/logo.png
    │
    ├── context/
    │   └── AuthContext.js     # User, token, login/logout, isVerified, changePassword
    │
    ├── services/
    │   └── api.js             # axios instance + interceptors, assetUrl(),
    │                          # authAPI, patientAPI, doctorAPI, appointmentAPI,
    │                          # reportAPI, aiAPI, medicineAPI, adminAPI
    │
    ├── layouts/
    │   ├── Navbar.js / .css   # Role-aware navigation
    │   └── Footer.js / .css
    │
    └── pages/                 # Each page has a matching .css file
        ├── Home
        ├── Login, Signup, ForgotPassword, ResetPassword
        ├── SymptomChecker
        ├── AIAssistant        # Chat with session sidebar + Markdown replies
        ├── DiseaseListing, DiseaseDetail
        ├── MedicineListing, MedicineDetail
        ├── DoctorListing, BookAppointment, AppointmentHistory
        ├── PatientDashboard, ReportUpload, ReportAnalysis
        ├── DoctorDashboard, DoctorPatients, DoctorSchedule
        ├── UserProfile
        ├── NotFound
        └── admin/
            ├── Admin.css
            ├── AdminDashboard.js
            ├── AdminUsers.js
            ├── AdminDoctors.js
            ├── AdminContent.js
            └── AdminAppointments.js
```
