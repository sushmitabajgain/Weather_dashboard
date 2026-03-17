import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

export default function LineChart({ data }) {

  // group and pivot data
  const grouped = {};
  data.forEach(d => {
    const time = new Date(d.datetime).toLocaleString();

    if (!grouped[time]) grouped[time] = { time };
    grouped[time][d.locationName] = d.aqhi;
  });

  const formatted = Object.values(grouped);

  const locations = [...new Set(data.map(d => d.locationName))];

  const colors = [
    "#2b7cd3",
    "#27ae60",
    "#e67e22",
    "#8e44ad",
    "#e74c3c",
    "#16a085"
  ];

  return (
    <div style={{ width: "100%", height: "100%" }}>

      {/* TITLE */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
        flexWrap: "wrap"
      }}>
        <h3 style={{
          margin: 0,
          fontWeight: 600,
          color: "#1f2d3d"
        }}>
          AQHI Trend Over Time
        </h3>

        <span style={{
          fontSize: 12,
          color: "#7b8794"
        }}>
          Multi-location comparison
        </span>
      </div>

      <ResponsiveContainer width="100%" height={380}>
        <ReLineChart
          data={formatted}
          margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
        >

          {/* GRID */}
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />

          {/* X AXIS */}
          <XAxis
            dataKey="time"
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
            minTickGap={40}
          />

          {/* Y AXIS */}
          <YAxis
            tick={{ fontSize: 11 }}
            label={{
              value: "AQHI",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 12 }
            }}
          />

          {/* TOOLTIP */}
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: "none",
              boxShadow: "0 6px 18px rgba(0,0,0,0.15)"
            }}
            labelStyle={{ fontWeight: 600 }}
          />

          {/* LEGEND */}
          <Legend
            wrapperStyle={{
              fontSize: 12,
              paddingTop: 10
            }}
          />

          {/* LINES */}
          {locations.slice(0, 6).map((loc, index) => (
            <Line
              key={loc}
              type="monotone"
              dataKey={loc}
              stroke={colors[index % colors.length]}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
            />
          ))}

        </ReLineChart>
      </ResponsiveContainer>
    </div>
  );
}