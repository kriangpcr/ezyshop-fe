import { API_BASE_URL, fetchWithRefresh } from "../api";

export function getOrders() {
  return fetchWithRefresh(`${API_BASE_URL}/order/get`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });
}

export function createOrder(productId: string, quantity: number) {
  return fetchWithRefresh(`${API_BASE_URL}/order/create`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: productId, quantity }),
  });
}
