import { AuthPageClient } from "@/components/agent/AuthPageClient";

export default async function AgentAuthRoute({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; returnTo?: string; type?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthPageClient
      errorParam={params.error}
      returnTo={params.returnTo}
      recoveryMode={params.type === "recovery"}
    />
  );
}
