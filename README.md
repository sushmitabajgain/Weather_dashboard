# AQHI Visualization Dashboard

A full-stack web-based visualization system for analyzing Air Quality Health Index (AQHI) data across Canada. The system enables interactive exploration of temporal, spatial, and categorical air quality patterns.

---

## Features

- Interactive AQHI trend analysis
- Category distribution visualization
- Hourly variation analysis
- Geospatial AQHI mapping
- Dynamic filtering (location, year, dataset type)
- Client-server architecture with GraphQL APIs

---

## Tech Stack

### Backend
- Python (FastAPI)
- GraphQL (Strawberry)
- PostgreSQL
- Pandas
- SQLAlchemy

### Frontend
- React.js
- Recharts
- Mapbox

---

## System Requirements

Ensure the following versions are installed:

| Tool        | Version (Recommended) |
|------------|----------------------|
| Python     | 3.10+                |
| pip        | 22+                  |
| Node.js    | 18+                  |
| npm        | 9+                   |
| PostgreSQL | 14+                  |

---

## Setup Instructions

### 1. Database Setup

Install PostgreSQL and create a database:

```sql
CREATE DATABASE aqhi_db;
```

### 2. Backend Setup
```
cd backend
pip install -r requirements.txt
```

Load dataset into database:

```
python load-data.py
```

Run backend server:

```
uvicorn main:app --reload
```

### 3. Frontend Setup

For frontend server:
```
cd frontend
npm install
npm run dev
```

### 4. Environment Configuration

Create a *.env* file inside the **backend/** directory:

Update these with your database user name, password and so on:

Example for development server:
```
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aqhi_db
```

## Running the Application
1. Start the backend server

2. Start the frontend server

3. Open your browser at:
```
http://localhost:5173
```

## Usage

- Select location and year filters
- Switch between forecast and observation datasets
- Explore visualizations:
    - Trend charts
    - Distribution charts
    - Hourly patterns
    - Map-based AQHI visualization

## Notes & Limitations
- The current dataset includes AQHI data for the year 2026 only, limiting the ability to analyze long-term trends, seasonal variations across multiple years, and historical comparisons.
- Requires Mapbox API key for geospatial visualization  
- Uses static datasets (no real-time data streaming)  
 
