import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getAgentListings } from "@/lib/supabase/queries/listings";
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
  const supabase = getSupabaseServerClient();
  // Middleware already validated the JWT — getSession() is safe here and avoids
  // a second network round-trip to the Supabase Auth server.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/agent/auth");

  const agentId = session.user.id;

  // Pre-compute date range before kicking off queries.
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(now.getDate() - 60);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();
  const sixtyDaysAgoStr = sixtyDaysAgo.toISOString();

  // Start listings first so listing_views can chain off it while the other
  // three queries run in parallel — avoids a sequential round-trip.
  const listingsPromise = getAgentListings(agentId).catch(
    () => [] as Awaited<ReturnType<typeof getAgentListings>>
  );

  const [listings, activeLeads, subscription, limitInfo, viewRows] =
    await Promise.all([
      listingsPromise,

      // Count-only query — the dashboard only needs the number, not full rows.
      supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("agent_id", agentId)
        .eq("status", "new")
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

      // Chains off listingsPromise — fires as soon as listings resolves,
      // overlapping with leads/subscription/limitInfo round-trips.
      listingsPromise
        .then((ls) => {
          const ids = ls.map((l) => l.id);
          if (ids.length === 0) return null;
          return supabase
            .from("listing_views")
            .select("viewed_at")
            .in("listing_id", ids)
            .gte("viewed_at", sixtyDaysAgoStr)
            .then((r) => r.data);
        })
        .catch(() => null),
    ]);

  let viewsData: ViewDataPoint[] = [];
  let totalViews = 0;
  let viewsPrev = 0;

  if (viewRows) {
    const currentRows = viewRows.filter((r) => r.viewed_at >= thirtyDaysAgoStr);
    viewsPrev = viewRows.length - currentRows.length;
    totalViews = currentRows.length;

    const grouped: Record<string, number> = {};
    for (const row of currentRows) {
      const day = row.viewed_at.slice(0, 10);
      grouped[day] = (grouped[day] ?? 0) + 1;
    }

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      viewsData.push({ date: key, views: grouped[key] ?? 0 });
    }
  } else {
    // Still build 30 empty days so chart renders
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      viewsData.push({ date: d.toISOString().slice(0, 10), views: 0 });
    }
  }

  const viewsChange =
    viewsPrev > 0 ? Math.round(((totalViews - viewsPrev) / viewsPrev) * 100) : 0;

  const activeListings = listings.filter((l) => l.status === "active").length;

  const plan = limitInfo.plan;
  const planLimit = config.plans[plan].listingLimit;
  const renewalDate = subscription?.current_period_end ?? null;

  // Warning banner: past due or cancelled
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
