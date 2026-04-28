import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";

export const SESSION_COOKIE_NAME = "__session";
export const SESSION_COOKIE_MAX_AGE_MS = 5 * 24 * 60 * 60 * 1000;

export type CurrentUser = {
  userId: string;
  email?: string;
};

export function getSessionCookieOptions(req?: NextRequest) {
  return {
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production" ||
      req?.nextUrl.protocol === "https:",
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(SESSION_COOKIE_MAX_AGE_MS / 1000),
  };
}

export async function getCurrentUser(req: NextRequest): Promise<CurrentUser | null> {
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const decoded = await getAdminAuth().verifySessionCookie(
      sessionCookie,
      true
    );

    return {
      userId: decoded.uid,
      email: decoded.email,
    };
  } catch (error) {
    console.warn("Failed to verify Firebase session cookie:", error);
    return null;
  }
}

export async function getCurrentUserId(req: NextRequest) {
  const user = await getCurrentUser(req);
  return user?.userId ?? null;
}

export function redirectToLogin(req: NextRequest, returnTo: string) {
  const loginUrl = new URL("/login", req.nextUrl.origin);
  loginUrl.searchParams.set("returnTo", returnTo);
  loginUrl.searchParams.set("reason", "auth_required");

  return NextResponse.redirect(loginUrl);
}
