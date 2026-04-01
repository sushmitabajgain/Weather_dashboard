function readEnv(name, fallback) {
  const value = import.meta.env[name];
  return value === undefined || value === "" ? fallback : value;
}

function readNumberEnv(name, fallback) {
  const value = Number(readEnv(name, fallback));
  return Number.isFinite(value) ? value : fallback;
}

export const API_URL = readEnv("VITE_API_URL", "/graphql");
export const BASE_URL = readEnv("VITE_BASE_URL", "");
export const AGENT_URL = readEnv("VITE_AGENT_URL", "/agent/chat");
export const MAP_STYLE_URL = readEnv(
  "VITE_MAP_STYLE_URL",
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
);
export const DASHBOARD_ALL_DATA_YEAR = readNumberEnv("VITE_DASHBOARD_ALL_DATA_YEAR", 2026);
export const DEFAULT_TIME_RANGE = readEnv("VITE_DEFAULT_TIME_RANGE", "24h");
export const DEFAULT_DATASET_TYPE = readEnv("VITE_DEFAULT_DATASET_TYPE", "Forecast");
