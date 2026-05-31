import { getSupabaseServerClient } from "../server";
import type { Subscription, ListingSlot } from "../types";

export async function getAgentSubscription(
  agentId: string
): Promise<Subscription | null> {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .select("id, agent_id, plan, status, current_period_start, current_period_end, cancel_at_period_end, grace_period_end, created_at, updated_at")
    .eq("agent_id", agentId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Subscription | null;
}

export async function upsertSubscription(
  agentId: string,
  data: Partial<Subscription>
): Promise<Subscription> {
  const supabase = await getSupabaseServerClient();

  const { data: upserted, error } = await supabase
    .from("subscriptions")
    .upsert(
      { ...data, agent_id: agentId },
      { onConflict: "agent_id" }
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return upserted as Subscription;
}

export async function getAgentListingSlots(
  agentId: string
): Promise<ListingSlot[]> {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("listing_slots")
    .select("*")
    .eq("agent_id", agentId)
    .eq("active", true)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as ListingSlot[]) ?? [];
}

export async function createListingSlot(
  agentId: string,
  conektaOrderId: string
): Promise<ListingSlot> {
  const supabase = await getSupabaseServerClient();

  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const { data, error } = await supabase
    .from("listing_slots")
    .insert({
      agent_id: agentId,
      conekta_order_id: conektaOrderId,
      active: true,
      listing_id: null,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ListingSlot;
}

export async function expireListingSlot(slotId: string): Promise<void> {
  const supabase = await getSupabaseServerClient();

  const { error } = await supabase
    .from("listing_slots")
    .update({ active: false })
    .eq("id", slotId);

  if (error) throw new Error(error.message);
}

export async function assignSlotToListing(
  slotId: string,
  listingId: string
): Promise<ListingSlot> {
  const supabase = await getSupabaseServerClient();

  // Single UPDATE with conditional WHERE — avoids a separate SELECT round-trip.
  // The .is("listing_id", null) ensures we only update unassigned slots.
  const { data, error } = await supabase
    .from("listing_slots")
    .update({ listing_id: listingId })
    .eq("id", slotId)
    .eq("active", true)
    .gt("expires_at", new Date().toISOString())
    .is("listing_id", null)
    .select()
    .single();

  if (error || !data) throw new Error("Slot not found, expired, or already assigned to a listing");
  return data as ListingSlot;
}
