import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthUser, getSupabaseServerClient } from "@/lib/supabase/server";
import { getAgentListings } from "@/lib/supabase/queries/listings";
import type { Listing } from "@/lib/supabase/types";
import { getAgentSubscription } from "@/lib/supabase/queries/subscriptions";
import { getListingLimitInfo } from "@/lib/listing-limits";
import { AgentSidebar } from "@/components/layout/AgentSidebar";
import { DashboardShell } from "@/components/agent/DashboardShell";
import { config } from "@/lib/config";
import type { ViewDataPoint } from "@/components/agent/DashboardStats";

export const metadata: Metadata = {
  title: "Dashboard — EstateElevate",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getAuthUser();
  if (!user) redirect("/agent/auth");

  const agentId = user.id;
  const supabase = getSupabaseServerClient();

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10);

  // Pass limit: 1000 so activeListings count and DashboardShell listing list are accurate.
  const listingsPromise = getAgentListings(agentId, { limit: 1000 })
    .then((r) => r.data)
    .catch(() => [] as Listing[]);

  const [listings, activeLeads, subscription, limitInfo, viewStats] =
    await Promise.all([
      listingsPromise,

      Promise.resolve(
        supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .eq("agent_id", agentId)
          .eq("status", "new")
      )
        .then((r) => r.count ?? 0)
        .catch(() => 0),

      getAgentSubscription(agentId).catch(() => null),

      getListingLimitInfo(agentId).catch(() => ({
        plan: "free" as const,
        planLimit: 1,
        activeListings: 0,
        paidSlots: 0,
        available: 1,
      })),

      // Aggregation done in Postgres — no client-side grouping needed.
      Promise.resolve(
        supabase.rpc("get_agent_view_stats", { p_agent_id: agentId, p_days: 60 })
      )
        .then((r) => r.data as { stat_date: string; view_count: number }[] | null)
        .catch(() => null),
    ]);

  // Build a date-keyed map from RPC rows (covers 60 days).
  const viewMap: Record<string, number> = {};
  for (const row of viewStats ?? []) {
    viewMap[row.stat_date] = row.view_count;
  }

  // Split 60-day window: last 30 days = current, prior 30 days = previous.
  let totalViews = 0;
  let viewsPrev = 0;
  for (const [date, count] of Object.entries(viewMap)) {
    if (date >= thirtyDaysAgoStr) {
      totalViews += count;
    } else {
      viewsPrev += count;
    }
  }

  // Chart: one point per day for the last 30 days.
  const viewsData: ViewDataPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    viewsData.push({ date: key, views: viewMap[key] ?? 0 });
  }

  const viewsChange =
    viewsPrev > 0 ? Math.round(((totalViews - viewsPrev) / viewsPrev) * 100) : 0;

  const activeListings = listings.filter((l) => l.status === "active").length;

  const plan = limitInfo.plan;
  const planLimit = config.plans[plan].listingLimit;
  const renewalDate = subscription?.current_period_end ?? null;

  let warningBanner: string | null = null;
  if (subscription?.status === "past_due") {
    warningBanner =
      "Tu suscripción tiene un pago pendiente. Actualiza tu método de pago para evitar interrupciones.";
  } else if (subscription?.cancel_at_period_end) {
    warningBanner =
      "Tu suscripción se cancelará al final del período actual. Renuévala para no perder tus propiedades publicadas.";
  } else if (limitInfo.available === 0 && plan === "free") {
    warningBanner =
      "Has alcanzado el límite de tu plan gratuito. Actualiza tu plan para publicar más propiedades.";
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <AgentSidebar />
      <main className="flex-1 lg:pl-64">
        <div className="px-4 sm:px-8 pb-8 pt-14 lg:pt-8">
          <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-slate-100 mb-1">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            Bienvenido de vuelta. Aquí está el resumen de tu actividad.
          </p>

          <DashboardShell
            stats={{
              totalViews,
              viewsChange,
              activeLeads,
              viewsData,
              plan,
              planLimit,
              activeListings,
              renewalDate,
            }}
            listings={listings}
            limitInfo={limitInfo}
            warningBanner={warningBanner}
          />
        </div>
      </main>
    </div>
  );
}
