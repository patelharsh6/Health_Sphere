# 🏥 HealthSphere Frontend

React 19 single-page app for the HealthSphere platform. It talks to the
Express API in `../backend`. See the [root README](../README.md) for the full
project overview.

## Tech Stack

- **Framework:** React 19 (Create React App / `react-scripts` 5)
- **Routing:** react-router-dom 7
- **HTTP:** axios, through a single instance in `src/services/api.js`
- **Icons:** lucide-react
- **Styling:** plain CSS, one stylesheet per page
- **Testing:** Testing Library + Jest (via `react-scripts test`)

## Getting Started

```bash
cd frontend
npm install
npm start          # http://localhost:3000
```

Start the backend first (`cd backend && npm run dev`). Otherwise every page
shows its error state.

### Environment

| Key | Default | Notes |
|---|---|---|
| `REACT_APP_API_URL` | `http://localhost:5000/api` | API base URL, baked in at build time |

Static assets such as avatars are served from the server root, not from under
`/api`. Use the `assetUrl()` helper in `services/api.js` to build those URLs.

The backend's CORS allowlist contains exactly one origin (`CLIENT_URL` in
`backend/.env`). If you serve the frontend from anywhere other than
`http://localhost:3000`, update that value too.

### Scripts

| Command | What it does |
|---|---|
| `npm start` | Dev server with hot reload |
| `npm run build` | Production bundle in `build/` |
| `npm test` | Test runner in watch mode |

## Project Structure

```
src/
├── App.js                 # Route table
├── index.js               # Entry point
├── context/
│   └── AuthContext.js     # Current user, token, login/logout, isVerified
├── services/
│   └── api.js             # axios instance, interceptors, per-domain API groups
├── layouts/
│   ├── Navbar.js          # Role-aware navigation (patient / doctor / admin)
│   └── Footer.js
└── pages/                 # One component + CSS per screen
    ├── Home, Login, Signup, ForgotPassword, ResetPassword
    ├── SymptomChecker, AIAssistant
    ├── DiseaseListing, DiseaseDetail, MedicineListing, MedicineDetail
    ├── DoctorListing, BookAppointment, AppointmentHistory
    ├── PatientDashboard, ReportUpload, ReportAnalysis, UserProfile
    ├── DoctorDashboard, DoctorPatients, DoctorSchedule
    ├── NotFound
    └── admin/             # AdminDashboard, AdminUsers, AdminDoctors,
                           # AdminContent, AdminAppointments
```

## Auth & API conventions

- The JWT is stored in `localStorage` as `hs_token`. A request interceptor
  attaches it as `Authorization: Bearer <token>`.
- **Any 401 response wipes the token and redirects to `/login`.** For that
  reason the backend returns 403, never 401, when a logged-in user is not
  allowed to do something.
- `AuthContext` loads the user from `GET /auth/me` on mount. A password change
  returns a rotated token, and `changePassword` stores it, because the old
  token is invalidated on the server.
- Every response uses the envelope `{ success, message?, data, count?, page?, pages? }`.
  Pages check `res.data.success`.
- Every API call goes through a named group in `services/api.js`. Add new
  calls there rather than calling `api.get` from inside a page.

| Group | Covers |
|---|---|
| `authAPI` | register, login, me, logout, password change/forgot/reset, avatar |
| `patientAPI` | profile, dashboard |
| `doctorAPI` | listing, slots, profile, dashboard, schedule, upcoming, patients |
| `appointmentAPI` | book, list, today, detail, reschedule, confirm, complete, cancel, receipt |
| `reportAPI` | upload, list, detail, delete, reanalyze, trends, file URL |
| `aiAPI` | chat + sessions, symptom check, disease catalog |
| `medicineAPI` | listing, categories, detail |
| `adminAPI` | stats, users, doctor verification, appointments, content |

## Routes

"Who" is the intended audience. `App.js` has no client-side route guards; the
API enforces access, so a page opened by the wrong role gets a 403 from the
server.

| Path | Screen | Who |
|---|---|---|
| `/` | Home | Everyone |
| `/login`, `/signup` | Auth (full-screen, without navbar or footer) | Guests |
| `/forgot-password`, `/reset-password/:token` | Password recovery | Guests |
| `/symptoms` | Symptom checker | Everyone |
| `/ai-assistant` | AI assistant chat | Logged in |
| `/diseases`, `/diseases/:slug` | Disease catalog | Everyone |
| `/medicines`, `/medicines/:slug` | Medicine catalog | Everyone |
| `/doctors` | Doctor listing | Everyone |
| `/appointments` | Book an appointment | Patient |
| `/my-appointments` | Appointment history | Patient / Doctor |
| `/dashboard` | Patient dashboard | Patient |
| `/upload`, `/reports` | Report upload & list | Patient |
| `/analysis`, `/analysis/:id` | Report analysis | Patient / Doctor |
| `/doc-dashboard` | Doctor dashboard | Doctor |
| `/patients` | Linked patients | Doctor |
| `/schedule` (also `/doc-schedule`, `/doc_schedule`) | Weekly schedule | Doctor |
| `/profile` | User profile, avatar, password | Logged in |
| `/admin/dashboard`, `/admin/users`, `/admin/doctors`, `/admin/content`, `/admin/appointments` | Admin console | Admin |
| `*` | Not found | — |

## AI Assistant

`/ai-assistant` is backed by `POST /api/ai/chat`, and history is kept on the
server, so conversations survive a page reload. The page includes:

- a session sidebar with search, a "new chat" button, and per-session delete
  (it collapses into a drawer on small screens)
- a lightweight Markdown renderer for replies (headings, bullet and numbered
  lists, bold, italic, links) that shows the disclaimer as a callout
- suggestion chips returned by the API, and quick-start prompts on an empty chat
- copy-to-clipboard on each reply, and a distinct style for emergency responses

## Status

Every page loads from the API, with loading, empty, and error states. No mock
or fallback data arrays remain in `src/pages/`.

Known gaps:

- Only the Create React App placeholder test exists. Page-level tests are not
  written yet.
- `AdminContent` can create and delete diseases and medicines but cannot edit
  them, because the API has no `PUT` for content.
