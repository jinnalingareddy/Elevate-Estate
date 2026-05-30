import type { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Portal de Agentes — EstateElevate",
  description: "Inicia sesión o regístrate para gestionar tus propiedades en EstateElevate.",
};

const AuthPage = dynamic(
  () => import("@/components/agent/AuthPage").then((m) => ({ default: m.AuthPage })),
  { ssr: false }
);

export default function AgentAuthRoute({
  searchParams,
}: {
  searchParams: { error?: string; returnTo?: string; type?: string };
}) {
  return (
    <AuthPage
      errorParam={searchParams.error}
      returnTo={searchParams.returnTo}
      recoveryMode={searchParams.type === "recovery"}
    />
  );
}
