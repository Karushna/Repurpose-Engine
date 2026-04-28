import { NextRequest } from "next/server";

export function getCurrentUserId(req: NextRequest) {
  void req;
  // TODO: Replace this with the real logged-in user from Firebase Auth,
  // NextAuth, Clerk, or your chosen application auth session.
  // The Buffer OAuth/storage code is already user-scoped; this placeholder
  // keeps local development working until app auth is added.
  if (process.env.REPURPOSE_ENGINE_USER_ID) {
    return process.env.REPURPOSE_ENGINE_USER_ID;
  }

  if (process.env.NODE_ENV !== "production") {
    return "local-dev-user";
  }

  return null;
}
