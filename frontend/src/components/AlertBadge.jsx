export default function AlertBadge({ status, label }) {
  const variant =
    status === "healthy" || status === "secured"
      ? "healthy"
      : status === "warning"
        ? "warning"
        : "danger";

  return <span className={`badge ${variant}`}>{label}</span>;
}
