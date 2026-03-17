import Map, { Marker } from "react-map-gl";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

function getColor(aqhi) {
  if (aqhi == null) return "#9e9e9e";
  if (aqhi <= 3) return "#2ecc71";
  if (aqhi <= 6) return "#f1c40f";
  if (aqhi <= 10) return "#e67e22";
  return "#e74c3c";
}

function getLabel(aqhi) {
  if (aqhi == null) return "Unknown";
  if (aqhi <= 3) return "Low";
  if (aqhi <= 6) return "Moderate";
  if (aqhi <= 10) return "High";
  return "Very High";
}

export default function MapView({ data }) {
  if (!data || data.length === 0) {
    return <p style={{ padding: 20 }}>No map data available</p>;
  }

  const latest = Object.values(
    data.reduce((acc, item) => {
      if (item.latitude && item.longitude) {
        acc[item.locationName] = item;
      }
      return acc;
    }, {})
  );

  return (
    <div style={{ position: "relative" }}>
      <Map
        mapLib={maplibregl}
        initialViewState={{
          latitude: 53.54,
          longitude: -113.49,
          zoom: 4
        }}
        style={{ width: "100%", height: 450 }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
      >
        {latest.map((d, i) => {
          const color = getColor(d.aqhi);
          const label = getLabel(d.aqhi);

          return (
            <Marker
              key={i}
              latitude={Number(d.latitude)}
              longitude={Number(d.longitude)}
            >
              <div
                title={`${d.locationName} (${label})`}
                style={{
                  background: color,
                  color: "white",
                  padding: "6px 10px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  boxShadow: "0 3px 8px rgba(0,0,0,0.2)",
                  transform: `scale(${1 + (d.aqhi ?? 1) / 15})`
                }}
              >
                {d.aqhi ?? "-"}
              </div>
            </Marker>
          );
        })}
      </Map>

      <div style={{
        position: "absolute",
        bottom: 15,
        left: 15,
        background: "rgba(255,255,255,0.9)",
        padding: "10px 14px",
        borderRadius: 10,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        fontSize: 12
      }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>AQHI Levels</div>
        <div>🟢 Low (1–3)</div>
        <div>🟡 Moderate (4–6)</div>
        <div>🟠 High (7–10)</div>
        <div>🔴 Very High (10+)</div>
        <div>⚪ Unknown</div>
      </div>
    </div>
  );
}