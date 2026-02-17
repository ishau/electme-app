import { cookies } from "next/headers";
import { NextResponse } from "next/server";

interface JWTPayload {
  group_id: string;
  team_member_id: string;
  username: string;
  role: string;
  exp: number;
}

function decodeJWT(token: string): JWTPayload | null {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    return null;
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const payload = decodeJWT(token);
  if (!payload || payload.exp * 1000 < Date.now()) {
    // Clear expired cookie
    cookieStore.set("session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  return NextResponse.json({
    group_id: payload.group_id,
    team_member_id: payload.team_member_id,
    username: payload.username,
    role: payload.role,
  });
}
