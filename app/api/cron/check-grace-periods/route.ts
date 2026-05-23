import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { sendListingsDraftedEmail } from "@/lib/email";
import { config } from "@/lib/config";

export async function GET(req: NextRequest) {
  // 1. Verify cron secret
  const authHeader = req.headers.get("Authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!authHeader || authHeader !== expected) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const db = getSupabaseServiceClient();
  const now = new Date().toISOString();
  const appUrl = config.app.url;

  let graceExpired = 0;
  let slotsExpired = 0;

  try {
    // ─── 2. Grace period expiry ─────────────────────────────────────────────

    const { data: expiredSubs } = await db
      .from("subscriptions")
      .select("agent_id")
      .eq("status", "grace_period")
      .lt("grace_period_end", now);

    if (expiredSubs && expiredSubs.length > 0) {
      const freePlanLimit = config.plans.free.listingLimit;

      await Promise.all(
        expiredSubs.map(async ({ agent_id }) => {
          try {
            // Draft excess listings
            const { data: active } = await db
              .from("listings")
              .select("id, title")
              .eq("agent_id", agent_id)
              .eq("status", "active")
              .order("created_at", { ascending: true });

            const toDraft = (active ?? []).slice(freePlanLimit);
            const draftedTitles: string[] = [];

            if (toDraft.length > 0) {
              await db
                .from("listings")
                .update({ status: "draft" })
                .in(
                  "id",
                  toDraft.map((l) => l.id)
                );
              draftedTitles.push(...toDraft.map((l) => l.title as string));
            }

            // Downgrade to free
            await Promise.all([
              db.from("subscriptions").update({
                plan: "free",
                status: "cancelled",
                grace_period_end: null,
              }).eq("agent_id", agent_id),
              db
                .from("profiles")
                .update({ plan: "free" })
                .eq("id", agent_id),
            ]);

            // Notify agent
            if (draftedTitles.length > 0) {
              const { data: agent } = await db
                .from("profiles")
                .select("email, full_name")
                .eq("id", agent_id)
                .maybeSingle();

              if (agent?.email) {
                await sendListingsDraftedEmail(
                  agent.email,
                  agent.full_name ?? "Agente",
                  draftedTitles,
                  "Free",
                  appUrl
                ).catch((err) => Sentry.captureException(err));
              }
            }

            graceExpired++;
          } catch (err) {
            Sentry.captureException(err, {
              extra: { agent_id, step: "grace_period_expiry" },
            });
          }
        })
      );
    }

    // ─── 3. Listing slot expiry ─────────────────────────────────────────────

    const { data: expiredSlots } = await db
      .from("listing_slots")
      .select("id, listing_id")
      .eq("active", true)
      .lt("expires_at", now);

    if (expiredSlots && expiredSlots.length > 0) {
      await Promise.all(
        expiredSlots.map(async ({ id, listing_id }) => {
          try {
            await db
              .from("listing_slots")
              .update({ active: false })
              .eq("id", id);

            if (listing_id) {
              await db
                .from("listings")
                .update({ status: "draft" })
                .eq("id", listing_id)
                .eq("status", "active"); // only draft if still active
            }

            slotsExpired++;
          } catch (err) {
            Sentry.captureException(err, {
              extra: { slot_id: id, step: "slot_expiry" },
            });
          }
        })
      );
    }

    return NextResponse.json({
      processed: { graceExpired, slotsExpired },
    });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json(
      { error: "Error al procesar expiración" },
      { status: 500 }
    );
  }
}
