import { useEffect, useMemo, useState } from "react";

const TABLE_STYLE_ID = "aqhi-data-table-style";

const RISK_STYLES = {
  Low: { background: "#ecfdf5", color: "#065f46", border: "#a7f3d0" },
  Moderate: { background: "#eff6ff", color: "#075985", border: "#bae6fd" },
  High: { background: "#fff7ed", color: "#9a3412", border: "#fed7aa" },
  "Very High": { background: "#fdf2f8", color: "#9d174d", border: "#f9a8d4" },
};

function getRisk(aqhi) {
  if (aqhi <= 3) return "Low";
  if (aqhi <= 6) return "Moderate";
  if (aqhi <= 10) return "High";
  return "Very High";
}

function formatTime(date) {
  if (!date) return "-";
  return new Date(date).toLocaleString();
}

export default function DataTable({ data }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    let styleTag = document.getElementById(TABLE_STYLE_ID);
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = TABLE_STYLE_ID;
      styleTag.textContent = `
        @media (max-width: 640px) {
          .aqhi-data-table-shell {
            overflow: hidden !important;
          }

          .aqhi-data-table {
            min-width: 0 !important;
          }

          .aqhi-data-table th:nth-child(4),
          .aqhi-data-table td:nth-child(4) {
            display: none !important;
          }

          .aqhi-data-table th,
          .aqhi-data-table td {
            padding: 12px 10px !important;
          }

          .aqhi-data-table th:nth-child(2),
          .aqhi-data-table td:nth-child(2) {
            min-width: 122px !important;
            white-space: normal !important;
          }

          .aqhi-data-toolbar {
            align-items: stretch !important;
          }

          .aqhi-data-meta {
            align-items: flex-start !important;
          }

          .aqhi-data-pagination {
            width: 100% !important;
            justify-content: space-between !important;
          }
        }
      `;
      document.head.appendChild(styleTag);
    }

    return () => {
      styleTag?.remove();
    };
  }, []);

  const rows = useMemo(
    () =>
      (data || []).map((item) => {
        const properties = item.properties || {};
        return {
          location: item.locationName || item.location || properties.location_name_en || "Unknown",
          aqhi: item.aqhi ?? properties.aqhi ?? null,
          time: item.datetime || item.observation_datetime || properties.observation_datetime || null,
        };
      }),
    [data]
  );

  const filtered = useMemo(
    () => rows.filter((row) => row.location.toLowerCase().includes(search.toLowerCase())),
    [rows, search]
  );

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const startRow = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRow = filtered.length === 0 ? 0 : Math.min(page * pageSize, filtered.length);

  return (
    <div style={styles.container}>
      <div className="aqhi-data-toolbar" style={styles.toolbar}>
        <div style={styles.toolbarGroup}>
          <label htmlFor="aqhi-search" style={styles.searchLabel}>
            Search
          </label>
          <input
            id="aqhi-search"
            type="text"
            placeholder="Type a city or station"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            style={styles.search}
          />
        </div>
        <div className="aqhi-data-meta" style={styles.meta}>
          <div style={styles.metaStrong}>Showing {startRow}-{endRow}</div>
          <div style={styles.metaSubtle}>of {filtered.length} matching records</div>
        </div>
      </div>

      <div className="aqhi-data-table-shell" style={styles.tableShell}>
        <table className="aqhi-data-table" style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Location</th>
              <th style={styles.th}>Observed</th>
              <th style={styles.thCompact}>AQHI</th>
              <th style={styles.thCompact}>Risk</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan="4" style={styles.empty}>
                  No data found for this search.
                </td>
              </tr>
            ) : (
              paginated.map((row, index) => {
                const risk = row.aqhi == null ? null : getRisk(row.aqhi);
                const riskStyle = risk ? RISK_STYLES[risk] : null;
                const rowStyle = index % 2 === 0 ? styles.tr : styles.trAlt;

                return (
                  <tr key={`${row.location}-${row.time}-${index}`} style={rowStyle}>
                    <td style={styles.locationCell}>
                      <div style={styles.locationName}>{row.location}</div>
                    </td>
                    <td style={styles.timeCell}>{formatTime(row.time)}</td>
                    <td style={styles.compactCell}>{row.aqhi ?? "-"}</td>
                    <td style={styles.compactCell}>
                      {risk ? (
                        <span
                          style={{
                            ...styles.badge,
                            background: riskStyle.background,
                            color: riskStyle.color,
                            borderColor: riskStyle.border,
                          }}
                        >
                          {risk}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div style={styles.footer}>
        <div style={styles.pageText}>
          Page {page} of {totalPages}
        </div>
        <div className="aqhi-data-pagination" style={styles.pagination}>
          <button
            style={styles.button}
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <button
            style={styles.button}
            onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 12,
    flexWrap: "wrap",
  },
  toolbarGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    flex: "1 1 280px",
    minWidth: 220,
  },
  searchLabel: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    color: "#64748b",
  },
  search: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(148, 163, 184, 0.28)",
    fontSize: 14,
    width: "100%",
    maxWidth: 360,
    background: "#ffffff",
  },
  meta: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 2,
    fontSize: 13,
    color: "#64748b",
  },
  metaStrong: {
    color: "#0f172a",
    fontWeight: 700,
  },
  metaSubtle: {
    color: "#64748b",
    fontSize: 12,
  },
  tableShell: {
    borderRadius: 18,
    border: "1px solid rgba(148, 163, 184, 0.18)",
    background: "#ffffff",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.05)",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    minWidth: 680,
  },
  th: {
    textAlign: "left",
    padding: "14px 16px",
    fontSize: 12,
    fontWeight: 700,
    color: "#475569",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    borderBottom: "1px solid #e2e8f0",
    background: "#f8fafc",
  },
  thCompact: {
    textAlign: "center",
    padding: "14px 16px",
    fontSize: 12,
    fontWeight: 700,
    color: "#475569",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    borderBottom: "1px solid #e2e8f0",
    background: "#f8fafc",
    width: 130,
  },
  tr: {
    background: "#ffffff",
  },
  trAlt: {
    background: "#fbfdff",
  },
  td: {
    padding: "14px 16px",
    borderBottom: "1px solid #eef2f7",
    fontSize: 14,
    color: "#0f172a",
    verticalAlign: "middle",
  },
  locationCell: {
    padding: "14px 16px",
    borderBottom: "1px solid #eef2f7",
    minWidth: 220,
  },
  locationName: {
    fontSize: 14,
    fontWeight: 600,
    color: "#0f172a",
  },
  compactCell: {
    padding: "14px 16px",
    borderBottom: "1px solid #eef2f7",
    fontSize: 14,
    fontWeight: 600,
    color: "#0f172a",
    textAlign: "center",
    whiteSpace: "nowrap",
  },
  timeCell: {
    padding: "14px 16px",
    borderBottom: "1px solid #eef2f7",
    fontSize: 13,
    color: "#475569",
    whiteSpace: "nowrap",
    minWidth: 170,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    border: "1px solid",
  },
  empty: {
    textAlign: "center",
    padding: 28,
    color: "#64748b",
    fontSize: 14,
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  pageText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: 600,
  },
  pagination: {
    display: "flex",
    gap: 10,
  },
  button: {
    padding: "9px 14px",
    borderRadius: 12,
    border: "1px solid rgba(148, 163, 184, 0.24)",
    background: "#ffffff",
    cursor: "pointer",
    fontSize: 13,
    color: "#0f172a",
  },
};
