# AQHI Project Notes

## Project Summary

This project is an AQHI dashboard for Canadian air quality analysis. It combines a FastAPI backend, GraphQL API, PostgreSQL storage, live AQHI refresh support, and a React frontend with charts, a map, and a natural-language AQHI assistant.

## Data Scope

The app currently works with:

- seeded AQHI forecast data
- seeded AQHI observation data
- live AQHI refresh data from the ECCC GeoMet API

The dashboard filter model supports:

- time range
- location selection
- dataset type

## AQHI Rules Used In The App

- `Low`: AQHI `<= 3`
- `Moderate`: AQHI `4-6`
- `High`: AQHI `7-10`
- `Very High`: AQHI `> 10`

## Functional Requirements Reflected In The App

- visualize AQHI trends over time
- compare forecast and observation datasets
- summarize AQHI values through KPIs
- show AQHI category distribution
- show hourly AQHI averages
- show latest AQHI station points on a Canada map
- filter results by time and location
- allow natural-language AQHI questions through the agent
- support manual and scheduled live data refresh

## Backend Requirements Reflected In The Code

- FastAPI app with GraphQL and REST endpoints
- PostgreSQL-backed AQHI table
- one-time CSV loading through `load_data.py`
- scheduled live AQHI refresh
- AQHI assistant endpoint at `/agent/chat`

## Frontend Requirements Reflected In The Code

- responsive dashboard layout
- color-blind-aware visual palette
- map popup details and station legend
- searchable data table
- mobile-friendly table behavior with fewer columns on small screens
- chart labels and compact header cards

## Deployment Notes

This repo includes a Docker-based deployment path for Cybera:

- `docker-compose.yml`
- Dockerfiles for frontend and backend
- nginx frontend proxy config
- `.env.cybera.example`
- `.env.docker.example`
- `DEPLOY_CYBERA_DOCKER.md`

## Recommended Entry Points

- dashboard: `frontend/src/pages/Dashboard.jsx`
- backend app: `backend/main.py`
- GraphQL schema: `backend/app/graphql/schema.py`
- live refresh: `backend/app/services/live_data.py`
- agent route: `backend/app/agent/router.py`
