import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function HourlyChart({ data }) {
  const formatted = data.map((item) => ({
    hour: `${String(item.hour).padStart(2, "0")}:00`,
    avg: Number(item.avg),
  }));

  const values = formatted.map((item) => item.avg).filter((value) => Number.isFinite(value));
  const maxValue = values.length ? Math.max(...values) : 5;
  const yMax = Math.max(5, Math.ceil(maxValue));
  const peakHour = formatted.reduce(
    (best, item) => (!best || item.avg > best.avg ? item : best),
    null
  );
  const lowestHour = formatted.reduce(
    (best, item) => (!best || item.avg < best.avg ? item : best),
    null
  );
  const avgHourly = values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;

  if (!formatted.length) {
    return (
      <div style={styles.emptyState}>
        <h3 style={styles.title}>Average AQHI by Hour</h3>
        <p style={styles.subtitle}>No hourly AQHI data is available for the current filters.</p>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>Average AQHI by Hour</h3>
          <p style={styles.subtitle}>
            Track how average AQHI rises and falls across the day for the current selection.
          </p>
        </div>

        <div style={styles.summaryGrid}>
          <div style={styles.summaryCard}>
            <span style={styles.summaryLabel}>Peak Hour</span>
            <strong style={styles.summaryValue}>
              {peakHour ? `${peakHour.hour} - ${peakHour.avg.toFixed(1)}` : "-"}
            </strong>
          </div>
          <div style={styles.summaryCard}>
            <span style={styles.summaryLabel}>Lowest Hour</span>
            <strong style={styles.summaryValue}>
              {lowestHour ? `${lowestHour.hour} - ${lowestHour.avg.toFixed(1)}` : "-"}
            </strong>
          </div>
          <div style={styles.summaryCard}>
            <span style={styles.summaryLabel}>Daily Average</span>
            <strong style={styles.summaryValue}>
              {avgHourly != null ? avgHourly.toFixed(1) : "-"}
            </strong>
          </div>
        </div>
      </div>

      <div style={styles.chartShell}>
        <ResponsiveContainer width="100%" height={292}>
          <AreaChart data={formatted} margin={{ top: 14, right: 12, left: 20, bottom: 52 }}>
            <defs>
              <linearGradient id="hourlyFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#56b4e9" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#56b4e9" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="#dbe4ef" vertical={false} />
            <XAxis
              dataKey="hour"
              tick={{ fill: "#475569", fontSize: 11 }}
              tickMargin={10}
              axisLine={false}
              tickLine={false}
              minTickGap={14}
              label={{
                value: "Hour of Day",
                position: "bottom",
                offset: 16,
                fill: "#64748b",
                fontSize: 12,
              }}
            />
            <YAxis
              domain={[0, yMax]}
              tick={{ fill: "#475569", fontSize: 11 }}
              tickMargin={10}
              axisLine={false}
              tickLine={false}
              width={58}
              label={{
                value: "AQHI",
                angle: -90,
                position: "insideLeft",
                dx: -8,
                dy: 20,
                fill: "#64748b",
                fontSize: 12,
              }}
            />
            <Tooltip
              contentStyle={styles.tooltip}
              formatter={(value) => [`${Number(value).toFixed(1)} AQHI`, "Average AQHI"]}
              labelFormatter={(label) => `Hour: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="avg"
              stroke="#0072b2"
              strokeWidth={3}
              fill="url(#hourlyFill)"
              dot={{ r: 3, strokeWidth: 2, fill: "#ffffff", stroke: "#0072b2" }}
              activeDot={{ r: 5, strokeWidth: 2, fill: "#ffffff", stroke: "#0072b2" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    width: "100%",
    height: "100%",
    minHeight: 390,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 12,
  },
  title: {
    margin: 0,
    fontWeight: 700,
    color: "#0f172a",
    fontSize: 18,
  },
  subtitle: {
    margin: "6px 0 0",
    fontSize: 13,
    color: "#64748b",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 10,
    width: "100%",
    maxWidth: 460,
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
    fontSize: 14,
    color: "#0f172a",
    fontWeight: 700,
  },
  chartShell: {
    flex: 1,
    minHeight: 304,
    display: "flex",
    alignItems: "flex-end",
    paddingBottom: 8,
    marginTop: "auto",
    marginBottom: "2em",
  },
  emptyState: {
    width: "100%",
    minHeight: 260,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 8,
  },
  tooltip: {
    borderRadius: 12,
    border: "1px solid rgba(148, 163, 184, 0.22)",
    background: "rgba(255,255,255,0.96)",
    boxShadow: "0 12px 24px rgba(15, 23, 42, 0.12)",
  },
};
