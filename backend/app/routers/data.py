import asyncio

from fastapi import APIRouter

from app.services.live_data import get_refresh_status, safe_refresh_live_data

router = APIRouter(prefix="/data", tags=["data"])


@router.post("/refresh")
async def refresh_data():
    """Trigger a live data refresh from the ECCC GeoMet API."""
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, safe_refresh_live_data)


@router.get("/status")
def data_status():
    """Return the current refresh health and timestamps."""
    return get_refresh_status()
