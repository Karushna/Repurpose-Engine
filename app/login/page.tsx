import LoginForm from "@/components/LoginForm";

type LoginPageProps = {
  searchParams: Promise<{
    returnTo?: string;
    reason?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16 text-gray-900">
      <LoginForm
        returnTo={params.returnTo || "/app"}
        isAuthRequired={params.reason === "auth_required"}
      />
    </main>
  );
}
