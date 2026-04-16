export default function MetricsChart({ metrics }) {
  if (!metrics?.length) {
    return <div className="empty-state">No metric history yet.</div>;
  }

  const highest = Math.max(...metrics.map((metric) => metric.response_time_ms || 0), 1);

  return (
    <div className="surface-card">
      <p className="eyebrow">Response Time Trend</p>
      <div className="mini-chart">
        {metrics.slice(0, 12).reverse().map((metric) => (
          <div
            key={metric.id}
            className="mini-chart-bar"
            style={{
              height: `${Math.max(((metric.response_time_ms || 0) / highest) * 120, 16)}px`,
            }}
            title={`${metric.response_time_ms?.toFixed(1) || 0} ms`}
          />
        ))}
      </div>
    </div>
  );
}
