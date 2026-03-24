import { useMemo, useRef, useState } from "react";
import Map, { Layer, Popup, Source } from "react-map-gl";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const SOURCE_ID = "aqhi-points";
const LAYER_HIT = "aqhi-hit";
const LAYER_AURA = "aqhi-aura";
const LAYER_RING = "aqhi-ring";
const LAYER_CORE = "aqhi-core";
const LAYER_LABEL = "aqhi-label";

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

const AQHI_COLOR = [
  "match",
  ["get", "category"],
  "Low",
  "#009e73",
  "Moderate",
  "#56b4e9",
  "High",
  "#e69f00",
  "Very High",
  "#cc79a7",
  "#7b8794",
];

const CATEGORY_COLOR = {
  Low: "#009e73",
  Moderate: "#56b4e9",
  High: "#e69f00",
  "Very High": "#cc79a7",
  Unknown: "#7b8794",
};

const LEGEND_ITEMS = [
  { label: "Low", range: "1-3", color: "#009e73" },
  { label: "Moderate", range: "4-6", color: "#56b4e9" },
  { label: "High", range: "7-10", color: "#e69f00" },
  { label: "Very High", range: ">10", color: "#cc79a7" },
];

const HEALTH_ADVICE = {
  Low: "Air quality is ideal for normal outdoor activity.",
  Moderate: "Sensitive groups should pace prolonged outdoor exertion.",
  High: "Consider reducing strenuous outdoor activity.",
  "Very High": "Limit outdoor exposure and avoid strenuous activity.",
  Unknown: "Health guidance is unavailable for this station.",
};

const HIT_LAYER = {
  id: LAYER_HIT,
  type: "circle",
  paint: {
    "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 16, 8, 28],
    "circle-color": "#000000",
    "circle-opacity": 0.01,
  },
};

const AURA_LAYER = {
  id: LAYER_AURA,
  type: "circle",
  paint: {
    "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 22, 8, 56],
    "circle-color": AQHI_COLOR,
    "circle-opacity": ["interpolate", ["linear"], ["zoom"], 2, 0.08, 8, 0.18],
    "circle-blur": 1,
  },
};

const RING_LAYER = {
  id: LAYER_RING,
  type: "circle",
  paint: {
    "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 8, 8, 22],
    "circle-color": "rgba(0,0,0,0)",
    "circle-stroke-color": AQHI_COLOR,
    "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 2, 1, 8, 2.2],
    "circle-stroke-opacity": 0.55,
  },
};

const CORE_LAYER = {
  id: LAYER_CORE,
  type: "circle",
  paint: {
    "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 5, 8, 11],
    "circle-color": AQHI_COLOR,
    "circle-stroke-color": "#f8fafc",
    "circle-stroke-width": 1.6,
    "circle-opacity": 0.98,
  },
};

const LABEL_LAYER = {
  id: LAYER_LABEL,
  type: "symbol",
  minzoom: 5,
  layout: {
    "text-field": [
      "case",
      ["has", "aqhi"],
      ["to-string", ["round", ["get", "aqhi"]]],
      "",
    ],
    "text-size": 11,
    "text-font": ["Open Sans Bold"],
  },
  paint: {
    "text-color": "#0f172a",
    "text-halo-color": "rgba(255,255,255,0.92)",
    "text-halo-width": 1.3,
  },
};

function normalizePoint(point) {
  const latitude = Number(point.latitude);
  const longitude = Number(point.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const aqhi = Number(point.aqhi);

  return {
    ...point,
    latitude,
    longitude,
    aqhi: Number.isFinite(aqhi) ? aqhi : null,
    category: point.category || "Unknown",
  };
}

function toGeoJson(points) {
  return {
    type: "FeatureCollection",
    features: points.map((point) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [point.longitude, point.latitude],
      },
      properties: {
        locationName: point.locationName,
        aqhi: point.aqhi,
        category: point.category,
      },
    })),
  };
}

function getStats(points) {
  if (!points.length) {
    return {
      count: 0,
      average: "--",
      peak: "--",
      dominant: "Unknown",
    };
  }

  const counts = points.reduce((accumulator, point) => {
    accumulator[point.category] = (accumulator[point.category] || 0) + 1;
    return accumulator;
  }, {});

  const values = points.map((point) => point.aqhi).filter((value) => Number.isFinite(value));
  const peak = [...points]
    .filter((point) => Number.isFinite(point.aqhi))
    .sort((left, right) => right.aqhi - left.aqhi)[0];

  return {
    count: points.length,
    average: values.length
      ? (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1)
      : "--",
    peak: peak ? `${peak.aqhi.toFixed(1)} at ${peak.locationName}` : "--",
    dominant: Object.entries(counts).sort((left, right) => right[1] - left[1])[0]?.[0] || "Unknown",
  };
}

function getPopupTone(category) {
  return CATEGORY_COLOR[category] || CATEGORY_COLOR.Unknown;
}

function buildPopup(feature) {
  if (!feature?.geometry?.coordinates || !feature?.properties) {
    return null;
  }

  const [longitude, latitude] = feature.geometry.coordinates;

  return {
    longitude: Number(longitude),
    latitude: Number(latitude),
    locationName: feature.properties.locationName,
    aqhi: Number(feature.properties.aqhi),
    category: feature.properties.category || "Unknown",
  };
}

export default function MapView({ data }) {
  const mapRef = useRef(null);
  const [popup, setPopup] = useState(null);

  const points = useMemo(() => (data || []).map(normalizePoint).filter(Boolean), [data]);
  const geoJson = useMemo(() => toGeoJson(points), [points]);
  const stats = useMemo(() => getStats(points), [points]);

  if (!points.length) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyEyebrow}>AQHI Map</div>
        <div style={styles.emptyTitle}>No geographic points match the current filters.</div>
        <div style={styles.emptyCopy}>
          Try a wider time range or include more locations to repopulate the monitoring view.
        </div>
      </div>
    );
  }

  return (
    <div style={styles.shell}>
      <div style={styles.statsBar}>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{stats.count}</span>
          <span style={styles.statLabel}>Stations</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{stats.average}</span>
          <span style={styles.statLabel}>Average AQHI</span>
        </div>
        <div style={{ ...styles.statCard, ...styles.statCardWide }}>
          <span style={styles.statValue}>{stats.dominant}</span>
          <span style={styles.statLabel}>Dominant Risk</span>
        </div>
        <div style={{ ...styles.statCard, ...styles.statCardWide }}>
          <span style={styles.statValue}>{stats.peak}</span>
          <span style={styles.statLabel}>Peak Reading</span>
        </div>
      </div>

      <div style={styles.mapFrame}>
        <Map
          ref={mapRef}
          mapLib={maplibregl}
          mapStyle={MAP_STYLE}
          initialViewState={{ longitude: -96, latitude: 57, zoom: 3 }}
          interactiveLayerIds={[LAYER_HIT, LAYER_CORE]}
          style={styles.map}
          onClick={(event) => {
            const feature = event.features?.[0];
            if (!feature) {
              setPopup(null);
              return;
            }
            const nextPopup = buildPopup(feature);
            const map = mapRef.current?.getMap?.();

            if (map && nextPopup) {
              const isMobile = map.getContainer().clientWidth < 640;
              map.easeTo({
                center: [nextPopup.longitude, nextPopup.latitude],
                duration: 700,
                offset: [0, isMobile ? 150 : 54],
                essential: true,
              });
            }

            window.setTimeout(() => {
              setPopup(nextPopup);
            }, 180);
          }}
          onMouseMove={(event) => {
            event.target.getCanvas().style.cursor = event.features?.length ? "pointer" : "";
          }}
        >
          <Source id={SOURCE_ID} type="geojson" data={geoJson}>
            <Layer {...HIT_LAYER} />
            <Layer {...AURA_LAYER} />
            <Layer {...RING_LAYER} />
            <Layer {...CORE_LAYER} />
            <Layer {...LABEL_LAYER} />
          </Source>

          {popup ? (
            <Popup
              anchor="bottom"
              className="aqhi-map-popup"
              closeOnClick={false}
              closeButton={false}
              latitude={popup.latitude}
              longitude={popup.longitude}
              maxWidth="280px"
              offset={24}
              onClose={() => setPopup(null)}
            >
              <div style={styles.popupCard}>
                <div
                  style={{
                    ...styles.popupHeader,
                    borderTop: `4px solid ${getPopupTone(popup.category)}`,
                  }}
                >
                  <div>
                    <div style={styles.popupEyebrow}>Monitoring Site</div>
                    <div style={styles.popupTitle}>{popup.locationName}</div>
                  </div>
                  <div style={{ ...styles.popupBadge, color: getPopupTone(popup.category) }}>
                    {popup.category}
                  </div>
                </div>
                <div style={styles.popupBody}>
                  <div style={styles.popupMetricRow}>
                    <div style={styles.popupMetric}>
                      <span style={styles.popupMetricLabel}>AQHI</span>
                      <span style={styles.popupMetricValue}>
                        {Number.isFinite(popup.aqhi) ? popup.aqhi.toFixed(1) : "--"}
                      </span>
                    </div>
                    <div style={styles.popupMetric}>
                      <span style={styles.popupMetricLabel}>Level</span>
                      <span style={{ ...styles.popupMetricValueSmall, color: getPopupTone(popup.category) }}>
                        {popup.category}
                      </span>
                    </div>
                  </div>
                  <div style={styles.popupAdviceTitle}>Health guidance</div>
                  <div style={styles.popupAdvice}>
                    {HEALTH_ADVICE[popup.category] || HEALTH_ADVICE.Unknown}
                  </div>
                </div>
              </div>
            </Popup>
          ) : null}
        </Map>

        <div style={styles.mapTint} />
      </div>

      <div style={styles.legend}>
        <div style={styles.legendTitle}>AQHI Risk Scale</div>
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} style={styles.legendRow}>
            <span style={{ ...styles.legendDot, background: item.color }} />
            <span style={styles.legendText}>
              {item.label} <span style={styles.legendRange}>{item.range}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const glassPanel = {
  background: "rgba(255, 255, 255, 0.78)",
  border: "1px solid rgba(148, 163, 184, 0.24)",
  backdropFilter: "blur(12px)",
  boxShadow: "0 18px 40px rgba(15, 23, 42, 0.12)",
};

const styles = {
  shell: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 24,
    background:
      "linear-gradient(180deg, rgba(186, 230, 253, 0.55), rgba(236, 253, 245, 0.7))",
    minHeight: 460,
    border: "1px solid rgba(148, 163, 184, 0.2)",
  },
  mapFrame: {
    position: "relative",
  },
  map: {
    width: "100%",
    height: "clamp(400px, 48vw, 580px)",
  },
  mapTint: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background:
      "linear-gradient(180deg, rgba(125, 211, 252, 0.16), rgba(255, 255, 255, 0.08) 45%, rgba(167, 243, 208, 0.16))",
  },
  emptyState: {
    minHeight: 420,
    borderRadius: 24,
    padding: "48px 28px",
    color: "#1e293b",
    background:
      "linear-gradient(180deg, rgba(186, 230, 253, 0.55), rgba(236, 253, 245, 0.7))",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    display: "grid",
    alignContent: "center",
    gap: 10,
    textAlign: "center",
  },
  emptyEyebrow: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.16em",
    color: "#0369a1",
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: "#0f172a",
  },
  emptyCopy: {
    fontSize: 14,
    color: "#475569",
    maxWidth: 440,
    margin: "0 auto",
    lineHeight: 1.6,
  },
  statsBar: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    zIndex: 2,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: 10,
    pointerEvents: "none",
  },
  statCard: {
    ...glassPanel,
    borderRadius: 16,
    padding: "10px 12px",
    display: "grid",
    gap: 4,
    minHeight: 68,
  },
  statCardWide: {
    minWidth: 0,
  },
  statValue: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: 700,
    lineHeight: 1.25,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  statLabel: {
    color: "#475569",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
  },
  legend: {
    ...glassPanel,
    position: "absolute",
    left: 14,
    bottom: 14,
    zIndex: 2,
    borderRadius: 16,
    padding: "12px 14px",
    minWidth: 204,
  },
  legendTitle: {
    color: "#0f172a",
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 10,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  legendRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: "999px",
    flexShrink: 0,
  },
  legendText: {
    color: "#1e293b",
    fontSize: 12,
  },
  legendRange: {
    color: "#64748b",
    marginLeft: 6,
  },
  legendHint: {
    marginTop: 6,
    paddingTop: 10,
    borderTop: "1px solid rgba(148, 163, 184, 0.22)",
    color: "#475569",
    fontSize: 11,
    lineHeight: 1.5,
  },
  popupCard: {
    width: 260,
    borderRadius: 16,
    overflow: "hidden",
    background: "rgba(255, 255, 255, 0.98)",
    color: "#0f172a",
    boxShadow: "0 22px 48px rgba(15, 23, 42, 0.18)",
    border: "1px solid rgba(148, 163, 184, 0.22)",
  },
  popupHeader: {
    padding: "14px 16px 12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    background: "linear-gradient(180deg, #f8fafc, #eef6ff)",
  },
  popupEyebrow: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: "#64748b",
    marginBottom: 4,
  },
  popupTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: "#0f172a",
    lineHeight: 1.2,
  },
  popupBadge: {
    padding: "6px 10px",
    borderRadius: 999,
    background: "#f8fafc",
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: "nowrap",
    border: "1px solid rgba(148, 163, 184, 0.22)",
  },
  popupBody: {
    padding: 16,
    display: "grid",
    gap: 14,
  },
  popupMetricRow: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
  },
  popupMetric: {
    background: "#f8fafc",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    borderRadius: 14,
    padding: "12px 10px",
    display: "grid",
    gap: 6,
  },
  popupMetricLabel: {
    fontSize: 11,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
  },
  popupMetricValue: {
    fontSize: 24,
    fontWeight: 700,
    color: "#0f172a",
    lineHeight: 1,
  },
  popupMetricValueSmall: {
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1.4,
  },
  popupAdviceTitle: {
    fontSize: 11,
    color: "#0369a1",
    textTransform: "uppercase",
    letterSpacing: "0.14em",
  },
  popupAdvice: {
    padding: "12px 14px",
    borderRadius: 14,
    background: "#eff6ff",
    border: "1px solid rgba(147, 197, 253, 0.3)",
    color: "#334155",
    lineHeight: 1.6,
    fontSize: 13,
  },
};

if (typeof document !== "undefined" && !document.getElementById("aqhi-map-popup-style")) {
  const styleTag = document.createElement("style");
  styleTag.id = "aqhi-map-popup-style";
  styleTag.textContent = `
    .aqhi-map-popup {
      z-index: 5;
    }

    .aqhi-map-popup .maplibregl-popup-content {
      padding: 0;
      background: transparent;
      box-shadow: none;
      border-radius: 16px;
    }

    .aqhi-map-popup .maplibregl-popup-tip {
      border-top-color: rgba(255, 255, 255, 0.98);
      border-bottom-color: rgba(255, 255, 255, 0.98);
    }
  `;
  document.head.appendChild(styleTag);
}
