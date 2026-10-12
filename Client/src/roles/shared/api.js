import { API_BASE } from "./config.js";

export async function apiRequest(path, options) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, options);
  } catch {
    throw new Error(`Cannot reach the API at ${API_BASE}. Make sure the server is running.`);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || `API request failed (${response.status}).`);
  }
  return data;
}
