"use client";

import dynamic from "next/dynamic";

const AuthPage = dynamic(
  () => import("@/components/agent/AuthPage").then((m) => ({ default: m.AuthPage })),
  { ssr: false }
);

export default async function AgentAuthRoute({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; returnTo?: string; type?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthPage
      errorParam={params.error}
      returnTo={params.returnTo}
      recoveryMode={params.type === "recovery"}
    />
  );
}
