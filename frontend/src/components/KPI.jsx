export default function KPI({ title, value, color }) {
  return (
    <div
      className="dash-kpi-card"
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.96))",
        padding: 18,
        borderRadius: 18,
        border: "1px solid rgba(148, 163, 184, 0.18)",
        boxShadow: "0 12px 28px rgba(15, 23, 42, 0.07)",
        display: "grid",
        gap: 10,
        minHeight: 130,
      }}
    >
      <div
        style={{
          width: 44,
          height: 6,
          borderRadius: 999,
          background: color,
        }}
      />
      <div
        style={{
          fontSize: 13,
          color: "#64748b",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 30, fontWeight: 700, color: "#0f172a", lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "#475569" }}>Current selection</div>
    </div>
  );
}

if (typeof document !== "undefined" && !document.getElementById("aqhi-kpi-mobile-style")) {
  const styleTag = document.createElement("style");
  styleTag.id = "aqhi-kpi-mobile-style";
  styleTag.textContent = `
    @media (max-width: 640px) {
      .dash-kpi-card {
        min-height: 112px !important;
        padding: 14px !important;
        gap: 8px !important;
      }

      .dash-kpi-card div:nth-child(2) {
        font-size: 11px !important;
      }

      .dash-kpi-card div:nth-child(3) {
        font-size: 24px !important;
      }
    }

    @media (max-width: 480px) {
      .dash-kpi-card {
        min-height: 104px !important;
        padding: 12px !important;
      }

      .dash-kpi-card div:nth-child(3) {
        font-size: 22px !important;
      }
    }
  `;
  document.head.appendChild(styleTag);
}
