# AQHI Weather Dashboard

A full-stack dashboard for exploring Canadian Air Quality Health Index data with charts, maps, filters, and a built-in AQHI assistant.

## What The App Does

- shows AQHI trends over time
- compares forecast and observation data
- summarizes AQHI with KPI cards
- maps latest station readings across Canada
- highlights category distribution and hourly averages
- lets users ask natural-language questions through the AQHI assistant

## Data Used

This project works with two AQHI data sources:

1. Static CSV seed files in `backend/data/`
2. Live ECCC GeoMet AQHI feeds pulled by the backend refresh service

AQHI categories used across the app:

- `Low`: `<= 3`
- `Moderate`: `4-6`
- `High`: `7-10`
- `Very High`: `> 10`

## Stack

### Backend

- FastAPI
- Strawberry GraphQL
- SQLAlchemy
- PostgreSQL
- Pandas
- APScheduler
- LangChain + Groq for the AQHI assistant

### Frontend

- React
- Vite
- Apollo Client
- Recharts
- MapLibre GL via `react-map-gl`
- React Select

## Project Structure

### Backend

- `backend/main.py`: FastAPI entrypoint
- `backend/app/graphql/schema.py`: GraphQL schema
- `backend/app/services/aqhi_service.py`: dashboard query logic
- `backend/app/services/live_data.py`: live AQHI refresh from ECCC
- `backend/app/agent/agent.py`: AQHI SQL agent setup
- `backend/app/agent/router.py`: `/agent/chat` endpoint
- `backend/load_data.py`: one-time CSV seed loader

### Frontend

- `frontend/src/pages/Dashboard.jsx`: main dashboard page
- `frontend/src/components/LineChart.jsx`: AQHI trend chart
- `frontend/src/components/DonutChart.jsx`: AQHI category distribution
- `frontend/src/components/HourlyChart.jsx`: hourly AQHI view
- `frontend/src/components/MapView.jsx`: AQHI station map
- `frontend/src/components/DataTable.jsx`: searchable AQHI table
- `frontend/src/components/ChatPanel.jsx`: AQHI assistant UI

## Local Setup

### 1. Create The Database

```sql
CREATE DATABASE aqhi_db;
```

### 2. Backend Setup

```powershell
cd backend
pip install -r requirements.txt
python load_data.py
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`

### 3. Frontend Setup

```powershell
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

## Environment Variables

### `backend/.env`

```env
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aqhi_db
GROQ_API_KEY=your_groq_api_key
ALLOWED_ORIGIN=http://localhost:5173
```

### `frontend/.env`

```env
VITE_API_URL=http://localhost:8000/graphql
VITE_BASE_URL=http://localhost:8000
VITE_AGENT_URL=http://localhost:8000/agent/chat
```

## Running The App

1. Start PostgreSQL
2. Start the backend
3. Start the frontend
4. Open `http://localhost:5173`

## Docker Deployment

A Docker-based Cybera deployment setup is included:

- `docker-compose.yml`
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `frontend/nginx.conf`
- `.env.docker.example`
- `DEPLOY_CYBERA_DOCKER.md`

For Cybera deployment steps, see **DEPLOY_CYBERA_DOCKER.md**

## Notes

- the frontend now uses MapLibre
- the backend supports both seeded CSV data and live refresh
- the AQHI assistant is tuned to answer in plain language and avoid dumping raw SQL back to users
