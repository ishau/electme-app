import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080/api/v1";

export async function POST(request: Request) {
  const body = await request.json();

  const res = await fetch(`${BACKEND_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Login failed" }));
    return NextResponse.json(error, { status: res.status });
  }

  const data = await res.json();
  const token: string = data.Token;
  const expiresAt = new Date(data.ExpiresAt);
  const maxAge = Math.floor((expiresAt.getTime() - Date.now()) / 1000);

  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });

  return NextResponse.json({
    group_id: data.GroupID,
    role: data.Role,
    username: body.username,
    expires_at: data.ExpiresAt,
  });
}
