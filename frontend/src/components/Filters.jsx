import Select from "react-select";
import { useQuery } from "@apollo/client";
import { GET_LOCATIONS } from "../graphql/queries";

export default function Filters({ year, setYear, locations, setLocations }) {
  const years = [2022, 2023, 2024, 2025, 2026];

  // fetch locations from backend
  const { data, loading } = useQuery(GET_LOCATIONS);

  const locationOptions =
    data?.locations?.map((loc) => ({
      label: loc,
      value: loc
    })) || [];

  if (loading) {
    return <p style={{ padding: 10 }}>Loading filters...</p>;
  }

  return (
    <div style={styles.container}>
      
      {/* YEAR */}
      <div style={styles.field}>
        <label style={styles.label}>Year</label>

        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          style={styles.select}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* LOCATIONS */}
      <div style={styles.field}>
        <label style={styles.label}>Locations</label>

        <Select
          isMulti
          options={locationOptions}
          value={locations}
          onChange={setLocations}
          placeholder="Select locations..."
          styles={customSelectStyles}
        />
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    gap: 20,
    flexWrap: "wrap",
    alignItems: "flex-end"
  },

  field: {
    display: "flex",
    flexDirection: "column",
    minWidth: 220,
    flex: "1 1 220px"
  },

  label: {
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 6,
    color: "#1f2d3d"
  },

  select: {
    padding: "10px",
    borderRadius: 10,
    border: "1px solid #dce1e7",
    fontSize: 14,
    background: "#fff",
    height: 42
  }
};

const customSelectStyles = {
  control: (base) => ({
    ...base,
    borderRadius: 10,
    borderColor: "#dce1e7",
    boxShadow: "none",
    padding: "2px",
    minHeight: "42px",
    ":hover": {
      borderColor: "#2b7cd3"
    }
  }),

  valueContainer: (base) => ({
    ...base,
    padding: "2px 6px"
  }),

  multiValue: (base) => ({
    ...base,
    backgroundColor: "#2b7cd3",
    borderRadius: 6
  }),

  multiValueLabel: (base) => ({
    ...base,
    color: "white",
    fontWeight: 500
  }),

  multiValueRemove: (base) => ({
    ...base,
    color: "white",
    ":hover": {
      backgroundColor: "#1f5fa8",
      color: "white"
    }
  }),

  menu: (base) => ({
    ...base,
    zIndex: 9999,
    borderRadius: 10
  })
};