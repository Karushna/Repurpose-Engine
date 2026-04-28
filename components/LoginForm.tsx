"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  getFirebaseAuth,
  getMissingFirebaseClientEnvVars,
  hasFirebaseClientConfig,
} from "@/lib/firebase";

type Props = {
  returnTo: string;
  isAuthRequired: boolean;
};

type AuthMode = "signin" | "signup";

function safeReturnTo(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/app";
  }

  return value;
}

export default function LoginForm({ returnTo, isAuthRequired }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const destination = safeReturnTo(returnTo);
  const missingFirebaseEnvVars = useMemo(
    () => getMissingFirebaseClientEnvVars(),
    []
  );
  const isFirebaseConfigured = useMemo(() => hasFirebaseClientConfig(), []);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsCheckingSession(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (user) => {
      setIsCheckingSession(false);

      if (!user) {
        return;
      }

      try {
        const idToken = await user.getIdToken();
        await createServerSession(idToken);
      } catch (sessionError) {
        console.error(sessionError);
      }
    });

    return unsubscribe;
  }, [isFirebaseConfigured]);

  async function createServerSession(idToken: string) {
    const res = await fetch("/api/auth/session-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    });

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to create session");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const auth = getFirebaseAuth();
      const credential =
        mode === "signin"
          ? await signInWithEmailAndPassword(auth, email, password)
          : await createUserWithEmailAndPassword(auth, email, password);

      const idToken = await credential.user.getIdToken();
      await createServerSession(idToken);
      router.push(destination);
      router.refresh();
    } catch (authError) {
      console.error(authError);
      setError(
        authError instanceof Error
          ? authError.message
          : "Failed to sign in"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-xl rounded-2xl border bg-white p-8 shadow-sm">
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-500">
          {isAuthRequired ? "Sign in required" : "Firebase Auth"}
        </p>
        <h1 className="text-3xl font-bold">
          {mode === "signin" ? "Log in to continue" : "Create your account"}
        </h1>
        <p className="text-gray-600">
          Use your Repurpose Engine account to connect Buffer and keep tokens
          scoped to your Firebase user.
        </p>
      </div>

      <div className="mt-6 flex rounded-xl border p-1">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
            mode === "signin" ? "bg-black text-white" : "text-gray-700"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
            mode === "signup" ? "bg-black text-white" : "text-gray-700"
          }`}
        >
          Sign up
        </button>
      </div>

      {!isFirebaseConfigured && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-medium">Firebase client auth is missing.</p>
          <p className="mt-2">
            Add these values to `.env.local`, then restart `npm run dev`:
          </p>
          <ul className="mt-2 list-inside list-disc">
            {missingFirebaseEnvVars.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border p-3 outline-none"
            autoComplete="email"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border p-3 outline-none"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            minLength={6}
            required
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || isCheckingSession || !isFirebaseConfigured}
          className="w-full rounded-lg bg-black px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {isLoading
            ? "Working..."
            : mode === "signin"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>
    </section>
  );
}
