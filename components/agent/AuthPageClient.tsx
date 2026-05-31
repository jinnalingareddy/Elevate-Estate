"use client";

import dynamic from "next/dynamic";

const AuthPage = dynamic(
  () => import("@/components/agent/AuthPage").then((m) => ({ default: m.AuthPage })),
  { ssr: false }
);

export function AuthPageClient({
  errorParam,
  returnTo,
  recoveryMode,
}: {
  errorParam?: string;
  returnTo?: string;
  recoveryMode: boolean;
}) {
  return (
    <AuthPage errorParam={errorParam} returnTo={returnTo} recoveryMode={recoveryMode} />
  );
}
