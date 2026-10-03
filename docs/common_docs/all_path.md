# HealthSphere — repository layout

The actual top-level structure. For details, see:

- [backend_path.md](../backend_docs/backend_path.md)
- [frontend_path.md](../frontend_docs/frontend_path.md)
- [ml_path.md](../ml_docs/ml_path.md) (not built)

```
Health_Sphere/
├── README.md                  # Project overview, setup, API, status
├── docker-compose.yml         # api + mongo, named volumes, secrets from backend/.env
│
├── backend/                   # Node + Express + MongoDB REST API
│   ├── src/                   # config, models, controllers, routes,
│   │                          # middleware, validators, utils
│   ├── tests/                 # 120 jest tests across 6 suites
│   ├── Dockerfile
│   ├── plan.md                # Implementation plan (complete) + audit log
│   └── README.md
│
├── frontend/                  # React 19 SPA (Create React App)
│   ├── src/                   # App.js, context/, services/, layouts/, pages/
│   └── README.md
│
└── docs/
    ├── backend_docs/backend_path.md
    ├── frontend_docs/frontend_path.md
    ├── ml_docs/ml_path.md
    └── common_docs/all_path.md   # This file
```

Two parts of the original sketch were not built:

- **`ml/`** — a Python model service. Lab analysis and symptom scoring run
  inside the backend instead; see `ml_path.md`.
- **Root `package.json`** — the backend and frontend are installed and run
  separately.
