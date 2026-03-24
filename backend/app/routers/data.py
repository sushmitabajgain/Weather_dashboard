import asyncio
from fastapi import APIRouter, HTTPException
from app.services.live_data import refresh_live_data, get_last_refresh

router = APIRouter(prefix="/data", tags=["data"])


@router.post("/refresh")
async def refresh_data():
    """Trigger a live data refresh from the ECCC GeoMet API."""
    try:
        loop   = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, refresh_live_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
def data_status():
    """Return the timestamp of the last successful data refresh."""
    return {"last_refresh": get_last_refresh()}
