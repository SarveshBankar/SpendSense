# SpendSense

> Personal Finance Intelligence Platform — AI-powered expense tracking, budgeting, and financial insights.

---

## Features

- **Bank Statement Parsing** — Upload CSV or PDF bank statements; auto-extract transactions
- **Smart Categorization** — Rule-based AI engine categorizes transactions into 14+ categories (Food, Shopping, Bills, Salary, etc.)
- **Dashboard** — Real-time financial summary with KPIs, charts, and health score
- **Budget Management** — Create monthly budgets per category with progress tracking, daily allowance, and overspend alerts
- **Savings Goals** — Set and track savings goals with progress visualization
- **Advanced Analytics** — Spending trends, cash flow analysis, subscription detection, merchant analysis, calendar heatmap
- **Financial Reports** — Monthly, yearly, and custom date range reports with CSV/Excel/PDF export
- **Financial Health Score** — AI-driven 0–100 score based on savings rate, expense ratio, categorization, volume, and stability
- **Authentication** — JWT-based auth with access/refresh tokens, password strength validation
- **Dark Theme** — Premium dark UI with glass morphism, emerald/indigo palette

---

## Screenshots

*Screenshots coming soon*

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                     │
│  TypeScript · Tailwind CSS · Framer Motion · Recharts   │
│         Lazy-loaded routes · Code-split chunks           │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP / REST
                         ▼
┌─────────────────────────────────────────────────────────┐
│                     Backend (FastAPI)                     │
│  Python · SQLAlchemy · Alembic · Pydantic · PyJWT        │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐       │
│  │ Routes   │→ │ Services │→ │ Repositories     │       │
│  │ (v1/api) │  │ (Business│  │ (Data access)    │       │
│  │          │  │  Logic)  │  │                  │       │
│  └──────────┘  └──────────┘  └──────────────────┘       │
│                                    │                     │
│                                    ▼                     │
│                           ┌──────────────────┐           │
│                           │   SQLAlchemy ORM │           │
│                           │   SQLite / PG    │           │
│                           └──────────────────┘           │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Recharts, React Router v6 |
| **Backend** | Python 3.12+, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2 |
| **Database** | SQLite (dev), PostgreSQL-ready (prod) |
| **Auth** | JWT (access + refresh tokens), bcrypt, HTTP Bearer |
| **Parsing** | PyPDF, custom CSV parser with dialect detection |
| **Categorization** | Rule-based engine with 340+ patterns across 14 categories |
| **Export** | CSV, Excel (openpyxl), PDF (ReportLab) |
| **Testing** | pytest, httpx, TestClient |
| **Deployment** | Docker, docker-compose, Nginx |

---

## Installation

### Prerequisites

- Python 3.12+
- Node.js 20+
- npm

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start the backend server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies API requests to `http://localhost:8000`.

---

## Docker

### One-command setup

```bash
docker compose up --build
```

This starts:
- **Backend** at `http://localhost:8000`
- **Frontend** at `http://localhost:3000`

### Services

| Service | Port | Description |
|---------|------|-------------|
| `spendsense-backend` | 8000 | FastAPI application |
| `spendsense-frontend` | 3000 | Nginx-served React SPA |

---

## API Documentation

With the server running, visit:

- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc
- **OpenAPI JSON**: http://localhost:8000/api/openapi.json

### Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/health` | No | Health check |
| POST | `/api/v1/auth/register` | No | Register user |
| POST | `/api/v1/auth/login` | No | Login |
| POST | `/api/v1/auth/refresh` | No | Refresh token |
| GET | `/api/v1/auth/me` | Bearer | Current user |
| POST | `/api/v1/statements/upload` | Bearer | Upload statement |
| GET | `/api/v1/statements` | Bearer | List statements |
| POST | `/api/v1/statements/{id}/parse` | Bearer | Parse statement |
| DELETE | `/api/v1/statements/{id}` | Bearer | Delete statement |
| GET | `/api/v1/transactions` | Bearer | List transactions |
| POST | `/api/v1/transactions/categorize` | Bearer | Categorize all |
| GET | `/api/v1/insights` | Bearer | Financial insights |
| GET | `/api/v1/budgets` | Bearer | List budgets |
| POST | `/api/v1/budgets` | Bearer | Create budget |
| PUT | `/api/v1/budgets/{id}` | Bearer | Update budget |
| DELETE | `/api/v1/budgets/{id}` | Bearer | Delete budget |
| GET | `/api/v1/goals` | Bearer | List goals |
| POST | `/api/v1/goals` | Bearer | Create goal |
| PUT | `/api/v1/goals/{id}` | Bearer | Update goal |
| DELETE | `/api/v1/goals/{id}` | Bearer | Delete goal |
| GET | `/api/v1/analytics` | Bearer | Advanced analytics |
| GET | `/api/v1/profile` | Bearer | Get profile |
| PUT | `/api/v1/profile` | Bearer | Update profile |
| PUT | `/api/v1/profile/password` | Bearer | Change password |
| GET | `/api/v1/settings` | Bearer | Get settings |
| PUT | `/api/v1/settings` | Bearer | Update settings |
| GET | `/api/v1/reports/list` | Bearer | Available periods |
| GET | `/api/v1/reports/monthly` | Bearer | Monthly report |
| GET | `/api/v1/reports/yearly` | Bearer | Yearly report |
| GET | `/api/v1/reports/custom` | Bearer | Custom report |
| GET | `/api/v1/reports/export/csv` | Bearer | Export CSV |
| GET | `/api/v1/reports/export/excel` | Bearer | Export Excel |
| GET | `/api/v1/reports/export/pdf` | Bearer | Export PDF |

---

## Folder Structure

```
SpendSense/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # Route handlers (controllers)
│   │   ├── core/            # Config, security, logging, exceptions
│   │   ├── db/              # Database session, base model
│   │   ├── models/          # SQLAlchemy models
│   │   ├── repositories/    # Data access layer
│   │   ├── schemas/         # Pydantic request/response models
│   │   ├── services/        # Business logic
│   │   │   ├── categorizer/ # Rule-based categorization engine
│   │   │   └── parsers/     # CSV and PDF statement parsers
│   │   └── utils/           # File storage helpers
│   ├── alembic/             # Database migrations
│   ├── tests/               # pytest test suite
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components, charts, statement/transaction components
│   │   ├── context/         # Auth context
│   │   ├── hooks/           # Custom hooks
│   │   ├── layouts/         # Dashboard layout (top nav)
│   │   ├── pages/           # Route pages (10 pages)
│   │   └── services/        # API client (axios)
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## Running Tests

### Backend

```bash
cd backend
python -m pytest tests/ -v
```

### Frontend

```bash
cd frontend
npm test
```

---

## Security

- JWT access tokens (60 min) + refresh tokens (7 days)
- Password strength validation (8+ chars, upper, lower, digit, special)
- bcrypt password hashing
- Rate limiting (100 req/min per IP)
- Secure HTTP headers (HSTS, XSS, CSP, etc.)
- CORS origin whitelist
- File upload validation (type, size, magic bytes)
- Request logging with duration tracking

---

## Environment Variables

See `.env.example` in both `backend/` and `frontend/` directories for all configurable options.

---

## Future Scope

- PostgreSQL support (production database)
- User onboarding wizard
- Recurring transaction detection
- Bank API integration (via Plaid/Finverse)
- Budget vs actual charts with forecasting
- Multi-currency support
- Team/shared budgets
- Email reports and notifications
- Mobile app (React Native)
- CI/CD pipeline (GitHub Actions)
- Monitoring (Prometheus + Grafana)
- Sentry error tracking

---

## License

MIT
