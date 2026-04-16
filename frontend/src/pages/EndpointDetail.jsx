import { fetchEndpoint } from "../api/endpoints";
import { fetchMetrics } from "../api/metrics";
import LogTable from "../components/LogTable";
import MetricsChart from "../components/MetricsChart";
import StatusBadge from "../components/StatusBadge";
import useAsync from "../hooks/useAsync";

export default function EndpointDetail({ endpointId }) {
  const endpointState = useAsync(() => fetchEndpoint(endpointId), [endpointId]);
  const metricsState = useAsync(
    () => (endpointId ? fetchMetrics({ endpoint_id: endpointId, limit: 10 }) : Promise.resolve([])),
    [endpointId],
  );

  if (!endpointId) {
    return <div className="empty-state">Pick an endpoint from the dashboard to inspect its metrics.</div>;
  }

  const endpoint = endpointState.data;
  const metrics = metricsState.data || [];
  const latestMetric = metrics[0];

  return (
    <div className="stack">
      {endpoint ? (
        <div className="page-header">
          <div>
            <p className="eyebrow">{endpoint.method}</p>
            <h1>{endpoint.name}</h1>
            <p className="muted-text">{endpoint.url}</p>
          </div>
          <StatusBadge isHealthy={latestMetric?.is_success ?? endpoint.is_active} />
        </div>
      ) : (
        <p className="muted-text">Loading endpoint details...</p>
      )}
      <MetricsChart metrics={metrics} />
      <LogTable rows={metrics} />
    </div>
  );
}
