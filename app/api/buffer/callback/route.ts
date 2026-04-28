import { NextRequest, NextResponse } from "next/server";
import {
  exchangeBufferAuthorizationCode,
  saveBufferConnection,
} from "@/lib/buffer";
import { getCurrentUserId, redirectToLogin } from "@/lib/auth";

const STATE_COOKIE = "buffer_oauth_state";
const VERIFIER_COOKIE = "buffer_oauth_code_verifier";

function redirectToApp(req: NextRequest, params: Record<string, string>) {
  const url = new URL("/app", req.nextUrl.origin);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = NextResponse.redirect(url);
  response.cookies.delete(STATE_COOKIE);
  response.cookies.delete(VERIFIER_COOKIE);
  return response;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getCurrentUserId(req);

    if (!userId) {
      const response = redirectToLogin(req, "/api/buffer/connect");
      response.cookies.delete(STATE_COOKIE);
      response.cookies.delete(VERIFIER_COOKIE);
      return response;
    }

    const returnedState = req.nextUrl.searchParams.get("state");
    const expectedState = req.cookies.get(STATE_COOKIE)?.value;
    const codeVerifier = req.cookies.get(VERIFIER_COOKIE)?.value;
    const error = req.nextUrl.searchParams.get("error");

    if (!returnedState || !expectedState || returnedState !== expectedState) {
      return redirectToApp(req, {
        buffer: "error",
        message: "Invalid Buffer OAuth state",
      });
    }

    if (error) {
      return redirectToApp(req, {
        buffer: "error",
        message: `Buffer authorization failed: ${error}`,
      });
    }

    const code = req.nextUrl.searchParams.get("code");

    if (!code || !codeVerifier) {
      return redirectToApp(req, {
        buffer: "error",
        message: "Missing Buffer authorization code",
      });
    }

    const tokens = await exchangeBufferAuthorizationCode(code, codeVerifier);
    await saveBufferConnection(userId, tokens);

    return redirectToApp(req, { buffer_connected: "true" });
  } catch (error) {
    console.error("Buffer callback route error:", error);

    return redirectToApp(req, {
      buffer: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to complete Buffer OAuth",
    });
  }
}
