import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = {
  Low: "#009e73",
  Moderate: "#56b4e9",
  High: "#e69f00",
  "Very High": "#cc79a7",
  Unknown: "#7b8794",
};

const ALL_CATEGORIES = ["Low", "Moderate", "High", "Very High", "Unknown"];

export default function DonutChart({ data }) {
  if (!data) return <p style={{ padding: 20 }}>Loading...</p>;

  const normalized = ALL_CATEGORIES.map((category) => {
    const found = data.find((item) => item.category === category);
    return {
      name: category,
      value: found ? found.count : 0,
    };
  });

  const total = normalized.reduce((sum, item) => sum + item.value, 0);
  const dominant = normalized.reduce(
    (best, item) => (!best || item.value > best.value ? item : best),
    null
  );

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.title}>AQHI Category Distribution</div>
        <div style={styles.subtitle}>
          Each category shows both record count and share of the current selection.
        </div>
      </div>

      <div style={styles.summaryRow}>
        <div style={styles.summaryCard}>
          <span style={styles.summaryLabel}>Total Records</span>
          <strong style={styles.summaryValue}>{total}</strong>
        </div>
        <div style={styles.summaryCard}>
          <span style={styles.summaryLabel}>Largest Category</span>
          <strong style={styles.summaryValue}>{dominant ? dominant.name : "-"}</strong>
        </div>
        <div style={styles.summaryCard}>
          <span style={styles.summaryLabel}>Largest Share</span>
          <strong style={styles.summaryValue}>
            {dominant && total ? `${((dominant.value / total) * 100).toFixed(1)}%` : "-"}
          </strong>
        </div>
      </div>

      <div style={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={normalized}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={74}
              outerRadius={114}
              paddingAngle={3}
              stroke="none"
            >
              {normalized.map((entry) => (
                <Cell key={entry.name} fill={COLORS[entry.name]} />
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

        <div style={styles.center}>
          <div style={styles.total}>{total}</div>
          <div style={styles.label}>Total Records</div>
        </div>
      </div>

      <div style={styles.legend}>
        {normalized.map((item) => {
          const percent = total ? ((item.value / total) * 100).toFixed(1) : 0;
          return (
            <div key={item.name} style={styles.legendItem}>
              <div style={{ ...styles.dot, background: COLORS[item.name] }} />
              <span style={styles.legendLabel}>{item.name}</span>
              <span style={styles.legendValue}>
                {item.value} ({percent}%)
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
    background: "transparent",
  },
  header: {
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 6,
  },
  summaryRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 10,
    marginBottom: 14,
  },
  summaryCard: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: "10px 12px",
    borderRadius: 14,
    background: "linear-gradient(180deg, rgba(248, 250, 252, 0.95), rgba(239, 246, 255, 0.88))",
    border: "1px solid rgba(148, 163, 184, 0.18)",
  },
  summaryLabel: {
    fontSize: 11,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#64748b",
    fontWeight: 700,
  },
  summaryValue: {
    color: "#0f172a",
    fontWeight: 700,
    fontSize: 14,
  },
  chartWrapper: {
    position: "relative",
    height: 320,
  },
  center: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    textAlign: "center",
  },
  total: {
    fontSize: 28,
    fontWeight: 700,
    color: "#0f172a",
  },
  label: {
    fontSize: 12,
    color: "#64748b",
  },
  legend: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 10,
    marginTop: 12,
    fontSize: 13,
  },
  legendItem: {
    display: "grid",
    gridTemplateColumns: "12px 1fr auto",
    alignItems: "center",
    columnGap: 10,
    rowGap: 2,
    padding: "10px 12px",
    borderRadius: 12,
    background: "#f8fafc",
    border: "1px solid rgba(148, 163, 184, 0.18)",
  },
  legendLabel: {
    color: "#0f172a",
    fontWeight: 600,
  },
  legendValue: {
    color: "#64748b",
    marginLeft: "auto",
    fontSize: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
  },
  tooltip: {
    borderRadius: 12,
    border: "1px solid rgba(148, 163, 184, 0.22)",
    background: "rgba(255,255,255,0.96)",
    boxShadow: "0 12px 24px rgba(15, 23, 42, 0.12)",
  },
};
