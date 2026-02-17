export interface AuthUser {
  group_id: string;
  team_member_id: string;
  username: string;
  role: string;
}

export async function login(username: string, password: string): Promise<AuthUser> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    let message = "Login failed";
    try {
      const body = await response.json();
      message = body.error || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return response.json();
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/login";
}

export async function fetchUser(): Promise<AuthUser | null> {
  try {
    const response = await fetch("/api/auth/me");
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}
