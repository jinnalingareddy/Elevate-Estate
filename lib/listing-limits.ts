import { cache } from "react";
import { getSupabaseServerClient } from "./supabase/server";
import { config } from "./config";
import type { PlanType } from "./supabase/types";

export interface ListingLimitInfo {
  plan: PlanType;
  planLimit: number;
  activeListings: number;
  paidSlots: number;
  available: number;
}

type SupabaseClient = ReturnType<typeof getSupabaseServerClient>;

async function fetchLimitData(agentId: string, supabase: SupabaseClient) {
  const [subResult, activeResult, slotsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("plan")
      .eq("id", agentId)
      .maybeSingle(),

    supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("agent_id", agentId)
      .eq("status", "active"),

    supabase
      .from("listing_slots")
      .select("id", { count: "exact", head: true })
      .eq("agent_id", agentId)
      .eq("active", true)
      .is("listing_id", null)
      .gt("expires_at", new Date().toISOString()),
  ]);

  if (subResult.error) throw new Error(subResult.error.message);
  if (activeResult.error) throw new Error(activeResult.error.message);
  if (slotsResult.error) throw new Error(slotsResult.error.message);

  const plan: PlanType = (subResult.data?.plan as PlanType) ?? "free";
  const planLimit = config.plans[plan].listingLimit;
  const activeListings = activeResult.count ?? 0;
  const paidSlots = slotsResult.count ?? 0;

  return { plan, planLimit, activeListings, paidSlots };
}

export async function getAvailableSlots(agentId: string): Promise<number> {
  const supabase = getSupabaseServerClient();
  const { planLimit, activeListings, paidSlots } = await fetchLimitData(agentId, supabase);
  const subscriptionSlots = Math.max(0, planLimit - activeListings);
  return subscriptionSlots + paidSlots;
}

export async function canCreateListing(agentId: string): Promise<boolean> {
  const available = await getAvailableSlots(agentId);
  return available > 0;
}

// Memoized per-request: multiple pages/components calling this for the same
// agentId within one render pass share the result — the 3 DB queries run once.
export const getListingLimitInfo = cache(
  async (agentId: string): Promise<ListingLimitInfo> => {
    const supabase = getSupabaseServerClient();
    const { plan, planLimit, activeListings, paidSlots } = await fetchLimitData(
      agentId,
      supabase
    );
    const subscriptionSlots = Math.max(0, planLimit - activeListings);
    const available = subscriptionSlots + paidSlots;
    return { plan, planLimit, activeListings, paidSlots, available };
  }
);
