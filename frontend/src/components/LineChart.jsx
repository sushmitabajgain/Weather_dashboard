import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as ReLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#0072b2", "#009e73", "#e69f00", "#cc79a7", "#d55e00", "#56b4e9"];

export default function LineChart({ data }) {
  const tickFormatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const tooltipFormatter = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const grouped = {};

  data.forEach((item) => {
    const parsed = new Date(item.datetime);
    const timeKey = Number.isNaN(parsed.getTime()) ? item.datetime : parsed.toISOString();
    if (!grouped[timeKey]) {
      grouped[timeKey] = {
        time: timeKey,
        tickLabel: Number.isNaN(parsed.getTime()) ? item.datetime : tickFormatter.format(parsed),
        tooltipLabel: Number.isNaN(parsed.getTime()) ? item.datetime : tooltipFormatter.format(parsed),
      };
    }
    grouped[timeKey][item.locationName] = item.aqhi;
  });

  const formatted = Object.values(grouped).sort((a, b) => a.time.localeCompare(b.time));
  const locations = [...new Set(data.map((item) => item.locationName))];
  const values = data.map((item) => Number(item.aqhi)).filter((value) => Number.isFinite(value));
  const maxAqhi = values.length ? Math.max(...values) : 10;
  const yMax = Math.max(maxAqhi <= 3 ? 5 : 0, Math.ceil(maxAqhi));
  const years = [...new Set(
    data
      .map((item) => new Date(item.datetime))
      .filter((value) => !Number.isNaN(value.getTime()))
      .map((value) => value.getFullYear())
  )];
  const yearLabel = years.length === 1 ? `${years[0]}` : years.length > 1 ? `${Math.min(...years)}-${Math.max(...years)}` : "";

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>AQHI Trend Over Time</h3>
          <p style={styles.subtitle}>AQHI readings by time for the current selection.</p>
        </div>
        {yearLabel ? <div style={styles.yearBadge}>Year {yearLabel}</div> : null}
      </div>

      <div style={styles.chartShell}>
        <ResponsiveContainer width="100%" height={380}>
          <ReLineChart data={formatted} margin={{ top: 28, right: 20, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="#cbd5e1" opacity={0.6} />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 11, fill: "#475569" }}
            tickFormatter={(value) => formatted.find((item) => item.time === value)?.tickLabel || value}
            interval="preserveStartEnd"
            minTickGap={38}
          />
          <YAxis
            domain={[0, yMax]}
            tick={{ fontSize: 11, fill: "#475569" }}
            label={{ value: "AQHI", angle: -90, position: "insideLeft", style: { fontSize: 12, fill: "#475569" } }}
          />
          <Tooltip
            contentStyle={styles.tooltip}
            labelStyle={{ fontWeight: 700, color: "#0f172a" }}
            labelFormatter={(value) => formatted.find((item) => item.time === value)?.tooltipLabel || value}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
          {locations.slice(0, 6).map((location, index) => (
            <Line
              key={location}
              type="monotone"
              dataKey={location}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2.6}
              dot={false}
              activeDot={{ r: 5 }}
            />
          ))}
          </ReLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    width: "100%",
    height: "100%",
    minHeight: 420,
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    flexWrap: "wrap",
    gap: 10,
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
  yearBadge: {
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(239, 246, 255, 0.88)",
    border: "1px solid rgba(147, 197, 253, 0.28)",
    color: "#0369a1",
    fontSize: 12,
    fontWeight: 700,
  },
  chartShell: {
    marginTop: "auto",
    display: "flex",
    alignItems: "flex-end",
  },
  tooltip: {
    borderRadius: 12,
    border: "1px solid rgba(148, 163, 184, 0.22)",
    background: "rgba(255,255,255,0.96)",
    boxShadow: "0 12px 24px rgba(15, 23, 42, 0.12)",
  },
};
