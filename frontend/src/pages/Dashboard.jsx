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

  // MAIN DATA
  const { data, loading, error } = useQuery(GET_AQHI, { variables });

  // KPIs
  const { data: kpiData } = useQuery(GET_KPIS, { variables });

  // ALL USE SAME VARIABLES
  const { data: hourlyData } = useQuery(GET_HOURLY, { variables });
  const { data: categoryData } = useQuery(GET_CATEGORY, { variables });
  const { data: mapData } = useQuery(GET_MAP, { variables });

  if (loading) return <p style={{ padding: 20 }}>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  // DATA EXTRACTION
  const aqhi = data?.aqhiData || [];
  const kpis = kpiData?.kpis || {};
  const hourly = hourlyData?.hourlyAvg || [];
  const category = categoryData?.categoryDistribution || [];
  const mapPoints = mapData?.mapPoints || [];

  // remove duplicate / noisy rows
  const latestRows = aqhi;

  return (
    <div style={styles.page}>
      
      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.title}>AQHI Dashboard</h1>
        <p style={styles.subtitle}>
          Air Quality Health Index across Canada
        </p>
      </div>

      <div style={styles.container}>
        
        {/* FILTER PANEL */}
        <div style={styles.card}>
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

        {/* TABS */}
        <div style={styles.tabs}>
          {["Forecast", "Observation"].map(tab => (
            <button
              key={tab}
              onClick={() => setDatasetType(tab)}
              style={{
                ...styles.tab,
                background: datasetType === tab ? "#2b7cd3" : "#fff",
                color: datasetType === tab ? "#fff" : "#333"
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* KPI */}
        <div style={styles.kpiRow}>
          <KPI title="Total Records" value={kpis.total || 0} color="#2b7cd3" />
          <KPI title="Average AQHI" value={kpis.avg || 0} color="#27ae60" />
          <KPI title="Maximum AQHI" value={kpis.max || 0} color="#e67e22" />
          <KPI title="Locations" value={kpis.locations || 0} color="#8e44ad" />
        </div>

        {/* CHARTS ROW 1 */}
        <div style={styles.row}>
          <div style={styles.chartCard}>
            <LineChart data={aqhi} />
          </div>

          <div style={styles.chartCard}>
            <DonutChart data={category} />
          </div>
        </div>

        {/* CHARTS ROW 2 */}
        <div style={styles.row}>
          <div style={styles.chartCard}>
            <HourlyChart data={hourly} />
          </div>

          <div style={styles.chartCard}>
            <MapView data={mapPoints} />
          </div>
        </div>

        {/* TABLE */}
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>Data Preview</h3>
          <DataTable data={latestRows} />
        </div>

      </div>
    </div>
  );
}

const styles = {
  page: {
    background: "linear-gradient(135deg, #eef2f7, #f8fbff)",
    minHeight: "100vh",
    fontFamily: "Inter, sans-serif",
  },

  header: {
    background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
    padding: "28px",
    textAlign: "center",
    color: "white",
    boxShadow: "0 6px 20px rgba(0,0,0,0.2)"
  },

  title: {
    margin: 0,
    fontSize: "2rem",
    fontWeight: "700"
  },

  subtitle: {
    marginTop: 8,
    color: "#dce6f2"
  },

  container: {
    maxWidth: "1400px",
    margin: "20px auto",
    padding: "0 12px"
  },

  card: {
    background: "rgba(255,255,255,0.7)",
    backdropFilter: "blur(12px)",
    borderRadius: 18,
    padding: 20,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    border: "1px solid rgba(255,255,255,0.4)",
    marginBottom: 20
  },

  sectionTitle: {
    marginBottom: 12
  },

  flexWrap: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap"
  },

  tabs: {
    display: "flex",
    gap: 10,
    marginBottom: 20
  },

  tab: {
    padding: "10px 20px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    fontWeight: 500,
    background: "#e9eef5",
    transition: "0.2s"
  },

  kpiRow: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 20
  },

  row: {
    display: "flex",
    gap: 20,
    flexWrap: "wrap",
    marginBottom: 20
  },

  chartCard: {
    flex: "1 1 420px",
    minWidth: 280,
    background: "rgba(255,255,255,0.75)",
    backdropFilter: "blur(10px)",
    borderRadius: 18,
    padding: 16,
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  }
};