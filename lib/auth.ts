import { NextRequest } from "next/server";

export function getCurrentUserId(req: NextRequest) {
  void req;
  // TODO: Replace this with the real logged-in user from Firebase Auth,
  // NextAuth, Clerk, or your chosen application auth session.
  // The Buffer OAuth/storage code is already user-scoped. This fallback is
  // intentionally restricted to `next dev` local testing only.
  if (process.env.NODE_ENV === "development") {
    return process.env.REPURPOSE_ENGINE_USER_ID || "local-dev-user";
  }

  return null;
}
