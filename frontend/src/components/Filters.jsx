import Select from "react-select";
import { useQuery } from "@apollo/client";
import { GET_LOCATIONS } from "../graphql/queries";
import { DASHBOARD_ALL_DATA_YEAR } from "../config";

const TIME_RANGE_OPTIONS = [
  { value: "24h", label: "Last 24 Hours" },
  { value: "48h", label: "Last 48 Hours" },
  { value: "7d", label: "Last 7 Days" },
  { value: "year", label: `All (${DASHBOARD_ALL_DATA_YEAR})` },
];

export default function Filters({ timeRange, setTimeRange, locations, setLocations }) {
  const { data, loading } = useQuery(GET_LOCATIONS);

  const locationOptions =
    data?.locations?.map((location) => ({
      label: location,
      value: location,
    })) || [];

  if (loading) {
    return <p style={{ padding: 10 }}>Loading filters...</p>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.field}>
        <label style={styles.label}>Time Range</label>
        <select value={timeRange} onChange={(event) => setTimeRange(event.target.value)} style={styles.select}>
          {TIME_RANGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Locations</label>
        <Select
          isMulti
          options={locationOptions}
          value={locations}
          onChange={setLocations}
          placeholder="Select locations..."
          styles={customSelectStyles}
          menuPortalTarget={document.body}
          menuPosition="fixed"
        />
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    alignItems: "flex-end",
    flex: "1 1 540px",
    width: "100%",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    flex: "1 1 220px",
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 8,
    color: "#475569",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  select: {
    padding: "11px 12px",
    borderRadius: 14,
    border: "1px solid rgba(148, 163, 184, 0.3)",
    fontSize: 14,
    background: "rgba(255,255,255,0.92)",
    color: "#0f172a",
    minHeight: 46,
    width: "100%",
    boxShadow: "0 6px 16px rgba(15, 23, 42, 0.04)",
  },
};

if (typeof document !== "undefined" && !document.getElementById("aqhi-filters-mobile-style")) {
  const styleTag = document.createElement("style");
  styleTag.id = "aqhi-filters-mobile-style";
  styleTag.textContent = `
    @media (max-width: 640px) {
      .dash-filter-container > div {
        display: grid !important;
        grid-template-columns: 1fr !important;
        gap: 12px !important;
        width: 100% !important;
      }
    }
  `;
  document.head.appendChild(styleTag);
}

const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: 14,
    borderColor: state.isFocused ? "#0072b2" : "rgba(148, 163, 184, 0.3)",
    boxShadow: state.isFocused ? "0 0 0 3px rgba(86, 180, 233, 0.22)" : "0 6px 16px rgba(15, 23, 42, 0.04)",
    padding: "3px 4px",
    minHeight: "46px",
    background: "rgba(255,255,255,0.92)",
    ":hover": {
      borderColor: "#0072b2",
    },
  }),
  placeholder: (base) => ({
    ...base,
    color: "#64748b",
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    border: "1px solid rgba(86, 180, 233, 0.3)",
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: "#0f172a",
    fontWeight: 600,
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: "#475569",
    ":hover": {
      backgroundColor: "#56b4e9",
      color: "#ffffff",
    },
  }),
  menu: (base) => ({
    ...base,
    borderRadius: 14,
    overflow: "hidden",
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
};
