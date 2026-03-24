import os
import threading
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from strawberry.fastapi import GraphQLRouter
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler

load_dotenv()

from app.graphql.schema import schema
from app.agent.router import router as agent_router
from app.routers.data import router as data_router
from app.services.live_data import refresh_live_data

scheduler = BackgroundScheduler(daemon=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(refresh_live_data, "interval", minutes=30, id="live_refresh")
    scheduler.start()
    threading.Thread(target=refresh_live_data, daemon=True).start()
    yield
    scheduler.shutdown(wait=False)


app = FastAPI(title="AQHI Backend API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("ALLOWED_ORIGIN", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

graphql_app = GraphQLRouter(schema)

app.include_router(graphql_app, prefix="/graphql")
app.include_router(agent_router)
app.include_router(data_router)


@app.get("/")
def root():
    return {"message": "AQHI Backend Running"}
