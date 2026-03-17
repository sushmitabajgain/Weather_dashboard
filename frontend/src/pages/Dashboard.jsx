import { useState } from "react";
import { useQuery } from "@apollo/client";

import {
  GET_AQHI,
  GET_KPIS,
  GET_HOURLY,
  GET_CATEGORY,
  GET_MAP
} from "../graphql/queries";

import Filters from "../components/Filters";
import KPI from "../components/KPI";
import LineChart from "../components/LineChart";
import DonutChart from "../components/DonutChart";
import HourlyChart from "../components/HourlyChart";
import MapView from "../components/MapView";
import DataTable from "../components/DataTable";

export default function Dashboard() {
  const [year, setYear] = useState(2026);
  const [locations, setLocations] = useState([]);
  const [datasetType, setDatasetType] = useState("Forecast");

  const variables = {
    year,
    locations: locations.length ? locations.map(l => l.value) : [],
    datasetType,
    limit: 200,
    offset: 0
  };

  const { data, loading, error } = useQuery(GET_AQHI, { variables });
  const { data: kpiData } = useQuery(GET_KPIS, { variables });
  const { data: hourlyData } = useQuery(GET_HOURLY, { variables });
  const { data: categoryData } = useQuery(GET_CATEGORY, { variables });
  const { data: mapData } = useQuery(GET_MAP, { variables });

  if (loading) return <p style={{ padding: 20 }}>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const aqhi = data?.aqhiData || [];
  const kpis = kpiData?.kpis || {};
  const hourly = hourlyData?.hourlyAvg || [];
  const category = categoryData?.categoryDistribution || [];
  const mapPoints = mapData?.mapPoints || [];

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          
          <div>
            <h1 style={styles.title}>AQHI Dashboard</h1>
            <p style={styles.subtitle}>
              Real-time Air Quality Health Index monitoring across Canada
            </p>
          </div>

          <div style={styles.headerStats}>
            {[
              { value: "Live", label: "Status" },
              { value: new Date(), label: "Date", isDate: true },
              { value: "AQHI", label: "System" }
            ].map((item, i) => {
              const colors = [
                "rgba(46, 204, 113, 0.3)", // green
                "rgba(241, 196, 15, 0.3)", // yellow
                "rgba(231, 76, 60, 0.3)"   // red
              ];

              return (
                <div
                  key={i}
                  style={styles.statBox}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "translateY(-4px) scale(1.05)";
                    e.currentTarget.style.boxShadow = "0 12px 30px rgba(0,0,0,0.35)";
                    e.currentTarget.style.background = colors[i];
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.background = styles.statBox.background;
                  }}
                >
                  <div style={styles.statValue}>
                    {item.isDate
                      ? item.value.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })
                      : item.value}
                  </div>

                  <div style={styles.statLabel}>{item.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={styles.container}>
        <div
          style={styles.card}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow = "0 16px 40px rgba(0,0,0,0.12)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = styles.card.boxShadow;
          }}
        >
          <h3 style={styles.sectionTitle}>Dashboard Filters</h3>

          <div style={styles.flexWrap}>
            <Filters
              year={year}
              setYear={setYear}
              locations={locations}
              setLocations={setLocations}
            />
          </div>
        </div>

        <div style={styles.tabs}>
          {["Forecast", "Observation"].map(tab => (
            <button
              key={tab}
              onClick={() => setDatasetType(tab)}
              style={{
                ...styles.tab,
                background: datasetType === tab ? "#2b7cd3" : "#fff",
                color: datasetType === tab ? "#fff" : "#333",
                transform: datasetType === tab ? "scale(1.05)" : "scale(1)"
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={styles.kpiRow}>
          <div style={styles.kpiWrap}>
            <KPI title="Total Records" value={kpis.total || 0} color="#2b7cd3" />
          </div>
          <div style={styles.kpiWrap}>
            <KPI title="Average AQHI" value={kpis.avg || 0} color="#27ae60" />
          </div>
          <div style={styles.kpiWrap}>
            <KPI title="Maximum AQHI" value={kpis.max || 0} color="#e67e22" />
          </div>
          <div style={styles.kpiWrap}>
            <KPI title="Locations" value={kpis.locations || 0} color="#8e44ad" />
          </div>
        </div>

        <div style={styles.row}>
          <div
            style={styles.chartCard}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 18px 40px rgba(0,0,0,0.12)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = styles.chartCard.boxShadow;
            }}
          >
            <LineChart data={aqhi} />
          </div>

          <div
            style={styles.chartCard}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 18px 40px rgba(0,0,0,0.12)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = styles.chartCard.boxShadow;
            }}
          >
            <DonutChart data={category} />
          </div>
        </div>

        <div style={styles.row}>
          <div
            style={styles.chartCard}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 18px 40px rgba(0,0,0,0.12)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = styles.chartCard.boxShadow;
            }}
          >
            <HourlyChart data={hourly} />
          </div>

          <div
            style={styles.chartCard}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 18px 40px rgba(0,0,0,0.12)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = styles.chartCard.boxShadow;
            }}
          >
            <MapView data={mapPoints} />
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>Data Preview</h3>
          <DataTable data={aqhi} />
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    background: "linear-gradient(135deg, #eef2f7, #f8fbff)",
    minHeight: "100vh",
    fontFamily: "Inter, sans-serif"
  },

  header: {
    background: "linear-gradient(135deg, #0f2027, #1f4068, #2c5364)",
    padding: "28px 20px",
    color: "white",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)"
  },

  headerContent: {
    maxWidth: "1400px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 20
  },

  title: {
    margin: 0,
    fontSize: "2.3rem",
    fontWeight: 700,
    letterSpacing: "0.4px"
  },

  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#dbe9ff"
  },

  headerStats: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap"
  },

  statBox: {
    background: "rgba(255,255,255,0.18)",
    padding: "10px 16px",
    borderRadius: 12,
    backdropFilter: "blur(8px)",
    textAlign: "center",
    minWidth: 90,
    border: "1px solid rgba(255,255,255,0.25)",
    transition: "all 0.25s ease",
    cursor: "pointer"
  },

  statValue: {
    fontSize: 15,
    fontWeight: 600
  },

  statLabel: {
    fontSize: 11,
    color: "#e3ecf7"
  },

  container: {
    maxWidth: "1400px",
    margin: "26px auto",
    padding: "0 14px"
  },

  card: {
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(14px)",
    borderRadius: 22,
    padding: 24,
    boxShadow: "0 14px 40px rgba(0,0,0,0.08)",
    border: "1px solid rgba(255,255,255,0.5)",
    marginBottom: 24,
    transition: "0.25s"
  },

  sectionTitle: {
    marginBottom: 14,
    fontWeight: 600,
    fontSize: 16,
    color: "#333"
  },

  flexWrap: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap"
  },

  tabs: {
    display: "flex",
    gap: 10,
    marginBottom: 20,
    flexWrap: "wrap"
  },

  tab: {
    padding: "10px 18px",
    borderRadius: 999,
    border: "1px solid #dbe2ea",
    cursor: "pointer",
    fontWeight: 500,
    background: "#fff",
    transition: "all 0.2s ease",
    boxShadow: "0 3px 8px rgba(0,0,0,0.06)"
  },

  kpiRow: {
    display: "flex",
    gap: 18,
    flexWrap: "wrap",
    marginBottom: 20
  },

  kpiWrap: {
    flex: "1 1 200px",
    transition: "0.2s"
  },

  row: {
    display: "flex",
    gap: 22,
    flexWrap: "wrap",
    marginBottom: 20
  },

  chartCard: {
    flex: "1 1 420px",
    minWidth: 280,
    background: "rgba(255,255,255,0.9)",
    borderRadius: 22,
    padding: 18,
    boxShadow: "0 14px 35px rgba(0,0,0,0.08)",
    transition: "0.25s"
  }
};