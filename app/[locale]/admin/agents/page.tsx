import type { Metadata } from "next";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { AgentsClient } from "@/components/admin/AgentsClient";
import type { AgentRow } from "@/components/admin/AgentsClient";

export const metadata: Metadata = {
  title: "Agentes — Admin | EstateElevate",
};

export const dynamic = "force-dynamic";

export default async function AdminAgentsPage() {
  const db = getSupabaseServiceClient();

  // Fetch agents and banned users
  const { data: profiles } = await db
    .from("profiles")
    .select("id, full_name, email, agency_name, avatar_url, plan, role, created_at")
    .in("role", ["agent", "banned"])
    .order("created_at", { ascending: false });

  const agentIds = (profiles ?? []).map((p) => p.id);

  // Fetch active listing counts for all agents in one query
  const { data: activeListings } = agentIds.length
    ? await db
        .from("listings")
        .select("agent_id")
        .eq("status", "active")
        .in("agent_id", agentIds)
    : { data: [] };

  // Build count map
  const countMap = new Map<string, number>();
  for (const listing of activeListings ?? []) {
    countMap.set(listing.agent_id, (countMap.get(listing.agent_id) ?? 0) + 1);
  }

  const agents: AgentRow[] = (profiles ?? []).map((p) => ({
    ...p,
    active_listings: countMap.get(p.id) ?? 0,
  }));

  return (
    <div className="px-4 sm:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-slate-100 mb-1">
          Agentes
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {agents.length} agentes registrados
        </p>
      </div>
      <AgentsClient agents={agents} />
    </div>
  );
}
