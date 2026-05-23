import type { Metadata } from "next";
import { AuthPage } from "@/components/agent/AuthPage";

export const metadata: Metadata = {
  title: "Portal de Agentes — EstateElevate",
  description: "Inicia sesión o regístrate para gestionar tus propiedades en EstateElevate.",
};

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
