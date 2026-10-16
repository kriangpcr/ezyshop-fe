import { API_BASE_URL, fetchWithRefresh } from "../api";

export function getCurrentUser() {
  return fetchWithRefresh(`${API_BASE_URL}/user/me`, {
    method: "GET",
    credentials: "include",
  });
}
