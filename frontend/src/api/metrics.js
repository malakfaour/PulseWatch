import client from "./client";

export async function fetchMetrics(params = {}) {
  const response = await client.get("/metrics", { params });
  return response.data;
}

export async function fetchDashboardSummary() {
  const response = await client.get("/dashboard");
  return response.data;
}

export async function fetchAlerts(params = {}) {
  const response = await client.get("/alerts", { params });
  return response.data;
}
