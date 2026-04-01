import logging
from datetime import datetime, timedelta, timezone

import pandas as pd
import requests
import urllib3
from sqlalchemy import text

from app.core.config import (
    ECCC_BASE_URL,
    LIVE_REFRESH_LOOKAHEAD_HOURS,
    LIVE_REFRESH_LOOKBACK_HOURS,
    LIVE_REFRESH_PAGE_SIZE,
    LIVE_REFRESH_TIMEOUT_SECONDS,
    LIVE_REFRESH_VERIFY_SSL,
)
from app.db.session import SessionLocal, engine

logger = logging.getLogger(__name__)

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

ENDPOINTS = {
    "Observation": f"{ECCC_BASE_URL}/aqhi-observations-realtime/items",
    "Forecast": f"{ECCC_BASE_URL}/aqhi-forecasts-realtime/items",
}

TIME_FIELD = {
    "Observation": "observation_datetime",
    "Forecast": "forecast_datetime",
}

_last_refresh: datetime | None = None
_last_refresh_attempt: datetime | None = None
_last_refresh_error: str | None = None


def classify_aqhi(value) -> str:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return "Unknown"
    if value <= 3:
        return "Low"
    if value <= 6:
        return "Moderate"
    if value <= 10:
        return "High"
    return "Very High"


def fetch_dataset(dataset_type: str, page_size: int = LIVE_REFRESH_PAGE_SIZE) -> pd.DataFrame:
    """Fetch AQHI data from the ECCC GeoMet OGC API with pagination."""
    url = ENDPOINTS[dataset_type]
    time_field = TIME_FIELD[dataset_type]

    now = datetime.now(timezone.utc)
    start = (now - timedelta(hours=LIVE_REFRESH_LOOKBACK_HOURS)).strftime("%Y-%m-%dT%H:%M:%SZ")
    end = (now + timedelta(hours=LIVE_REFRESH_LOOKAHEAD_HOURS)).strftime("%Y-%m-%dT%H:%M:%SZ")

    all_features: list = []
    offset = 0

    while True:
        response = requests.get(
            url,
            params={
                "f": "json",
                "limit": page_size,
                "offset": offset,
                "datetime": f"{start}/{end}",
            },
            timeout=LIVE_REFRESH_TIMEOUT_SECONDS,
            verify=LIVE_REFRESH_VERIFY_SSL,
        )
        response.raise_for_status()

        body = response.json()
        features = body.get("features", [])
        all_features.extend(features)

        number_matched = body.get("numberMatched", 0)
        offset += page_size

        if offset >= number_matched or not features:
            break

    rows = []
    for feature in all_features:
        props = feature.get("properties", {})
        coords = feature.get("geometry", {}).get("coordinates", [])

        aqhi_value = props.get("aqhi")
        try:
            aqhi_value = float(aqhi_value) if aqhi_value is not None else None
        except (TypeError, ValueError):
            aqhi_value = None

        rows.append(
            {
                "location_name": props.get("location_name_en"),
                "longitude": coords[0] if len(coords) > 0 else None,
                "latitude": coords[1] if len(coords) > 1 else None,
                "aqhi": aqhi_value,
                "category": classify_aqhi(aqhi_value),
                "datetime": props.get(time_field),
                "dataset_type": dataset_type,
            }
        )

    dataframe = pd.DataFrame(rows) if rows else pd.DataFrame(
        columns=["location_name", "longitude", "latitude", "aqhi", "category", "datetime", "dataset_type"]
    )

    if not dataframe.empty:
        dataframe["datetime"] = pd.to_datetime(dataframe["datetime"], errors="coerce", utc=True)
        dataframe["datetime"] = dataframe["datetime"].dt.tz_convert(None)
        dataframe = dataframe.dropna(subset=["aqhi", "datetime"])

    return dataframe


def refresh_live_data() -> dict:
    """Fetch fresh data from the ECCC API and reload the aqhi_data table."""
    global _last_refresh
    global _last_refresh_attempt
    global _last_refresh_error

    _last_refresh_attempt = datetime.now(timezone.utc)

    counts: dict[str, int] = {}
    frames = []

    for dataset_type in ["Observation", "Forecast"]:
        dataframe = fetch_dataset(dataset_type)
        counts[dataset_type] = len(dataframe)
        frames.append(dataframe)

    combined = pd.concat(frames, ignore_index=True)

    if combined.empty:
        raise ValueError("No data returned from the ECCC API.")

    db = SessionLocal()
    try:
        db.execute(text("TRUNCATE TABLE aqhi_data RESTART IDENTITY"))
        db.commit()
    finally:
        db.close()

    combined.to_sql(
        "aqhi_data",
        engine,
        if_exists="append",
        index=False,
        method="multi",
        chunksize=500,
    )

    _last_refresh = datetime.now(timezone.utc)
    _last_refresh_error = None

    return {
        "success": True,
        "observations": counts["Observation"],
        "forecasts": counts["Forecast"],
        "total": len(combined),
        "last_refresh": _last_refresh.isoformat(),
        "last_attempt": _last_refresh_attempt.isoformat(),
        "last_error": None,
    }


def safe_refresh_live_data() -> dict:
    """Refresh live data without letting scheduler/startup failures crash the app."""
    try:
        return refresh_live_data()
    except Exception as exc:
        global _last_refresh_error
        _last_refresh_error = str(exc)
        logger.warning("Live AQHI refresh failed: %s", exc)
        return {
            "success": False,
            "error": _last_refresh_error,
            "last_refresh": get_last_refresh(),
            "last_attempt": get_last_refresh_attempt(),
            "last_error": _last_refresh_error,
        }


def get_last_refresh() -> str | None:
    return _last_refresh.isoformat() if _last_refresh else None


def get_last_refresh_attempt() -> str | None:
    return _last_refresh_attempt.isoformat() if _last_refresh_attempt else None


def get_last_refresh_error() -> str | None:
    return _last_refresh_error


def get_refresh_status() -> dict:
    return {
        "last_refresh": get_last_refresh(),
        "last_attempt": get_last_refresh_attempt(),
        "last_error": get_last_refresh_error(),
    }
