import client from "./client";

export async function fetchEndpoints(params = {}) {
  const response = await client.get("/endpoints", { params });
  return response.data;
}

export async function fetchEndpoint(endpointId) {
  if (!endpointId) {
    return null;
  }
  const response = await client.get(`/endpoints/${endpointId}`);
  return response.data;
}
