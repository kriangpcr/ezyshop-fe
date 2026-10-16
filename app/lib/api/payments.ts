import { API_BASE_URL, fetchWithRefresh } from "../api";

export function depositWithAngpao(voucherCode: string) {
  return fetchWithRefresh(`${API_BASE_URL}/payment/deposit`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ voucherCode }),
  });
}
