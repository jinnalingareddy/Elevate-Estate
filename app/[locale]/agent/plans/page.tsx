import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/server";
import { getAgentSubscription } from "@/lib/supabase/queries/subscriptions";
import { getListingLimitInfo } from "@/lib/listing-limits";
import { AgentSidebar } from "@/components/layout/AgentSidebar";
import { PlansPageShell } from "@/components/agent/PlansPageShell";

export const metadata: Metadata = {
  title: "Planes — EstateElevate",
};

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const user = await getAuthUser();
  if (!user) redirect("/agent/auth");

  const agentId = user.id;

  const [subscription, limitInfo] = await Promise.all([
    getAgentSubscription(agentId).catch(() => null),
    getListingLimitInfo(agentId).catch(() => ({
      plan: "free" as const,
      planLimit: 1,
      activeListings: 0,
      paidSlots: 0,
      available: 1,
    })),
  ]);

  const currentPlan = (subscription?.plan ?? "free") as "free" | "pro" | "elite";

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <AgentSidebar />
      <main className="flex-1 lg:pl-64">
        <div className="px-4 sm:px-8 pb-8 pt-14 lg:pt-8">
          <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-slate-100 mb-2">
            Planes y precios
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            Elige el plan que mejor se adapte a tu volumen de propiedades.
          </p>

          <PlansPageShell currentPlan={currentPlan} limitInfo={limitInfo} />
        </div>
      </main>
    </div>
  );
}
