import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getAgentSubscription } from "@/lib/supabase/queries/subscriptions";
import { AgentSidebar } from "@/components/layout/AgentSidebar";
import { SettingsPageShell } from "@/components/agent/SettingsPageShell";
import type { Profile, PlanType } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Configuración — EstateElevate",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = getSupabaseServerClient();
  // Middleware already validated the JWT — getSession() is safe here and avoids
  // a second network round-trip to the Supabase Auth server.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/agent/auth");

  const agentId = session.user.id;

  const [profileRes, subscription] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", agentId).single(),
    getAgentSubscription(agentId).catch(() => null),
  ]);

  if (!profileRes.data) redirect("/agent/auth");

  const profile = profileRes.data as Profile;
  const plan: PlanType = (subscription?.plan ?? "free") as PlanType;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <AgentSidebar />
      <main className="flex-1 lg:pl-64">
        <div className="px-4 sm:px-8 pb-8 pt-14 lg:pt-8">
          <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-slate-100 mb-2">
            Configuración
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            Gestiona tu perfil, seguridad y preferencias.
          </p>

          <SettingsPageShell profile={profile} plan={plan} />
        </div>
      </main>
    </div>
  );
}
