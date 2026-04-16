import client from "./client";

export async function registerUser(payload) {
  const response = await client.post("/auth/register", payload);
  return response.data;
}

export async function loginUser(payload) {
  const response = await client.post("/auth/login", payload);
  return response.data;
}
