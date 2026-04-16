import { fetchAlerts } from "../api/metrics";
import AlertBadge from "../components/AlertBadge";
import useAsync from "../hooks/useAsync";

export default function AlertsPage() {
  const activeState = useAsync(() => fetchAlerts({ status_filter: "active", limit: 10 }), []);
  const resolvedState = useAsync(() => fetchAlerts({ status_filter: "resolved", limit: 10 }), []);

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Alerts</p>
          <h1>Rules and incident state</h1>
        </div>
      </div>
      <section className="alerts-grid">
        <article className="surface-card">
          <div className="page-header">
            <div>
              <p className="eyebrow">Active</p>
              <h2>Unresolved alerts</h2>
            </div>
            <AlertBadge status="danger" label={`${activeState.data?.length || 0} open`} />
          </div>
          {(activeState.data || []).length ? (
            <div className="stack">
              {activeState.data.map((alert) => (
                <div key={alert.id}>
                  <strong>{alert.type}</strong>
                  <p className="muted-text">
                    {alert.comparison} {alert.threshold}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No active alerts.</div>
          )}
        </article>
        <article className="surface-card">
          <div className="page-header">
            <div>
              <p className="eyebrow">Resolved</p>
              <h2>Recently recovered</h2>
            </div>
            <AlertBadge status="healthy" label={`${resolvedState.data?.length || 0} resolved`} />
          </div>
          {(resolvedState.data || []).length ? (
            <div className="stack">
              {resolvedState.data.map((alert) => (
                <div key={alert.id}>
                  <strong>{alert.type}</strong>
                  <p className="muted-text">
                    Resolved {alert.resolved_at ? new Date(alert.resolved_at).toLocaleString() : ""}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No resolved alerts yet.</div>
          )}
        </article>
      </section>
    </div>
  );
}
