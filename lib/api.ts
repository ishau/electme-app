function getApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) throw new Error("NEXT_PUBLIC_API_URL is not set in environment variables");
  return url;
}

export function getGroupId(): string {
  const id = process.env.NEXT_PUBLIC_GROUP_ID;
  if (!id) throw new Error("NEXT_PUBLIC_GROUP_ID is not set in environment variables");
  return id;
}

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
  const API_URL = getApiUrl();
  let url = `${API_URL}${path}`;
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
  const API_URL = getApiUrl();
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(response);
}

export async function put<T>(path: string, body?: unknown): Promise<T> {
  const API_URL = getApiUrl();
  const response = await fetch(`${API_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(response);
}

export async function del<T>(path: string): Promise<T> {
  const API_URL = getApiUrl();
  const response = await fetch(`${API_URL}${path}`, {
    method: "DELETE",
  });
  return handleResponse<T>(response);
}
