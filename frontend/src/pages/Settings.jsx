export default function Settings({ token, onLogout }) {
  return (
    <div className="settings-panel">
      <div className="page-header">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>Workspace Controls</h1>
        </div>
      </div>
      <article className="surface-card">
        <p className="eyebrow">API Token</p>
        <p className="muted-text">
          Your current JWT is stored in local storage so Axios can send it with each request.
        </p>
        <textarea readOnly rows={6} value={token} />
      </article>
      <button className="primary-button" type="button" onClick={onLogout}>
        Clear Session
      </button>
    </div>
  );
}
