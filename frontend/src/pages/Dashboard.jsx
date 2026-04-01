import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@apollo/client";

import {
  GET_AQHI,
  GET_CATEGORY,
  GET_HOURLY,
  GET_KPIS,
  GET_MAP,
} from "../graphql/queries";

import ChatPanel from "../components/ChatPanel";
import DataTable from "../components/DataTable";
import DonutChart from "../components/DonutChart";
import Filters from "../components/Filters";
import HourlyChart from "../components/HourlyChart";
import KPI from "../components/KPI";
import LineChart from "../components/LineChart";
import MapView from "../components/MapView";
import {
  BASE_URL,
  DASHBOARD_ALL_DATA_YEAR,
  DEFAULT_DATASET_TYPE,
  DEFAULT_TIME_RANGE,
} from "../config";

const RESPONSIVE_STYLE_ID = "dashboard-responsive-styles";

const RESPONSIVE_CSS = `
  @keyframes dash-spin {
    to {
      transform: rotate(360deg);
    }
  }

  .dash-page {
    min-height: 100vh;
  }

  .dash-header-content,
  .dash-header-stats,
  .dash-tabs,
  .dash-kpi-row,
  .dash-row,
  .dash-hero-grid {
    display: flex;
    flex-wrap: wrap;
  }

  .dash-card,
  .dash-panel,
  .dash-tab,
  .dash-refresh-btn,
  .dash-stat-box {
    transition: transform 0.24s ease, box-shadow 0.24s ease, background 0.24s ease;
  }

  .dash-card:hover,
  .dash-panel:hover {
    transform: translateY(-3px);
    box-shadow: 0 18px 38px rgba(15, 23, 42, 0.1);
  }

  .dash-tab:hover {
    transform: translateY(-1px);
  }

  .dash-refresh-btn:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .dash-spinner {
    display: inline-block;
  }

  .dash-spinner.is-spinning {
    animation: dash-spin 1s linear infinite;
  }

  @media (max-width: 1160px) {
    .dash-panel {
      flex: 1 1 100% !important;
      min-width: 100% !important;
    }
  }

  @media (max-width: 820px) {
    .dash-header-content {
      flex-direction: column;
      align-items: flex-start !important;
      justify-content: flex-start !important;
    }

    .dash-header-stats {
      width: 100%;
      display: grid !important;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .dash-kpi-wrap {
      flex: 1 1 calc(50% - 8px) !important;
      min-width: 170px !important;
    }
  }

  @media (max-width: 640px) {
    .dash-header {
      padding: 8px 10px 8px !important;
    }

    .dash-header-content {
      display: grid !important;
      grid-template-columns: 1fr !important;
      align-items: start !important;
      justify-content: start !important;
      gap: 10px !important;
    }

    .dash-title-block {
      width: 100% !important;
      flex: none !important;
      max-width: none !important;
    }

    .dash-container {
      padding: 0 10px 24px !important;
    }

    .dash-title {
      font-size: 1.25rem !important;
    }

    .dash-card,
    .dash-panel {
      padding: 14px !important;
      border-radius: 18px !important;
    }

    .dash-tab,
    .dash-kpi-wrap {
      flex: 1 1 100% !important;
    }

    .dash-header-stats {
      width: 100% !important;
      gap: 8px !important;
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }

    .dash-refresh-wrap {
      grid-column: 1 / -1 !important;
      width: 100% !important;
    }

    .dash-refresh-btn {
      width: 100% !important;
      justify-content: center !important;
    }

    .dash-hero-grid {
      display: grid !important;
      grid-template-columns: 1fr !important;
      align-items: stretch !important;
      gap: 10px !important;
    }

    .dash-hero-copy {
      max-width: none !important;
    }

    .dash-filter-container {
      width: 100% !important;
    }

    .dash-tabs {
      gap: 8px !important;
    }

    .dash-row,
    .dash-kpi-row {
      display: grid !important;
      grid-template-columns: 1fr !important;
      gap: 10px !important;
    }

    .dash-kpi-wrap {
      min-width: 0 !important;
    }
  }

  @media (max-width: 480px) {
    .dash-container {
      padding: 0 8px 20px !important;
    }

    .dash-header-content {
      padding: 10px !important;
      border-radius: 18px !important;
      gap: 8px !important;
    }

    .dash-title {
      font-size: 1.15rem !important;
    }

    .dash-panel {
      padding: 12px !important;
    }

    .dash-card {
      padding: 12px !important;
    }

    .dash-hero-card {
      padding: 10px !important;
    }

    .dash-subtitle,
    .dash-eyebrow {
      display: none !important;
    }

    .dash-header-stats {
      gap: 8px !important;
      grid-template-columns: 1fr 1fr !important;
    }

    .dash-stat-box {
      padding: 7px 9px !important;
      min-width: 0 !important;
    }

    .dash-refresh-btn {
      padding: 8px 10px !important;
      font-size: 11px !important;
    }

    .dash-section-title {
      font-size: 16px !important;
    }

    .dash-section-body {
      font-size: 13px !important;
      line-height: 1.5 !important;
    }
  }
`;

const TIME_PRESETS = {
  "24h": { lastHours: 24, year: null },
  "48h": { lastHours: 48, year: null },
  "7d": { lastHours: 168, year: null },
  year: { lastHours: null, year: DASHBOARD_ALL_DATA_YEAR },
};

const KPI_COLORS = ["#0072b2", "#009e73", "#e69f00", "#cc79a7"];

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState(DEFAULT_TIME_RANGE);
  const [locations, setLocations] = useState([]);
  const [datasetType, setDatasetType] = useState(DEFAULT_DATASET_TYPE);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    let styleTag = document.getElementById(RESPONSIVE_STYLE_ID);
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = RESPONSIVE_STYLE_ID;
      styleTag.textContent = RESPONSIVE_CSS;
      document.head.appendChild(styleTag);
    }

    return () => {
      styleTag?.remove();
    };
  }, []);

  const { lastHours, year } = TIME_PRESETS[timeRange] || TIME_PRESETS["24h"];

  const variables = {
    year,
    lastHours,
    locations: locations.length ? locations.map((location) => location.value) : [],
    datasetType,
    limit: 500,
    offset: 0,
  };

  const { data, loading, error, refetch: refetchAqhi } = useQuery(GET_AQHI, { variables });
  const { data: kpiData, refetch: refetchKpis } = useQuery(GET_KPIS, { variables });
  const { data: hourlyData, refetch: refetchHourly } = useQuery(GET_HOURLY, { variables });
  const { data: categoryData, refetch: refetchCategory } = useQuery(GET_CATEGORY, { variables });
  const { data: mapData, refetch: refetchMap } = useQuery(GET_MAP, { variables });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`${BASE_URL}/data/refresh`, {
        method: "POST",
      });
      const payload = await response.json();
      if (payload.last_refresh) {
        setLastUpdated(new Date(payload.last_refresh));
      }
      await Promise.all([
        refetchAqhi(),
        refetchKpis(),
        refetchHourly(),
        refetchCategory(),
        refetchMap(),
      ]);
    } catch (refreshError) {
      console.error("Refresh failed:", refreshError);
    } finally {
      setRefreshing(false);
    }
  }, [refetchAqhi, refetchCategory, refetchHourly, refetchKpis, refetchMap]);

  if (loading) {
    return <p style={{ padding: 20 }}>Loading...</p>;
  }

  if (error) {
    return <p style={{ padding: 20 }}>Error: {error.message}</p>;
  }

  const aqhi = data?.aqhiData || [];
  const kpis = kpiData?.kpis || {};
  const hourly = hourlyData?.hourlyAvg || [];
  const category = categoryData?.categoryDistribution || [];
  const mapPoints = mapData?.mapPoints || [];
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const latestRecordTime = aqhi.reduce((latest, item) => {
    if (!item?.datetime) return latest;
    const parsed = new Date(item.datetime);
    if (Number.isNaN(parsed.getTime())) return latest;
    return !latest || parsed > latest ? parsed : latest;
  }, null);
  const loadedAt = latestRecordTime || lastUpdated;
  const loadedAtLabel = loadedAt
    ? loadedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "Unavailable";

  const heroStats = [
    { value: todayLabel, label: "Today" },
    { value: loadedAtLabel, label: "Data Loaded" },
    {
      value: datasetType,
      label: "Dataset",
    },
    { value: `${locations.length || "All"}`, label: "Locations" },
  ];

  return (
    <div className="dash-page" style={styles.page}>
      <header className="dash-header" style={styles.header}>
        <div className="dash-header-content" style={styles.headerContent}>
          <div className="dash-title-block" style={styles.titleBlock}>
            <div className="dash-eyebrow" style={styles.eyebrow}>Canadian Air Quality Health Index</div>
            <h1 className="dash-title" style={styles.title}>
              AQHI Dashboard
            </h1>
            <p className="dash-subtitle" style={styles.subtitle}>
              Compare current conditions, trends, and station context across Canada.
            </p>
          </div>

          <div className="dash-header-stats" style={styles.headerStats}>
            <div style={styles.refreshWrap}>
              <button
                className="dash-refresh-btn"
                disabled={refreshing}
                onClick={handleRefresh}
                style={{
                  ...styles.refreshBtn,
                  opacity: refreshing ? 0.72 : 1,
                }}
              >
                <span className={`dash-spinner${refreshing ? " is-spinning" : ""}`}>o</span>
                {refreshing ? " Refreshing..." : " Refresh Live Data"}
              </button>
            </div>

            {heroStats.map((item) => (
              <div key={item.label} className="dash-stat-box" style={styles.statBox}>
                <div style={styles.statValue}>{item.value}</div>
                <div style={styles.statLabel}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="dash-container" style={styles.container}>
        <section className="dash-card dash-hero-card" style={styles.heroCard}>
          <div className="dash-hero-grid" style={styles.heroGrid}>
            <div className="dash-hero-copy" style={styles.heroCopy}>
              <h2 className="dash-section-title" style={styles.sectionTitle}>Explore the current selection</h2>
              <p className="dash-section-body" style={styles.sectionBody}>
                Filters, dataset mode, and charts all stay synchronized so the
                dashboard tells one consistent story.
              </p>
            </div>
            <div className="dash-filter-container">
              <Filters
                locations={locations}
                setLocations={setLocations}
                setTimeRange={setTimeRange}
                timeRange={timeRange}
              />
            </div>
          </div>
        </section>

        <div className="dash-tabs" style={styles.tabs}>
          {["Forecast", "Observation"].map((tab) => {
            const active = datasetType === tab;
            return (
              <button
                key={tab}
                className="dash-tab"
                onClick={() => setDatasetType(tab)}
                style={{
                  ...styles.tab,
                  ...(active ? styles.tabActive : null),
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <div className="dash-kpi-row" style={styles.kpiRow}>
          {[
            { title: "Total Records", value: kpis.total || 0 },
            { title: "Average AQHI", value: kpis.avg || 0 },
            { title: "Maximum AQHI", value: kpis.max || 0 },
            { title: "Locations", value: kpis.locations || 0 },
          ].map((item, index) => (
            <div key={item.title} className="dash-kpi-wrap" style={styles.kpiWrap}>
              <KPI title={item.title} value={item.value} color={KPI_COLORS[index]} />
            </div>
          ))}
        </div>

        <div className="dash-row" style={styles.row}>
          <section className="dash-panel" style={styles.panel}>
            <LineChart data={aqhi} />
          </section>
          <section className="dash-panel" style={styles.panel}>
            <DonutChart data={category} />
          </section>
        </div>

        <div className="dash-row" style={styles.row}>
          <section className="dash-panel" style={styles.panel}>
            <HourlyChart data={hourly} />
          </section>
          <section className="dash-panel" style={styles.panel}>
            <MapView data={mapPoints} />
          </section>
        </div>

        <section className="dash-card" style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Data Preview</h2>
              <p style={styles.sectionBody}>
                Search, skim risk level, and verify timestamps for the current
                dashboard slice.
              </p>
            </div>
          </div>
          <DataTable data={aqhi} />
        </section>
      </main>

      <ChatPanel />
    </div>
  );
}

const styles = {
  page: {
    background:
      "radial-gradient(circle at top left, rgba(186, 230, 253, 0.8), transparent 30%), radial-gradient(circle at top right, rgba(167, 243, 208, 0.55), transparent 26%), linear-gradient(180deg, #f8fbff 0%, #eef6ff 44%, #f5fbf8 100%)",
    color: "#0f172a",
    fontFamily: "\"Segoe UI\", sans-serif",
  },
  header: {
    padding: "12px 14px 10px",
  },
  headerContent: {
    maxWidth: "1400px",
    width: "100%",
    boxSizing: "border-box",
    margin: "0 auto",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    background: "rgba(255, 255, 255, 0.8)",
    border: "1px solid rgba(148, 163, 184, 0.22)",
    borderRadius: 24,
    padding: 18,
    boxShadow: "0 12px 24px rgba(15, 23, 42, 0.08)",
    backdropFilter: "blur(12px)",
  },
  titleBlock: {
    flex: "1 1 420px",
  },
  eyebrow: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.18em",
    color: "#0369a1",
    marginBottom: 6,
    fontWeight: 700,
  },
  title: {
    margin: 0,
    fontSize: "1.6rem",
    lineHeight: 1.02,
    maxWidth: "12ch",
  },
  subtitle: {
    marginTop: 6,
    maxWidth: "52ch",
    fontSize: 13,
    lineHeight: 1.45,
    color: "#475569",
  },
  headerStats: {
    gap: 8,
    alignItems: "stretch",
    justifyContent: "flex-end",
    flex: "1 1 460px",
  },
  refreshWrap: {
    display: "flex",
    alignItems: "stretch",
  },
  refreshBtn: {
    background: "linear-gradient(135deg, #0072b2, #009e73)",
    border: "none",
    borderRadius: 14,
    color: "#ffffff",
    padding: "9px 12px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    gap: 8,
    boxShadow: "0 10px 20px rgba(0, 114, 178, 0.18)",
  },
  statBox: {
    minWidth: 96,
    padding: "8px 10px",
    borderRadius: 12,
    background: "rgba(239, 246, 255, 0.85)",
    border: "1px solid rgba(147, 197, 253, 0.3)",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
    flex: "1 1 96px",
  },
  statValue: {
    fontSize: 12,
    fontWeight: 700,
    color: "#0f172a",
    lineHeight: 1.35,
  },
  statLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#64748b",
    marginTop: 2,
  },
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "0 14px 32px",
  },
  heroCard: {
    background: "rgba(255, 255, 255, 0.82)",
    borderRadius: 24,
    padding: 18,
    border: "1px solid rgba(148, 163, 184, 0.2)",
    boxShadow: "0 16px 38px rgba(15, 23, 42, 0.08)",
    backdropFilter: "blur(12px)",
    marginBottom: 18,
  },
  heroGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
    gap: 18,
    alignItems: "stretch",
  },
  heroCopy: {
    flex: "1 1 320px",
    maxWidth: 440,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    color: "#0f172a",
  },
  sectionBody: {
    marginTop: 8,
    color: "#475569",
    fontSize: 14,
    lineHeight: 1.65,
  },
  tabs: {
    gap: 10,
    marginBottom: 18,
  },
  tab: {
    padding: "10px 18px",
    borderRadius: 999,
    border: "1px solid rgba(148, 163, 184, 0.28)",
    cursor: "pointer",
    fontWeight: 700,
    background: "rgba(255, 255, 255, 0.78)",
    color: "#334155",
    boxShadow: "0 8px 18px rgba(15, 23, 42, 0.04)",
  },
  tabActive: {
    background: "linear-gradient(135deg, #0072b2, #009e73)",
    color: "#ffffff",
    borderColor: "transparent",
    boxShadow: "0 10px 20px rgba(0, 114, 178, 0.16)",
  },
  kpiRow: {
    gap: 16,
    marginBottom: 18,
  },
  kpiWrap: {
    flex: "1 1 220px",
  },
  row: {
    gap: 18,
    marginBottom: 18,
  },
  panel: {
    flex: "1 1 420px",
    minWidth: 280,
    background: "rgba(255, 255, 255, 0.84)",
    borderRadius: 24,
    padding: 18,
    border: "1px solid rgba(148, 163, 184, 0.2)",
    boxShadow: "0 16px 36px rgba(15, 23, 42, 0.08)",
    backdropFilter: "blur(12px)",
  },
  tableCard: {
    background: "rgba(255, 255, 255, 0.84)",
    borderRadius: 24,
    padding: 20,
    border: "1px solid rgba(148, 163, 184, 0.2)",
    boxShadow: "0 16px 36px rgba(15, 23, 42, 0.08)",
    backdropFilter: "blur(12px)",
  },
  tableHeader: {
    marginBottom: 12,
  },
};
