import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { getAuthUser, getSupabaseServiceClient } from "@/lib/supabase/server";
import { getAgentSubscription } from "@/lib/supabase/queries/subscriptions";
import { AgentSidebar } from "@/components/layout/AgentSidebar";
import { SettingsPageShell } from "@/components/agent/SettingsPageShell";
import type { Profile, PlanType } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Configuración — EstateElevate",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/agent/auth");

  const agentId = user.id;
  // Middleware already verified the session — use the service client so this
  // query is never blocked by a stale access-token JWT in the cookie store.
  const supabase = getSupabaseServiceClient();

  const [profileRes, subscription] = await Promise.all([
    // Narrowed — only columns the settings form actually displays/edits.
    supabase
      .from("profiles")
      .select(
        "id, full_name, email, bio, agency_name, phone, whatsapp, avatar_url, role, plan, email_notifications, whatsapp_notifications, created_at"
      )
      .eq("id", agentId)
      .single(),
    getAgentSubscription(agentId).catch(() => null),
  ]);

  if (!profileRes.data) notFound();

  const profile = profileRes.data as unknown as Profile;
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
