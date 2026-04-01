import os

from dotenv import load_dotenv

load_dotenv()


def _get_int(name: str, default: int) -> int:
    value = os.getenv(name)
    if value is None:
        return default
    try:
        return int(value)
    except ValueError:
        return default


def _get_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "aqhi_db")
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}",
)

ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "http://localhost:5173")
BACKEND_TITLE = os.getenv("BACKEND_TITLE", "AQHI Backend API")

ECCC_BASE_URL = os.getenv(
    "ECCC_BASE_URL",
    "https://api.weather.gc.ca/collections",
).rstrip("/")
LIVE_REFRESH_INTERVAL_MINUTES = _get_int("LIVE_REFRESH_INTERVAL_MINUTES", 30)
LIVE_REFRESH_LOOKBACK_HOURS = _get_int("LIVE_REFRESH_LOOKBACK_HOURS", 48)
LIVE_REFRESH_LOOKAHEAD_HOURS = _get_int("LIVE_REFRESH_LOOKAHEAD_HOURS", 48)
LIVE_REFRESH_PAGE_SIZE = _get_int("LIVE_REFRESH_PAGE_SIZE", 500)
LIVE_REFRESH_TIMEOUT_SECONDS = _get_int("LIVE_REFRESH_TIMEOUT_SECONDS", 30)
LIVE_REFRESH_VERIFY_SSL = _get_bool("LIVE_REFRESH_VERIFY_SSL", False)

GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
AGENT_VERBOSE = _get_bool("AGENT_VERBOSE", False)
