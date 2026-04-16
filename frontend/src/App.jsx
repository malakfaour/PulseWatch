import { useMemo, useState } from "react";

import { registerUser, loginUser } from "./api/auth";
import Dashboard from "./components/Dashboard";
import AlertBadge from "./components/AlertBadge";
import Home from "./pages/Home";
import AlertsPage from "./pages/Alerts";
import EndpointDetail from "./pages/EndpointDetail";
import Settings from "./pages/Settings";
import useAuth from "./hooks/useAuth";

const NAV_ITEMS = [
  { key: "home", label: "Dashboard" },
  { key: "endpoints", label: "Endpoints" },
  { key: "alerts", label: "Alerts" },
  { key: "settings", label: "Settings" },
];

function AuthPanel({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "register") {
        await registerUser({ email, password });
      }
      const result = await loginUser({ email, password });
      onAuthenticated(result.access_token);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.detail || "Authentication request failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">PulseWatch</p>
        <h1>Monitor endpoints with a clean operations dashboard.</h1>
        <p className="auth-copy">
          Sign in to review endpoint health, active alerts, and recent metrics.
        </p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error ? <p className="error-text">{error}</p> : null}
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Working..." : mode === "login" ? "Log In" : "Create Account"}
          </button>
        </form>
        <button
          className="ghost-button"
          type="button"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login"
            ? "Need an account? Register"
            : "Already registered? Log in"}
        </button>
      </div>
    </div>
  );
}

function AppShell({ token, onLogout }) {
  const [activePage, setActivePage] = useState("home");
  const [selectedEndpointId, setSelectedEndpointId] = useState(null);

  const pages = useMemo(
    () => ({
      home: <Home onOpenEndpoint={(endpointId) => {
        setSelectedEndpointId(endpointId);
        setActivePage("endpoints");
      }} />,
      endpoints: <EndpointDetail endpointId={selectedEndpointId} />,
      alerts: <AlertsPage />,
      settings: <Settings token={token} onLogout={onLogout} />,
    }),
    [onLogout, selectedEndpointId, token],
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">PulseWatch</p>
          <h2>Ops Center</h2>
        </div>
        <nav className="nav-list">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={item.key === activePage ? "nav-item active" : "nav-item"}
              type="button"
              onClick={() => setActivePage(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <AlertBadge status="secured" label="JWT Protected" />
        </div>
      </aside>
      <main className="main-panel">
        <header className="topbar">
          <Dashboard compact />
          <button className="ghost-button" type="button" onClick={onLogout}>
            Log Out
          </button>
        </header>
        <section className="page-panel">{pages[activePage]}</section>
      </main>
    </div>
  );
}

export default function App() {
  const { token, setToken, clearToken } = useAuth();

  if (!token) {
    return <AuthPanel onAuthenticated={setToken} />;
  }

  return <AppShell token={token} onLogout={clearToken} />;
}
