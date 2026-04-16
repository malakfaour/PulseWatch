import { fetchEndpoints } from "../api/endpoints";
import Dashboard from "../components/Dashboard";
import EndpointCard from "../components/EndpointCard";
import useAsync from "../hooks/useAsync";

export default function Home({ onOpenEndpoint }) {
  const { data: endpoints, loading } = useAsync(() => fetchEndpoints({ limit: 6 }), []);

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>System Health Snapshot</h1>
        </div>
      </div>
      <Dashboard />
      <section>
        <div className="page-header">
          <div>
            <p className="eyebrow">Endpoints</p>
            <h2>Recently monitored services</h2>
          </div>
        </div>
        {loading ? (
          <p className="muted-text">Loading endpoints...</p>
        ) : (
          <div className="endpoint-grid">
            {endpoints?.map((endpoint) => (
              <EndpointCard key={endpoint.id} endpoint={endpoint} onOpen={onOpenEndpoint} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
