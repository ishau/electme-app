export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public details?: string
  ) {
    super(`${status}: ${statusText}${details ? ` - ${details}` : ""}`);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new ApiError(401, "Unauthorized");
  }
  if (!response.ok) {
    let details: string | undefined;
    try {
      const body = await response.json();
      details = body.error || body.details;
    } catch {
      // ignore parse errors
    }
    throw new ApiError(response.status, response.statusText, details);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

export async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  let url = `/api/backend${path}`;
  if (params) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) search.set(key, value);
    });
    const qs = search.toString();
    if (qs) url += `?${qs}`;
  }
  const response = await fetch(url);
  return handleResponse<T>(response);
}

export async function post<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api/backend${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(response);
}

export async function put<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api/backend${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(response);
}

export async function del<T>(path: string): Promise<T> {
  const response = await fetch(`/api/backend${path}`, {
    method: "DELETE",
  });
  return handleResponse<T>(response);
}
