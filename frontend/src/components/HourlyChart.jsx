import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList
} from "recharts";

export default function HourlyChart({ data }) {
  const formatted = data.map(d => ({
    hour: `${d.hour}:00`,
    avg: Number(d.avg)
  }));

  return (
    <div style={{ width: "100%", height: 420 }}>
      
      {/* CHART TITLE */}
      <h3 style={{
        marginBottom: 10,
        fontWeight: 600,
        color: "#1f2d3d"
      }}>
        Average AQHI by Hour of Day
      </h3>

      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={formatted}>
          
          {/* GRID */}
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />

          {/* X AXIS */}
          <XAxis
            dataKey="hour"
            label={{
              value: "Hour of Day",
              position: "insideBottom",
              offset: -5,
              style: { fontSize: 12 }
            }}
          />

          {/* Y AXIS */}
          <YAxis
            label={{
              value: "Average AQHI",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 12 }
            }}
          />

          {/* TOOLTIP */}
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "none",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
            }}
            formatter={(value) => [
              `${value.toFixed(2)} AQHI`,
              "Average"
            ]}
            labelFormatter={(label) => `Time: ${label}`}
          />

          {/* BAR */}
          <Bar
            dataKey="avg"
            radius={[8, 8, 0, 0]}
            fill="#2b7cd3"
          >
            {/* VALUE LABEL ON TOP */}
            <LabelList
              dataKey="avg"
              position="top"
              formatter={(v) => v.toFixed(1)}
              style={{ fontSize: 11 }}
            />
          </Bar>

        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}