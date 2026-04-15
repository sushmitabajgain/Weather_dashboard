# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

AQHI (Air Quality Health Index) Visualization Dashboard is a full-stack application for exploring Canadian air quality data. The backend serves a GraphQL API and an AI chat endpoint, while the frontend is a single-page React dashboard with charts, a map, and a chat panel.

## Commands

### Backend (run from `backend/`)

```
# Activate the virtual environment (Windows)
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Seed the database from static CSVs (one-time)
python load_data.py

# Run the development server
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`. GraphQL playground available at `http://localhost:8000/graphql`.

### Frontend (run from `frontend/`)

```
npm install
npm run dev      # dev server at http://localhost:5173
npm run build    # production build
npm run lint     # ESLint
npm run preview  # preview production build
```

## Environment Variables

**`backend/.env`** (copy from `backend/.env.example`)
```
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aqhi_db
GROQ_API_KEY=your_groq_api_key
ALLOWED_ORIGIN=http://localhost:5173
```
`GROQ_API_KEY` is required for the AI chat feature (`/agent/chat`). `ALLOWED_ORIGIN` controls the CORS allowed origin (defaults to `http://localhost:5173` if unset).

**`frontend/.env`**
```
VITE_API_URL=http://localhost:8000/graphql
VITE_BASE_URL=http://localhost:8000
```
`VITE_BASE_URL` is used for the REST data-refresh call in `Dashboard.jsx` (`/data/refresh`).

## Database Setup

Create the PostgreSQL database before first run:
```sql
CREATE DATABASE aqhi_db;
```
The `aqhi_data` table is created automatically by SQLAlchemy on first startup (via `Base.metadata.create_all`). Static CSVs live in `backend/data/`.

## Architecture

### Backend (`backend/`)

`main.py` is the FastAPI entry point. It calls `load_dotenv()`, registers three routers, and starts an APScheduler job that auto-refreshes live data every 30 minutes on startup:

- **`/graphql`**: Strawberry GraphQL for all dashboard queries
- **`/agent/chat`**: POST endpoint for natural-language AQHI queries
- **`/data/refresh`** and **`/data/status`**: REST endpoints to manually trigger or check live data refresh

**Data flow with two sources:**
1. **Static CSV** (`load_data.py`): one-time bulk load of `aqhi_forecast.csv` and `aqhi_observations.csv` into the `aqhi_data` table.
2. **Live ECCC GeoMet API** (`app/services/live_data.py`): fetches a ±48-hour window from `https://api.weather.gc.ca/collections` and atomically replaces the table contents (TRUNCATE + INSERT).

**`app/` package layout:**
- `db/models.py`: single SQLAlchemy model `AQHI` that maps the `aqhi_data` table
- `db/session.py`: `SessionLocal`, `engine`, `Base`
- `graphql/schema.py`: Strawberry schema with 6 query fields: `aqhiData`, `kpis`, `hourlyAvg`, `categoryDistribution`, `mapPoints`, `locations`; all data fields accept optional `year`, `locations`, `datasetType`, and `lastHours` filter args
- `services/aqhi_service.py`: query logic shared across the backend. Every function uses the `apply_filters(query, year, locations, dataset_type, last_hours)` helper. When `last_hours` is set, it takes precedence over `year`.
- `services/live_data.py`: fetches from the ECCC API and reloads the database. It sets `verify=False` to bypass SSL-inspecting proxies on university networks.
- `agent/agent.py`: lazily initialized LangChain SQL agent using `ChatGroq` with model `llama-3.3-70b-versatile` and AQHI-specific domain context
- `agent/router.py`: exposes `POST /agent/chat`, accepts `{ "question": "..." }`, and returns `{ "answer": "..." }`
- `routers/data.py`: async wrappers around `refresh_live_data`

**AQHI category thresholds** (used in both `load_data.py` and `live_data.py`): ≤3 → Low, 4–6 → Moderate, 7–10 → High, >10 → Very High.

`dataset_type` values are exactly `"Forecast"` or `"Observation"` (capital first letter) throughout the stack.

### Frontend (`frontend/`)

Single-page app. `src/main.jsx` bootstraps `ApolloProvider` reading the GraphQL URI from `VITE_API_URL` and renders `<App>`. `App.jsx` uses `react-router-dom` to mount `<Dashboard>` at `/`.

`src/pages/Dashboard.jsx` is the only page. It owns filter state (`timeRange`, `locations`, `datasetType`) and fires five GraphQL queries in parallel. `timeRange` (`"24h"` | `"48h"` | `"7d"` | `"year"`) is mapped to `lastHours`/`year` variables via an inline `TIME_PRESETS` object before being passed to each query; `"year"` maps to the hardcoded year `2026`. Filter changes propagate to every chart via the shared `variables` object.

`src/graphql/queries.js` defines all GQL query documents: `GET_AQHI`, `GET_KPIS`, `GET_HOURLY`, `GET_CATEGORY`, `GET_MAP`, `GET_LOCATIONS`.

`src/components/` contains self-contained presentational components (`LineChart`, `DonutChart`, `HourlyChart`, `MapView`, `DataTable`, `KPI`, `Filters`, `ChatPanel`). `Filters.jsx` issues the `GET_LOCATIONS` query itself to populate the multi-select. `ChatPanel` calls `POST /agent/chat` directly via `fetch`.

The map uses **MapLibre GL** through `react-map-gl`. No Mapbox token is needed for the base tile layer used.
