import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  getBufferOAuthEnv,
  getBufferOAuthScopes,
} from "@/lib/buffer";
import { getCurrentUserId } from "@/lib/auth";

const STATE_COOKIE = "buffer_oauth_state";
const VERIFIER_COOKIE = "buffer_oauth_code_verifier";

function base64Url(bytes: Buffer) {
  return bytes
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function cookieOptions(req: NextRequest) {
  return {
    httpOnly: true,
    secure: req.nextUrl.protocol === "https:" || process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 10 * 60,
  };
}

export async function GET(req: NextRequest) {
  try {
    const userId = getCurrentUserId(req);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "You must be logged in to connect Buffer" },
        { status: 401 }
      );
    }

    const env = getBufferOAuthEnv();
    const state = base64Url(crypto.randomBytes(32));
    const codeVerifier = base64Url(crypto.randomBytes(64));
    const codeChallenge = base64Url(
      crypto.createHash("sha256").update(codeVerifier).digest()
    );

    const authUrl = new URL(env.authUrl);
    authUrl.searchParams.set("client_id", env.clientId);
    authUrl.searchParams.set("redirect_uri", env.redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", getBufferOAuthScopes());
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("code_challenge", codeChallenge);
    authUrl.searchParams.set("code_challenge_method", "S256");
    authUrl.searchParams.set("prompt", "consent");

    const response = NextResponse.redirect(authUrl);
    response.cookies.set(STATE_COOKIE, state, cookieOptions(req));
    response.cookies.set(VERIFIER_COOKIE, codeVerifier, cookieOptions(req));

    return response;
  } catch (error) {
    console.error("Buffer connect route error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to start Buffer OAuth",
      },
      { status: 500 }
    );
  }
}
