import requests
import urllib3
import pandas as pd
from datetime import datetime, timedelta, timezone
from sqlalchemy import text
from app.db.session import engine, SessionLocal

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

ECCC_BASE = "https://api.weather.gc.ca/collections"

ENDPOINTS = {
    "Observation": f"{ECCC_BASE}/aqhi-observations-realtime/items",
    "Forecast":    f"{ECCC_BASE}/aqhi-forecasts-realtime/items",
}

TIME_FIELD = {
    "Observation": "observation_datetime",
    "Forecast":    "forecast_datetime",
}

_last_refresh: datetime | None = None


def classify_aqhi(value) -> str:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return "Unknown"
    if value <= 3:  return "Low"
    if value <= 6:  return "Moderate"
    if value <= 10: return "High"
    return "Very High"


def fetch_dataset(dataset_type: str, page_size: int = 500) -> pd.DataFrame:
    """Fetch AQHI data from the ECCC GeoMet OGC API with pagination.

    Fetches a ±48-hour window around now so both current observations
    and upcoming forecasts are captured in a single pass.
    """
    url        = ENDPOINTS[dataset_type]
    time_field = TIME_FIELD[dataset_type]

    now   = datetime.now(timezone.utc)
    start = (now - timedelta(hours=48)).strftime("%Y-%m-%dT%H:%M:%SZ")
    end   = (now + timedelta(hours=48)).strftime("%Y-%m-%dT%H:%M:%SZ")

    all_features: list = []
    offset = 0

    while True:
        resp = requests.get(
            url,
            params={
                "f":        "json",
                "limit":    page_size,
                "offset":   offset,
                "datetime": f"{start}/{end}",
            },
            timeout=30,
            verify=False,
        )
        resp.raise_for_status()

        body     = resp.json()
        features = body.get("features", [])
        all_features.extend(features)

        number_matched = body.get("numberMatched", 0)
        offset += page_size

        if offset >= number_matched or not features:
            break

    rows = []
    for feat in all_features:
        props  = feat.get("properties", {})
        coords = feat.get("geometry", {}).get("coordinates", [])

        aqhi_val = props.get("aqhi")
        try:
            aqhi_val = float(aqhi_val) if aqhi_val is not None else None
        except (TypeError, ValueError):
            aqhi_val = None

        rows.append({
            "location_name": props.get("location_name_en"),
            "longitude":     coords[0] if len(coords) > 0 else None,
            "latitude":      coords[1] if len(coords) > 1 else None,
            "aqhi":          aqhi_val,
            "category":      classify_aqhi(aqhi_val),
            "datetime":      props.get(time_field),
            "dataset_type":  dataset_type,
        })

    df = pd.DataFrame(rows) if rows else pd.DataFrame(
        columns=["location_name", "longitude", "latitude", "aqhi", "category", "datetime", "dataset_type"]
    )

    if not df.empty:
        df["datetime"] = pd.to_datetime(df["datetime"], errors="coerce", utc=True)
        df["datetime"] = df["datetime"].dt.tz_convert(None)
        df = df.dropna(subset=["aqhi", "datetime"])

    return df


def refresh_live_data() -> dict:
    """Fetch fresh data from the ECCC API and reload the aqhi_data table."""
    global _last_refresh

    counts: dict[str, int] = {}
    all_dfs = []

    for dataset_type in ["Observation", "Forecast"]:
        df = fetch_dataset(dataset_type)
        counts[dataset_type] = len(df)
        all_dfs.append(df)

    combined = pd.concat(all_dfs, ignore_index=True)

    if combined.empty:
        return {"error": "No data returned from the ECCC API."}

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

    return {
        "observations": counts["Observation"],
        "forecasts":    counts["Forecast"],
        "total":        len(combined),
        "last_refresh": _last_refresh.isoformat(),
    }


def get_last_refresh() -> str | None:
    return _last_refresh.isoformat() if _last_refresh else None
