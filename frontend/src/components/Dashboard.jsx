import { fetchDashboardSummary } from "../api/metrics";
import useAsync from "../hooks/useAsync";

const LABELS = [
  ["total_endpoints", "Total Endpoints"],
  ["healthy_endpoints", "Healthy"],
  ["unhealthy_endpoints", "Unhealthy"],
  ["active_alerts", "Active Alerts"],
  ["avg_response_time", "Avg Response (ms)"],
];

export default function Dashboard({ compact = false }) {
  const { data, loading } = useAsync(() => fetchDashboardSummary(), []);

  if (loading && !data) {
    return <p className="muted-text">Loading dashboard summary...</p>;
  }

  if (!data) {
    return <p className="muted-text">No summary available.</p>;
  }

  return (
    <div className={compact ? "summary-grid" : "stats-grid"}>
      {LABELS.map(([key, label]) => (
        <article key={key} className="summary-card">
          <p className="eyebrow">{label}</p>
          <div className="metric-value">
            {key === "avg_response_time" && data[key] !== null
              ? Number(data[key]).toFixed(1)
              : data[key] ?? "--"}
          </div>
        </article>
      ))}
    </div>
  );
}
