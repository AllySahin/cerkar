import { cookies } from "next/headers";
import { createHash } from "crypto";

const SALT = "cerkar_secret";
const COOKIE_NAME = "cerkar_session";

export async function hashPassword(password: string): Promise<string> {
  const hash = createHash("sha256").update(`${password}:${SALT}`).digest("hex");
  return hash;
}

export async function setSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 gün
  });
}

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function getSessionFromRequest(
  requestCookies: { get: (name: string) => { value: string } | undefined }
): string | null {
  return requestCookies.get(COOKIE_NAME)?.value ?? null;
}
