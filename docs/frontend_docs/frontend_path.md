frontend/
│
├── public/
│   ├── index.html
│   └── assets/
│       ├── images/
│       ├── icons/
│       └── videos/
│
├── src/
│   ├── api/                       # All backend & ML API calls
│   │   ├── axiosInstance.js
│   │   ├── auth.api.js
│   │   ├── patient.api.js
│   │   ├── doctor.api.js
│   │   ├── appointment.api.js
│   │   ├── report.api.js
│   │   └── ai.api.js
│   │
│   ├── assets/                    # Images, icons used in components
│   │   ├── images/
│   │   ├── icons/
│   │   └── styles/
│   │       ├── variables.css
│   │       └── global.css
│   │
│   ├── components/                # Reusable UI components
│   │   ├── common/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Loader.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   │
│   │   ├── charts/
│   │   │   ├── LineChart.jsx
│   │   │   └── BarChart.jsx
│   │   │
│   │   └── cards/
│   │       ├── DiseaseCard.jsx
│   │       ├── DoctorCard.jsx
│   │       └── ReportCard.jsx
│   │
│   ├── pages/                     # Main pages (routes)
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   │
│   │   ├── home/
│   │   │   └── Home.jsx
│   │   │
│   │   ├── encyclopedia/
│   │   │   ├── DiseaseList.jsx
│   │   │   ├── DiseaseDetail.jsx
│   │   │   └── MedicineDetail.jsx
│   │   │
│   │   ├── symptom-checker/
│   │   │   └── SymptomChecker.jsx
│   │   │
│   │   ├── patient/
│   │   │   ├── PatientDashboard.jsx
│   │   │   ├── Appointments.jsx
│   │   │   ├── Reports.jsx
│   │   │   └── HealthInsights.jsx
│   │   │
│   │   ├── doctor/
│   │   │   ├── DoctorDashboard.jsx
│   │   │   ├── PatientList.jsx
│   │   │   └── Schedule.jsx
│   │   │
│   │   ├── admin/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── ManageDoctors.jsx
│   │   │   ├── ManagePatients.jsx
│   │   │   └── Analytics.jsx
│   │   │
│   │   └── blog/
│   │       ├── BlogList.jsx
│   │       └── BlogDetail.jsx
│   │
│   ├── routes/                    # Route definitions
│   │   ├── AppRoutes.jsx
│   │   └── RoleRoutes.jsx
│   │
│   ├── context/                   # Global state (Auth, User)
│   │   ├── AuthContext.jsx
│   │   └── UserContext.jsx
│   │
│   ├── hooks/                     # Custom hooks
│   │   ├── useAuth.js
│   │   └── useFetch.js
│   │
│   ├── utils/                     # Helper functions
│   │   ├── formatDate.js
│   │   ├── calculateRisk.js
│   │   └── constants.js
│   │
│   ├── layouts/                   # Page layouts
│   │   ├── MainLayout.jsx
│   │   ├── DashboardLayout.jsx
│   │   └── AuthLayout.jsx
│   │
│   ├── App.js
│   ├── index.js
│   └── index.css
│
├── .env
├── package.json
└── README.md
