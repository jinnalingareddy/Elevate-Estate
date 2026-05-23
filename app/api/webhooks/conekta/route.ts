import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { verifyConektaWebhookSignature } from "@/lib/conekta";
import {
  sendPaymentReceiptEmail,
  sendPaymentFailedEmail,
  sendListingsDraftedEmail,
} from "@/lib/email";
import { config } from "@/lib/config";
import type { PlanType } from "@/lib/supabase/types";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ConektaEvent {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
}

function safeStr(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function safeNum(v: unknown): number | null {
  return typeof v === "number" ? v : null;
}

function metadata(obj: Record<string, unknown>): Record<string, string> {
  const m = obj.metadata;
  return m && typeof m === "object" && !Array.isArray(m)
    ? (m as Record<string, string>)
    : {};
}

// ─── Plan resolution ───────────────────────────────────────────────────────────

function planFromId(planId: string): PlanType {
  if (planId.includes("elite")) return "elite";
  if (planId.includes("pro")) return "pro";
  return "pro"; // fallback
}

// ─── Draft excess listings helper ─────────────────────────────────────────────

async function draftExcessListings(
  db: ReturnType<typeof getSupabaseServiceClient>,
  agentId: string,
  keepCount: number
): Promise<string[]> {
  const { data: active } = await db
    .from("listings")
    .select("id, title")
    .eq("agent_id", agentId)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (!active || active.length <= keepCount) return [];

  const toDraft = active.slice(keepCount);
  const ids = toDraft.map((l) => l.id);

  await db.from("listings").update({ status: "draft" }).in("id", ids);

  return toDraft.map((l) => l.title as string);
}

// ─── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Read raw body BEFORE any other parsing (needed for HMAC)
  const rawBody = await req.text();

  // 2. Verify Conekta signature
  const sig = req.headers.get("Conekta-Signature") ?? "";
  if (!verifyConektaWebhookSignature(rawBody, sig)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  // 3. Parse event
  let event: ConektaEvent;
  try {
    event = JSON.parse(rawBody) as ConektaEvent;
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const db = getSupabaseServiceClient();

  // 4. Idempotency — skip if already processed
  const { data: existing } = await db
    .from("webhook_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  // 5. Record event (idempotency lock)
  await db.from("webhook_events").insert({
    id: event.id,
    provider: "conekta",
    event_type: event.type,
    payload: event as unknown as Record<string, unknown>,
    processed: false,
    error: null,
  });

  const obj = event.data?.object ?? {};
  const appUrl = config.app.url;

  try {
    // 6. Dispatch by event type
    switch (event.type) {
      // ── order.paid ─────────────────────────────────────────────────────────
      case "order.paid": {
        const meta = metadata(obj);
        const agentId = meta.agent_id;
        if (!agentId) break;

        // Create listing slot
        const expiresAt = new Date();
        expiresAt.setDate(
          expiresAt.getDate() + (config.payPerListing.validityDays ?? 365)
        );

        await db.from("listing_slots").insert({
          agent_id: agentId,
          conekta_order_id: safeStr(obj.id),
          active: true,
          listing_id: null,
          expires_at: expiresAt.toISOString(),
        });

        // Send receipt email
        const { data: agent } = await db
          .from("profiles")
          .select("email, full_name")
          .eq("id", agentId)
          .maybeSingle();

        if (agent?.email) {
          await sendPaymentReceiptEmail({
            to: agent.email,
            agentName: agent.full_name ?? "Agente",
            type: "pay_per_listing",
            amountCents: safeNum(obj.amount) ?? config.payPerListing.price,
            orderId: safeStr(obj.id),
            appUrl,
          }).catch((err) => Sentry.captureException(err));
        }
        break;
      }

      // ── subscription.paid ──────────────────────────────────────────────────
      case "subscription.paid": {
        // Resolve agent via metadata or conekta_customer_id
        const meta = metadata(obj);
        let agentId = meta.agent_id;

        if (!agentId) {
          const customerId = safeStr(obj.customer_id);
          if (customerId) {
            const { data: sub } = await db
              .from("subscriptions")
              .select("agent_id")
              .eq("conekta_customer_id", customerId)
              .maybeSingle();
            agentId = sub?.agent_id ?? "";
          }
        }

        if (!agentId) break;

        const planObj = obj.plan as Record<string, unknown> | null;
        const planId = safeStr(planObj?.id ?? obj.plan_id);
        const plan = planFromId(planId);

        const nextBillingAt = safeNum(obj.next_billing_at);
        const currentPeriodEnd = nextBillingAt
          ? new Date(nextBillingAt * 1000).toISOString()
          : null;

        await db.from("subscriptions").upsert(
          {
            agent_id: agentId,
            plan,
            status: "active",
            current_period_end: currentPeriodEnd,
            conekta_subscription_id: safeStr(obj.id) || null,
          },
          { onConflict: "agent_id" }
        );

        // Update profile plan
        await db
          .from("profiles")
          .update({ plan })
          .eq("id", agentId);

        const { data: agent } = await db
          .from("profiles")
          .select("email, full_name")
          .eq("id", agentId)
          .maybeSingle();

        if (agent?.email) {
          await sendPaymentReceiptEmail({
            to: agent.email,
            agentName: agent.full_name ?? "Agente",
            type: "subscription",
            planName: config.plans[plan].name,
            amountCents: config.plans[plan].priceMonthly * 100,
            orderId: safeStr(obj.id),
            appUrl,
          }).catch((err) => Sentry.captureException(err));
        }
        break;
      }

      // ── subscription.payment_failed ────────────────────────────────────────
      case "subscription.payment_failed": {
        const meta = metadata(obj);
        let agentId = meta.agent_id;

        if (!agentId) {
          const customerId = safeStr(obj.customer_id);
          if (customerId) {
            const { data: sub } = await db
              .from("subscriptions")
              .select("agent_id")
              .eq("conekta_customer_id", customerId)
              .maybeSingle();
            agentId = sub?.agent_id ?? "";
          }
        }

        if (!agentId) break;

        const gracePeriodEnd = new Date();
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3);

        await db.from("subscriptions").upsert(
          {
            agent_id: agentId,
            status: "grace_period",
            grace_period_end: gracePeriodEnd.toISOString(),
          },
          { onConflict: "agent_id" }
        );

        const { data: agent } = await db
          .from("profiles")
          .select("email, full_name")
          .eq("id", agentId)
          .maybeSingle();

        if (agent?.email) {
          await sendPaymentFailedEmail(
            agent.email,
            agent.full_name ?? "Agente",
            appUrl
          ).catch((err) => Sentry.captureException(err));
        }
        break;
      }

      // ── subscription.cancelled ─────────────────────────────────────────────
      case "subscription.cancelled": {
        const meta = metadata(obj);
        let agentId = meta.agent_id;

        if (!agentId) {
          const customerId = safeStr(obj.customer_id);
          if (customerId) {
            const { data: sub } = await db
              .from("subscriptions")
              .select("agent_id")
              .eq("conekta_customer_id", customerId)
              .maybeSingle();
            agentId = sub?.agent_id ?? "";
          }
        }

        if (!agentId) break;

        // Draft listings that exceed the free plan limit
        const freePlanLimit = config.plans.free.listingLimit;
        const draftedTitles = await draftExcessListings(
          db,
          agentId,
          freePlanLimit
        );

        // Downgrade subscription and profile to free
        await Promise.all([
          db.from("subscriptions").upsert(
            {
              agent_id: agentId,
              plan: "free",
              status: "cancelled",
              cancel_at_period_end: false,
            },
            { onConflict: "agent_id" }
          ),
          db.from("profiles").update({ plan: "free" }).eq("id", agentId),
        ]);

        const { data: agent } = await db
          .from("profiles")
          .select("email, full_name")
          .eq("id", agentId)
          .maybeSingle();

        if (agent?.email && draftedTitles.length > 0) {
          await sendListingsDraftedEmail(
            agent.email,
            agent.full_name ?? "Agente",
            draftedTitles,
            "Free",
            appUrl
          ).catch((err) => Sentry.captureException(err));
        }
        break;
      }

      default:
        // Unknown event type — no-op, still mark as processed
        break;
    }

    // Mark as processed
    await db
      .from("webhook_events")
      .update({ processed: true })
      .eq("id", event.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    Sentry.captureException(err);

    // Record error in webhook_events for debugging
    await db
      .from("webhook_events")
      .update({
        error: err instanceof Error ? err.message : String(err),
      })
      .eq("id", event.id);

    // Return 200 so Conekta doesn't retry infinitely on application errors
    return NextResponse.json({ ok: false, error: "Processing error" });
  }
}
