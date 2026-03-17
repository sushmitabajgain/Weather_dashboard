import { useState, useMemo, useEffect } from "react";

function getRisk(aqhi) {
  if (aqhi <= 3) return "Low";
  if (aqhi <= 6) return "Moderate";
  if (aqhi <= 10) return "High";
  return "Very High";
}

function getColor(aqhi) {
  if (aqhi <= 3) return "#2ecc71";
  if (aqhi <= 6) return "#f1c40f";
  if (aqhi <= 10) return "#e67e22";
  return "#e74c3c";
}

function formatTime(date) {
  if (!date) return "-";
  return new Date(date).toLocaleString();
}

export default function DataTable({ data }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    return (data || []).map(item => {
      const p = item.properties || {};
      return {
        location:
          item.locationName ||
          item.location ||
          p.location_name_en ||
          "Unknown",
        aqhi:
          item.aqhi ??
          p.aqhi ??
          null,
        time:
          item.datetime ||
          item.observation_datetime ||
          p.observation_datetime ||
          null
      };
    });
  }, [data]);

  const filtered = useMemo(() => {
    return rows.filter(r =>
      (r.location || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [rows, search]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginated = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <input
          type="text"
          placeholder="Search location..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={styles.search}
        />
        <span style={styles.count}>
          Showing {paginated.length} of {filtered.length}
        </span>
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead style={styles.thead}>
            <tr>
              <th style={styles.th}>Location</th>
              <th style={styles.th}>AQHI</th>
              <th style={styles.th}>Risk</th>
              <th style={styles.th}>Date & Time</th>
            </tr>
          </thead>

          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan="4" style={styles.empty}>
                  No data found
                </td>
              </tr>
            ) : (
              paginated.map((row, i) => (
                <tr
                  key={`${row.location}-${row.time}-${i}`}
                  style={{
                    ...styles.tr,
                    ...(i % 2 ? styles.altRow : {})
                  }}
                >
                  <td style={styles.td}>{row.location}</td>

                  <td style={{ ...styles.td, ...styles.bold }}>
                    {row.aqhi ?? "-"}
                  </td>

                  <td style={styles.td}>
                    {row.aqhi == null ? "-" : (
                      <span
                        style={{
                          ...styles.badge,
                          background: getColor(row.aqhi)
                        }}
                      >
                        {getRisk(row.aqhi)}
                      </span>
                    )}
                  </td>

                  <td style={styles.tdSmall}>
                    {formatTime(row.time)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={styles.pagination}>
        <button
          style={styles.button}
          onClick={() => setPage(p => Math.max(p - 1, 1))}
          disabled={page === 1}
        >
          Prev
        </button>

        <span style={styles.pageText}>
          Page {page} / {totalPages}
        </span>

        <button
          style={styles.button}
          onClick={() => setPage(p => Math.min(p + 1, totalPages))}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 14
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12
  },

  search: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #dcdfe6",
    fontSize: 14,
    width: "240px"
  },

  count: {
    fontSize: 13,
    color: "#555"
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
    borderRadius: 14,
    border: "1px solid #e6ecf2",
    background: "#fff",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 600
  },

  thead: {
    position: "sticky",
    top: 0,
    background: "#f4f7fb",
    zIndex: 1
  },

  th: {
    textAlign: "left",
    padding: "12px 14px",
    fontSize: 13,
    fontWeight: 700,
    color: "#444",
    borderBottom: "1px solid #e6ecf2"
  },

  td: {
    padding: "12px 14px",
    fontSize: 14,
    borderBottom: "1px solid #f0f3f7"
  },

  tdSmall: {
    padding: "12px 14px",
    fontSize: 13,
    color: "#666",
    borderBottom: "1px solid #f0f3f7"
  },

  bold: {
    fontWeight: 700,
    fontSize: 15
  },

  tr: {
    transition: "0.15s"
  },

  altRow: {
    background: "#fafcff"
  },

  badge: {
    padding: "4px 10px",
    borderRadius: 8,
    color: "#fff",
    fontSize: 12,
    fontWeight: 600
  },

  empty: {
    textAlign: "center",
    padding: 24,
    color: "#888",
    fontSize: 14
  },

  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
    flexWrap: "wrap"
  },

  button: {
    padding: "8px 14px",
    borderRadius: 10,
    border: "1px solid #d0d7e2",
    background: "#fff",
    cursor: "pointer",
    fontSize: 13
  },

  pageText: {
    fontSize: 13,
    color: "#444",
    fontWeight: 500
  }
};
