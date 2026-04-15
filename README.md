# AQHI Weather Dashboard

AQHI Weather Dashboard is a full-stack web application for exploring Canadian Air Quality Health Index data through charts, tables, map-based views, and a built-in AQHI assistant. The project combines a FastAPI backend, PostgreSQL storage, Strawberry GraphQL, live data refresh support, and a React frontend with shared filters and coordinated visualizations.

## Features

- Compare AQHI forecast and observation data in one interface
- View KPI summaries, trend charts, hourly averages, category distribution, and a searchable table
- Inspect the latest station readings on an interactive Canada map powered by MapLibre
- Ask natural-language AQHI questions through a database-aware AI assistant
- Refresh live AQHI data from the ECCC GeoMet API
- Use synchronized filters for time range, location, and dataset type across the dashboard

## Quick Start

```bash
git clone https://github.com/sushmitabajgain/Weather_dashboard.git
cd weather-dashboard
```

Then follow the setup steps in [Local Setup](#local-setup).

## System Overview

The application is organized as a single dashboard experience with a shared backend data layer.

- The backend exposes GraphQL queries for dashboard analytics, REST endpoints for live refresh, and an AI chat endpoint at `/agent/chat`
- The frontend is a React single-page dashboard with coordinated components for filters, charts, map views, and chat
- PostgreSQL stores AQHI records used by both the visual dashboard and the AI assistant
- Data can be loaded from static CSV files or refreshed from the Environment and Climate Change Canada GeoMet API

## Data Sources and AQHI Categories

This project works with two AQHI data sources:

1. Static CSV seed files in `backend/data/`
2. Live AQHI data retrieved by the backend refresh service from the ECCC GeoMet API

AQHI categories used throughout the application follow the standard public scale:

- `Low`: `<= 3`
- `Moderate`: `4-6`
- `High`: `7-10`
- `Very High`: `> 10`

The dashboard supports both forecast and observation records and allows users to compare them through the same filter model.

## AQHI Application Scope

The dashboard is designed around a small set of AQHI-specific workflows that stay consistent across the backend and frontend.

### Filter model

- Time range selection
- Location selection
- Dataset type selection

### Functional scope

- Visualize AQHI trends over time
- Compare forecast and observation datasets
- Summarize AQHI values through KPI cards
- Show AQHI category distribution
- Show hourly AQHI averages
- Show the latest AQHI station points on a Canada map
- Filter results by time and location
- Allow natural-language AQHI questions through the assistant
- Support manual and scheduled live data refresh

### Backend scope

- FastAPI application with GraphQL and REST endpoints
- PostgreSQL-backed AQHI table
- One-time CSV loading through `load_data.py`
- Scheduled live AQHI refresh
- AQHI assistant endpoint at `/agent/chat`

### Frontend scope

- Responsive dashboard layout
- Color-blind-aware visual palette
- Map popup details and station legend
- Searchable AQHI table
- Mobile-friendly table behavior with fewer columns on small screens
- Coordinated charts and compact summary cards

## Technology Stack

### Backend

- FastAPI
- Strawberry GraphQL
- SQLAlchemy
- PostgreSQL
- Pandas
- APScheduler
- Requests
- LangChain with Groq for the AQHI assistant

### Frontend

- React
- Vite
- Apollo Client
- Recharts
- MapLibre GL via `react-map-gl`
- React Select

## Architecture

### Backend architecture

`backend/main.py` is the FastAPI entry point. It loads environment variables, registers the GraphQL, agent, and data routers, and starts the background refresh scheduler.

The backend exposes three main interface groups:

- `/graphql` for Strawberry GraphQL dashboard queries
- `/agent/chat` for natural-language AQHI questions
- `/data/refresh` and `/data/status` for live data refresh control and status

Two data paths feed the AQHI records used by the application:

1. Static CSV loading through `load_data.py`
2. Live AQHI refresh from the ECCC GeoMet API through `backend/app/services/live_data.py`

The core backend modules are:

- `backend/app/db/models.py`: SQLAlchemy model for the `aqhi_data` table
- `backend/app/db/session.py`: database engine and session setup
- `backend/app/graphql/schema.py`: GraphQL schema with AQHI queries for table, KPI, hourly, category, map, and location views
- `backend/app/services/aqhi_service.py`: filtering and aggregation logic shared by dashboard queries
- `backend/app/services/live_data.py`: live fetch, normalization, and database refresh logic
- `backend/app/agent/agent.py`: LangChain SQL agent setup using Groq
- `backend/app/agent/router.py`: AQHI chat endpoint and response-handling logic
- `backend/app/routers/data.py`: refresh-related REST routes

### Frontend architecture

The frontend is a single-page React dashboard. `frontend/src/main.jsx` initializes Apollo Client and renders the app, while `frontend/src/App.jsx` mounts the dashboard route.

`frontend/src/pages/Dashboard.jsx` owns the shared filter state for:

- time range
- location
- dataset type

That shared state drives the dashboard charts, KPI cards, table, map, and AQHI chat panel so the interface stays synchronized.

The main frontend modules are:

- `frontend/src/graphql/queries.js`: GraphQL query definitions
- `frontend/src/config.js`: frontend environment and endpoint configuration
- `frontend/src/components/Filters.jsx`: filter controls and location selection
- `frontend/src/components/KPI.jsx`: summary metrics
- `frontend/src/components/LineChart.jsx`: AQHI trend view
- `frontend/src/components/HourlyChart.jsx`: hourly average visualization
- `frontend/src/components/DonutChart.jsx`: category distribution view
- `frontend/src/components/MapView.jsx`: MapLibre station map
- `frontend/src/components/DataTable.jsx`: searchable AQHI records
- `frontend/src/components/ChatPanel.jsx`: AQHI assistant interface

## Data Flow

The project supports both static and live AQHI workflows.

- `load_data.py` loads forecast and observation CSV files into the database for initial development and testing
- the live refresh service fetches current AQHI records from the ECCC GeoMet API and updates the database for runtime use
- the dashboard and AI assistant both query the same AQHI data layer, which keeps visual analysis and conversational responses grounded in the same records

## Project Structure

### Backend

- `backend/main.py`: FastAPI entry point
- `backend/load_data.py`: one-time CSV seed loader
- `backend/app/db/models.py`: AQHI database model
- `backend/app/db/session.py`: database connection and session setup
- `backend/app/graphql/schema.py`: GraphQL schema for dashboard queries
- `backend/app/services/aqhi_service.py`: AQHI filtering and aggregation logic
- `backend/app/services/live_data.py`: live AQHI refresh workflow from ECCC
- `backend/app/agent/agent.py`: LangChain SQL agent setup
- `backend/app/agent/router.py`: AQHI chat endpoint

### Frontend

- `frontend/src/pages/Dashboard.jsx`: main dashboard page
- `frontend/src/graphql/queries.js`: GraphQL queries used by the interface
- `frontend/src/config.js`: frontend environment configuration
- `frontend/src/components/Filters.jsx`: shared filter controls
- `frontend/src/components/KPI.jsx`: summary cards
- `frontend/src/components/LineChart.jsx`: AQHI trend chart
- `frontend/src/components/HourlyChart.jsx`: hourly AQHI view
- `frontend/src/components/DonutChart.jsx`: AQHI category distribution
- `frontend/src/components/MapView.jsx`: AQHI station map
- `frontend/src/components/DataTable.jsx`: searchable AQHI table
- `frontend/src/components/ChatPanel.jsx`: AQHI assistant interface

## Recommended Entry Points

- Dashboard page: `frontend/src/pages/Dashboard.jsx`
- Backend application: `backend/main.py`
- GraphQL schema: `backend/app/graphql/schema.py`
- Live refresh service: `backend/app/services/live_data.py`
- Agent route: `backend/app/agent/router.py`

## Local Setup

### 1. Create the database

```sql
CREATE DATABASE aqhi_db;
```

### 2. Configure the backend

Create `backend/.env` from `backend/.env.example` and set the required values.

```env
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aqhi_db
GROQ_API_KEY=your_groq_api_key
ALLOWED_ORIGIN=http://localhost:5173
```

`GROQ_API_KEY` is required for the AQHI assistant. `ALLOWED_ORIGIN` controls the frontend origin allowed by CORS.

### 3. Configure the frontend

Create `frontend/.env` from `frontend/.env.example`.

```env
VITE_API_URL=http://localhost:8000/graphql
VITE_BASE_URL=http://localhost:8000
VITE_AGENT_URL=http://localhost:8000/agent/chat
VITE_MAP_STYLE_URL=https://basemaps.cartocdn.com/gl/positron-gl-style/style.json
VITE_DASHBOARD_ALL_DATA_YEAR=2026
VITE_DEFAULT_TIME_RANGE=24h
VITE_DEFAULT_DATASET_TYPE=Forecast
```

`VITE_BASE_URL` is used for REST refresh requests, and `VITE_AGENT_URL` points to the AQHI assistant endpoint.

### 4. Start the backend

From `backend/`:

```powershell
pip install -r requirements.txt
python load_data.py
uvicorn main:app --reload
```

The backend runs at `http://localhost:8000`. The GraphQL playground is available at `http://localhost:8000/graphql`.

### 5. Start the frontend

From `frontend/`:

```powershell
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`.

## Running the Application

After completing the local setup, open `http://localhost:5173`. Users can then filter AQHI records by time range, dataset type, and location, compare dashboard views, inspect the map, and ask AQHI questions through the assistant.

## Useful Backend Endpoints

- `/graphql`: dashboard analytics queries
- `/agent/chat`: natural-language AQHI questions
- `/data/refresh`: manual live data refresh
- `/data/status`: refresh status check

## Docker and Cybera Deployment

This repository includes a Docker-based deployment path that can run on a single Cybera VM with Docker Compose.

### Included deployment files

- `docker-compose.yml`
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `frontend/nginx.conf`
- `.env.docker.example`
- `.env.cybera.example`

### Cybera deployment steps

#### 1. Prepare an Ubuntu VM

Use a Rapid Access Cloud VM and install Docker:

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```

#### 2. Clone the project on the VM

```bash
git clone https://github.com/sushmitabajgain/Weather_dashboard.git
cd weather-dashboard
```

#### 3. Create the deployment environment file

```bash
cp .env.docker.example .env
```

Update `.env` with values such as:

- `DB_PASSWORD`
- `GROQ_API_KEY`
- `ALLOWED_ORIGIN`
- `VITE_AGENT_URL` if needed for a non-default deployment path

If the application is served from a public IP, set `ALLOWED_ORIGIN` to the full origin, for example:

```env
ALLOWED_ORIGIN=http://203.0.113.10
```

#### 4. Start the Docker stack

```bash
docker compose up -d --build
```

#### 5. Seed the database if needed

```bash
docker compose exec backend python load_data.py
```

#### 6. Open the deployed app

Visit:

```text
http://<your-server-ip>
```

### Useful Docker commands

```bash
docker compose logs -f
docker compose up -d --build
docker compose down
docker compose down -v
```

## Notes

- The dashboard uses a color-blind-aware palette to improve readability across charts and category views
- The map uses MapLibre GL, so no Mapbox token is required for the included base tile setup
- The backend supports both seeded CSV loading and live AQHI refresh
- The AQHI assistant is designed to answer in plain language and avoid exposing raw SQL in user-facing responses

## Additional Documentation

Agent-related project documentation is available in [AGENTS.md](AGENTS.md).
