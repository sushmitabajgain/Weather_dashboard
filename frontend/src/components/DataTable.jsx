// components/DataTable.jsx
export default function DataTable({ data }) {
  return (
    <table border="1" width="100%">
      <thead>
        <tr>
          <th>Location</th>
          <th>AQHI</th>
          <th>Category</th>
        </tr>
      </thead>
      <tbody>
        {data.slice(0, 10).map((row, i) => (
          <tr key={i}>
            <td>{row.locationName}</td>
            <td>{row.aqhi}</td>
            <td>{row.category}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}