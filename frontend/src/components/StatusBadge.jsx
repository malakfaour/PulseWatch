import AlertBadge from "./AlertBadge";

export default function StatusBadge({ isHealthy }) {
  return (
    <AlertBadge
      status={isHealthy ? "healthy" : "danger"}
      label={isHealthy ? "Healthy" : "Unhealthy"}
    />
  );
}
