import { API_BASE_URL, fetchWithRefresh } from "../api";
import type { NewProductPayload } from "../../types";

export function getProducts(page: number, size = 10) {
  return fetchWithRefresh(
    `${API_BASE_URL}/product/get?page=${page}&size=${size}`,
    { method: "GET", credentials: "include" },
  );
}

export function createProduct(data: NewProductPayload) {
  const form = new FormData();
  form.append("title", data.title);
  form.append("description", data.description);
  form.append("price", String(data.price));
  form.append("category", data.category);
  form.append("image", data.image);

  return fetchWithRefresh(`${API_BASE_URL}/product/create`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
}

export function restockProduct(productId: string, items: string[]) {
  return fetchWithRefresh(`${API_BASE_URL}/product/items/create`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: productId, data: items }),
  });
}
