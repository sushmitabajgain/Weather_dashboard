export default function KPI({ title, value, color }) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #ffffff, #f7f9fc)",
        padding: "20px",
        borderRadius: "16px",
        boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
        borderLeft: `6px solid ${color}`,
        flex: "1 1 220px",
        minWidth: 200,
        transition: "all 0.25s ease",
        cursor: "default"
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 28px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.08)";
      }}
    >
      {/* TITLE */}
      <div
        style={{
          fontSize: 13,
          color: "#6b7c93",
          marginBottom: 8,
          fontWeight: 500,
          letterSpacing: "0.3px"
        }}
      >
        {title}
      </div>

      {/* VALUE */}
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: "#1f2d3d",
          lineHeight: 1.2
        }}
      >
        {value}
      </div>

      {/* SUBTEXT / CONTEXT */}
      <div
        style={{
          fontSize: 11,
          marginTop: 6,
          color: "#9aa5b1"
        }}
      >
        Current selection
      </div>
    </div>
  );
}