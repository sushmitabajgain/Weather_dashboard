import threading
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter

load_dotenv()

from app.agent.router import router as agent_router
from app.core.config import ALLOWED_ORIGIN, BACKEND_TITLE, LIVE_REFRESH_INTERVAL_MINUTES
from app.graphql.schema import schema
from app.routers.data import router as data_router
from app.services.live_data import safe_refresh_live_data

scheduler = BackgroundScheduler(daemon=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(
        safe_refresh_live_data,
        "interval",
        minutes=LIVE_REFRESH_INTERVAL_MINUTES,
        id="live_refresh",
    )
    scheduler.start()
    threading.Thread(target=safe_refresh_live_data, daemon=True).start()
    yield
    scheduler.shutdown(wait=False)


app = FastAPI(title=BACKEND_TITLE, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[ALLOWED_ORIGIN],
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
