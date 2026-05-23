import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AgentSidebar } from "@/components/layout/AgentSidebar";
import { SupportPageShell } from "@/components/agent/SupportPageShell";

export const metadata: Metadata = {
  title: "Soporte — EstateElevate",
};

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const supabase = getSupabaseServerClient();
  // Middleware already validated the JWT — getSession() is safe here and avoids
  // a second network round-trip to the Supabase Auth server.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/agent/auth");

  // Get agent email for pre-filling the ticket form
  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", session.user.id)
    .single();

  const email = profile?.email ?? session.user.email ?? "";

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <AgentSidebar />
      <main className="flex-1 lg:pl-64">
        <div className="px-4 sm:px-8 pb-8 pt-14 lg:pt-8">
          <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-slate-100 mb-2">
            Soporte
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            Estamos aquí para ayudarte. Respuesta garantizada en menos de 24 horas.
          </p>

          <SupportPageShell email={email} />
        </div>
      </main>
    </div>
  );
}
