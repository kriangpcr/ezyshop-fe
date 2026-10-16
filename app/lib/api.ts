export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

export async function getApiError(response: Response, fallback: string) {
  try {
    const body = await response.json();
    if (typeof body.message === "string") return body.message;
    if (typeof body.error === "string") return body.error;
  } catch {
    // Keep a useful fallback for empty or non-JSON API responses.
  }
  return fallback;
}

let refreshRequest: Promise<boolean> | null = null;

async function refreshSession() {
  if (!refreshRequest) {
    refreshRequest = fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshRequest = null;
      });
  }
  return refreshRequest;
}

export async function fetchWithRefresh(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const response = await fetch(input, init);
  const requestUrl =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;

  if (
    response.status !== 401 ||
    /\/auth\/(login|register|refresh)(\?|$)/.test(requestUrl)
  ) {
    return response;
  }
  if (!(await refreshSession())) return response;
  return fetch(input, init);
}
