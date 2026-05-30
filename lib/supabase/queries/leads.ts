import { getSupabaseServerClient } from "../server";
import type {
  Lead,
  LeadStatus,
  CreateLeadInput,
  LeadFilters,
  LeadStats,
} from "../types";

export async function createLead(data: CreateLeadInput): Promise<Lead> {
  const supabase = getSupabaseServerClient();

  const { data: created, error } = await supabase
    .from("leads")
    .insert({
      ...data,
      status: "new" as LeadStatus,
      read: false,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return created as Lead;
}

export async function getAgentLeads(
  agentId: string,
  filters: LeadFilters = {}
): Promise<Lead[]> {
  const supabase = getSupabaseServerClient();

  let query = supabase
    .from("leads")
    .select(
      `id, agent_id, listing_id, status, read, name, email, phone, message, created_at,
      listings ( id, title, slug )`
    )
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  if (filters.status !== undefined) query = query.eq("status", filters.status);
  if (filters.read !== undefined) query = query.eq("read", filters.read);
  if (filters.listing_id) query = query.eq("listing_id", filters.listing_id);

  const limit = filters.limit ?? 200;
  const offset = filters.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as Lead[]) ?? [];
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus
): Promise<Lead> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Lead;
}

export async function markLeadRead(id: string): Promise<void> {
  const supabase = getSupabaseServerClient();

  const { error } = await supabase
    .from("leads")
    .update({ read: true })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function getLeadCountsByListing(
  listingIds: string[]
): Promise<Record<string, number>> {
  if (listingIds.length === 0) return {};
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .rpc("get_lead_counts_for_listings", { listing_ids: listingIds });
  if (error) throw new Error(error.message);
  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as { listing_id: string; count: number }[]) {
    counts[row.listing_id] = Number(row.count);
  }
  return counts;
}

export async function getLeadStats(agentId: string): Promise<LeadStats> {
  const supabase = getSupabaseServerClient();

  // Single RPC call replaces 7 separate COUNT round-trips.
  // The SQL function uses conditional aggregation (COUNT FILTER) so
  // Postgres scans the agent's rows exactly once.
  const { data, error } = await supabase.rpc("get_agent_lead_stats", {
    p_agent_id: agentId,
  });

  if (error) throw new Error(error.message);

  const row = (data ?? {}) as {
    total: number;
    new: number;
    contacted: number;
    qualified: number;
    closed: number;
    this_month: number;
    last_month: number;
  };

  const totalCount = Number(row.total ?? 0);
  const closedCount = Number(row.closed ?? 0);
  const conversionRate =
    totalCount > 0 ? Math.round((closedCount / totalCount) * 100 * 10) / 10 : 0;

  return {
    total: totalCount,
    new: Number(row.new ?? 0),
    contacted: Number(row.contacted ?? 0),
    qualified: Number(row.qualified ?? 0),
    thisMonth: Number(row.this_month ?? 0),
    lastMonth: Number(row.last_month ?? 0),
    conversionRate,
  };
}
