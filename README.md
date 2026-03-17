# Weather_dashboard

## Database
- Install postgres.
- Create database name **aqhi_db**


## Backend
- cd/backend
- Run :

```
pip install -r requirements.txt
```
- To add data on databse, run:

```
python load-data.py
```

To run the server run:

```
uvicorn main:app --reload
```

## Frontend

For development server:
- cd/frontend
- npm run  dev

## .ENV

Create .env file on **backend/.env**

Update these with your database user name, password and so on:

DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aqhi_db
