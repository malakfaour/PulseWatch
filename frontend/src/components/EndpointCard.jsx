import AlertBadge from "./AlertBadge";

export default function EndpointCard({ endpoint, onOpen }) {
  return (
    <article className="surface-card">
      <div className="page-header">
        <div>
          <p className="eyebrow">{endpoint.method}</p>
          <h3>{endpoint.name}</h3>
        </div>
        <AlertBadge
          status={endpoint.is_active ? "healthy" : "warning"}
          label={endpoint.is_active ? "Enabled" : "Disabled"}
        />
      </div>
      <p className="muted-text">{endpoint.url}</p>
      <div className="chip-row">
        <span className="badge warning">{endpoint.check_interval}s interval</span>
      </div>
      <div style={{ marginTop: 16 }}>
        <button className="ghost-button" type="button" onClick={() => onOpen(endpoint.id)}>
          Open Details
        </button>
      </div>
    </article>
  );
}
