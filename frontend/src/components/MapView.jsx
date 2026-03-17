import { useEffect, useRef } from "react";
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
  const mapRef = useRef();

  const latest = Object.values(
    (data || []).reduce((acc, item) => {
      if (!item.latitude || !item.longitude) return acc;

      const existing = acc[item.locationName];

      if (!existing) {
        acc[item.locationName] = item;
      } else {
        const newTime = new Date(item.datetime).getTime();
        const oldTime = new Date(existing.datetime).getTime();

        if (newTime > oldTime) {
          acc[item.locationName] = item;
        }
      }

      return acc;
    }, {})
  );

  useEffect(() => {
    if (!latest.length || !mapRef.current) return;

    const bounds = latest.map(d => [
      Number(d.longitude),
      Number(d.latitude)
    ]);

    mapRef.current.fitBounds(bounds, {
      padding: 60,
      duration: 1000
    });
  }, [latest]);

  if (!data || data.length === 0) {
    return <p style={{ padding: 20 }}>No map data available</p>;
  }

  return (
    <div style={{ position: "relative" }}>
      <Map
        ref={mapRef}
        mapLib={maplibregl}
        initialViewState={{
          latitude: 53.54,
          longitude: -113.49,
          zoom: 4
        }}
        style={{ width: "100%", height: 450, borderRadius: 12 }}
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
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: color,
                    border: "2px solid white",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                    transform: `scale(${1 + (d.aqhi ?? 1) / 15})`
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: 22,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "rgba(0,0,0,0.75)",
                    color: "white",
                    padding: "4px 8px",
                    borderRadius: 6,
                    fontSize: 11,
                    whiteSpace: "nowrap"
                  }}
                >
                  {d.locationName} • {d.aqhi ?? "-"} ({label})
                </div>
              </div>
            </Marker>
          );
        })}
      </Map>

      <div style={styles.legend}>
        <div style={styles.title}>AQHI Levels</div>
        {[
          { label: "Low (1–3)", color: "#2ecc71" },
          { label: "Moderate (4–6)", color: "#f1c40f" },
          { label: "High (7–10)", color: "#e67e22" },
          { label: "Very High (10+)", color: "#e74c3c" },
          { label: "Unknown", color: "#9e9e9e" }
        ].map((item, i) => (
          <div key={i} style={styles.row}>
            <span style={{ ...styles.dot, background: item.color }} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  legend: {
    position: "absolute",
    bottom: 15,
    left: 15,
    background: "rgba(255,255,255,0.95)",
    padding: "12px 14px",
    borderRadius: 12,
    boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
    fontSize: 12
  },
  title: {
    fontWeight: 600,
    marginBottom: 8
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 4
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: "50%"
  }
};