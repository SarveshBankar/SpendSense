# SpendSense

**A Personal Finance Intelligence Platform**

SpendSense is a modern SaaS application that helps users upload bank statements, analyze spending patterns, categorize transactions, and visualize financial insights.

---

## Tech Stack

| Layer       | Technology                      |
| ----------- | ------------------------------- |
| Backend     | FastAPI, SQLAlchemy, SQLite     |
| Frontend    | React, TypeScript, Tailwind CSS |
| Tooling     | Vite, Uvicorn                   |

---

## Project Structure

```
SpendSense/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py           # FastAPI app entry point
│   │   ├── config.py         # Settings & environment config
│   │   ├── database.py       # SQLAlchemy engine & session
│   │   └── routers/
│   │       ├── __init__.py
│   │       └── health.py     # Health-check endpoint
│   ├── requirements.txt
│   ├── .env
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── index.css         # Tailwind entry
│   │   └── components/
│   │       └── LandingPage.tsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .env
│   └── .env.example
├── README.md
└── .gitignore
```

---

## Setup Instructions

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/spendsense.git
cd spendsense
```

### 2. Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env           # Configure environment variables
uvicorn app.main:app --reload  # Starts at http://localhost:8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env           # Configure environment variables
npm run dev                    # Starts at http://localhost:5173
```

### 4. Verify

Open [http://localhost:5173](http://localhost:5173) in your browser. The landing page should display and show a live API status indicator.

---

## API Endpoints

| Method | Endpoint          | Description          |
| ------ | ----------------- | -------------------- |
| GET    | `/`               | Root check           |
| GET    | `/api/v1/health`  | Health check         |
| GET    | `/docs`           | Swagger UI           |

---

## Current Phase

**Phase 1** — Project scaffolding, landing page, and health-check API.

---

## License

MIT
