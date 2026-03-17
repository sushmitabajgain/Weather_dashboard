import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const COLORS = {
  Low: "#2ecc71",
  Moderate: "#f1c40f",
  High: "#e67e22",
  "Very High": "#e74c3c",
  Unknown: "#9e9e9e"
};

const ALL_CATEGORIES = ["Low", "Moderate", "High", "Very High", "Unknown"];

export default function DonutChart({ data }) {

  if (!data) return <p style={{ padding: 20 }}>Loading...</p>;

  // normalize categories
  const normalized = ALL_CATEGORIES.map(cat => {
    const found = data.find(d => d.category === cat);
    return {
      name: cat,
      value: found ? found.count : 0
    };
  });

  const total = normalized.reduce((sum, d) => sum + d.value, 0);

  return (
    <div style={styles.card}>

      {/* TITLE */}
      <div style={styles.header}>
        <div style={styles.title}>
          AQHI Category Distribution
        </div>
        <div style={styles.subtitle}>
          Air quality risk breakdown
        </div>
      </div>

      {/* CHART */}
      <div style={styles.chartWrapper}>

        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={normalized}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={75}
              outerRadius={115}
              paddingAngle={3}
              stroke="none"
            >
              {normalized.map((entry, index) => (
                <Cell
                  key={index}
                  fill={COLORS[entry.name]}
                  style={{
                    transition: "all 0.2s"
                  }}
                />
              ))}
            </Pie>

            <Tooltip
              contentStyle={styles.tooltip}
              formatter={(value, name) => {
                const percent = total ? ((value / total) * 100).toFixed(1) : 0;
                return [`${value} (${percent}%)`, name];
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* CENTER KPI */}
        <div style={styles.center}>
          <div style={styles.total}>{total}</div>
          <div style={styles.label}>Total Records</div>
        </div>

      </div>

      {/* LEGEND */}
      <div style={styles.legend}>
        {normalized.map((item, i) => {
          const percent = total
            ? ((item.value / total) * 100).toFixed(1)
            : 0;

          return (
            <div key={i} style={styles.legendItem}>
              <div
                style={{
                  ...styles.dot,
                  background: COLORS[item.name]
                }}
              />
              <span>
                {item.name}
                <span style={styles.legendValue}>
                  {" "} {item.value} ({percent}%)
                </span>
              </span>
            </div>
          );
        })}
      </div>

    </div>
  );
}

const styles = {
  card: {
    background: "rgba(255,255,255,0.75)",
    backdropFilter: "blur(10px)",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)"
  },

  header: {
    marginBottom: 10
  },

  title: {
    fontSize: 16,
    fontWeight: 600,
    color: "#1f2d3d"
  },

  subtitle: {
    fontSize: 13,
    color: "#6b7c93"
  },

  chartWrapper: {
    position: "relative",
    height: 320
  },

  center: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    textAlign: "center"
  },

  total: {
    fontSize: 26,
    fontWeight: 700,
    color: "#1f2d3d"
  },

  label: {
    fontSize: 12,
    color: "#7b8794"
  },

  legend: {
    display: "flex",
    justifyContent: "center",
    gap: 14,
    flexWrap: "wrap",
    marginTop: 12,
    fontSize: 13
  },

  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: 6
  },

  legendValue: {
    color: "#7b8794",
    fontSize: 12
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: "50%"
  },

  tooltip: {
    borderRadius: 10,
    border: "none",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
  }
};