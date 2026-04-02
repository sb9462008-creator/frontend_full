const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const AUTH_STORAGE_KEY = "hurgelt_auth";

type ApiOptions = RequestInit & {
  token?: string;
};

function readStoredTenantId() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as {
      user?: {
        tenantId?: string | null;
      } | null;
    };

    return parsed.user?.tenantId ?? null;
  } catch {
    return null;
  }
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  try {
    const headers = new Headers(options.headers);

    if (!(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    if (options.token) {
      headers.set("Authorization", `Bearer ${options.token}`);
    }

    if (!headers.has("x-tenant-id")) {
      const tenantId = readStoredTenantId();

      if (tenantId) {
        headers.set("x-tenant-id", tenantId);
      }
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.message ?? "Request failed");
    }

    return data as T;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`Cannot reach the backend at ${API_URL}. Start the backend server and try again.`);
    }

    throw error;
  }
}

export { API_URL };
