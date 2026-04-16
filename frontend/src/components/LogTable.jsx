export default function LogTable({ rows }) {
  if (!rows?.length) {
    return <div className="empty-state">No recent metrics found.</div>;
  }

  return (
    <div className="surface-card table-shell">
      <table>
        <thead>
          <tr>
            <th>Checked</th>
            <th>Status</th>
            <th>Success</th>
            <th>Response Time</th>
            <th>Error</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{new Date(row.checked_at).toLocaleString()}</td>
              <td>{row.status_code ?? "--"}</td>
              <td>{row.is_success ? "Yes" : "No"}</td>
              <td>{row.response_time_ms ? `${row.response_time_ms.toFixed(1)} ms` : "--"}</td>
              <td>{row.error_message || "--"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
