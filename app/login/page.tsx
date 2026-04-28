import Link from "next/link";

type LoginPageProps = {
  searchParams: Promise<{
    returnTo?: string;
    reason?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const returnTo = params.returnTo || "/app";
  const isAuthRequired = params.reason === "auth_required";

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16 text-gray-900">
      <section className="mx-auto max-w-xl rounded-2xl border bg-white p-8 shadow-sm">
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-500">Sign in required</p>
          <h1 className="text-3xl font-bold">Log in to continue</h1>
          <p className="text-gray-600">
            {isAuthRequired
              ? "Connect Buffer requires an authenticated Repurpose Engine user."
              : "Please log in before continuing."}
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Application authentication has not been configured yet. Local
          development uses a development-only fallback user in `next dev`, but
          production needs Firebase Auth, NextAuth, Clerk, or another session
          provider wired into `lib/auth.ts`.
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/app"
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Back to app
          </Link>
          <Link
            href={returnTo}
            className="rounded-lg border px-4 py-2 text-sm font-medium"
          >
            Try again
          </Link>
        </div>
      </section>
    </main>
  );
}
