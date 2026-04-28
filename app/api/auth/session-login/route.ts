import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getSessionCookieOptions,
  SESSION_COOKIE_MAX_AGE_MS,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";
import { getAdminAuth } from "@/lib/firebase-admin";

const requestSchema = z.object({
  idToken: z.string().min(1, "idToken is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "Invalid request",
        },
        { status: 400 }
      );
    }

    await getAdminAuth().verifyIdToken(parsed.data.idToken, true);
    const sessionCookie = await getAdminAuth().createSessionCookie(
      parsed.data.idToken,
      {
        expiresIn: SESSION_COOKIE_MAX_AGE_MS,
      }
    );

    const response = NextResponse.json({ success: true });
    response.cookies.set(
      SESSION_COOKIE_NAME,
      sessionCookie,
      getSessionCookieOptions(req)
    );

    return response;
  } catch (error) {
    console.error("Session login route error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create session",
      },
      { status: 401 }
    );
  }
}
