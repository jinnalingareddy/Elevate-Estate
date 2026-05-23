import { createHmac, timingSafeEqual } from "crypto";
import { getSupabaseServerClient } from "./supabase/server";
import { config } from "./config";

const CONEKTA_API = "https://api.conekta.io";
const CONEKTA_API_VERSION = "2.1.0";

function conektaHeaders(): HeadersInit {
  const key = process.env.CONEKTA_PRIVATE_KEY;
  if (!key) throw new Error("CONEKTA_PRIVATE_KEY is not set");

  return {
    "Content-Type": "application/json",
    Accept: "application/vnd.conekta-v2.1.0+json",
    Authorization: `Bearer ${key}`,
    "Accept-Language": "es",
    "Conekta-Client-User-Agent": JSON.stringify({
      name: "EstateElevate",
      version: "1.0.0",
    }),
  };
}

async function conektaFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${CONEKTA_API}${path}`, {
    ...options,
    headers: { ...conektaHeaders(), ...(options.headers ?? {}) },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail =
      (body as { details?: { message: string }[] })?.details?.[0]?.message ??
      res.statusText;
    throw new Error(`Conekta API error (${res.status}): ${detail}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Returns existing Conekta customer ID from subscriptions table or creates a
 * new customer via the Conekta API and persists the ID.
 */
export async function createOrGetConektaCustomer(
  agentId: string,
  email: string,
  name: string,
  phone: string
): Promise<string> {
  const supabase = getSupabaseServerClient();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("conekta_customer_id")
    .eq("agent_id", agentId)
    .maybeSingle();

  if (sub?.conekta_customer_id) return sub.conekta_customer_id;

  const customer = await conektaFetch<{ id: string }>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      phone: phone.replace(/\D/g, ""),
      corporate: false,
    }),
  });

  await supabase.from("subscriptions").upsert(
    { agent_id: agentId, conekta_customer_id: customer.id },
    { onConflict: "agent_id" }
  );

  return customer.id;
}

/**
 * Creates a Conekta subscription for a customer and returns the subscription
 * ID and the hosted payment page URL for redirect.
 */
export async function createConektaSubscription(
  customerId: string,
  planId: string
): Promise<{ subscriptionId: string; checkoutUrl: string }> {
  const sub = await conektaFetch<{
    id: string;
    checkout?: { url: string };
    redirect_to_payment_url?: string;
  }>(`/customers/${customerId}/subscriptions`, {
    method: "POST",
    body: JSON.stringify({ plan: planId }),
  });

  const checkoutUrl =
    sub.checkout?.url ??
    sub.redirect_to_payment_url ??
    `${config.app.url}/dashboard/billing`;

  return { subscriptionId: sub.id, checkoutUrl };
}

/**
 * Creates a one-time Conekta order for purchasing a pay-per-listing slot and
 * returns the order ID and the hosted checkout URL.
 */
export async function createConektaOneTimeOrder(
  customerId: string,
  agentId: string
): Promise<{ orderId: string; checkoutUrl: string }> {
  const { payPerListing, app } = config;

  const order = await conektaFetch<{
    id: string;
    checkout?: { id: string; url: string };
  }>("/orders", {
    method: "POST",
    body: JSON.stringify({
      currency: payPerListing.currency,
      customer_info: { customer_id: customerId },
      line_items: [
        {
          name: payPerListing.description,
          unit_price: payPerListing.price,
          quantity: 1,
          tags: ["listing_slot"],
        },
      ],
      metadata: { agent_id: agentId, product: "listing_slot" },
      checkout: {
        type: "Integration",
        allowed_payment_methods: ["card", "cash", "bank_transfer"],
        redirect_url: `${app.url}/dashboard/billing?status=success`,
        failure_url: `${app.url}/dashboard/billing?status=failed`,
        on_demand_enabled: true,
      },
    }),
  });

  const checkoutUrl =
    order.checkout?.url ?? `${app.url}/dashboard/billing`;

  return { orderId: order.id, checkoutUrl };
}

/**
 * Verifies a Conekta webhook request by comparing the HMAC-SHA256 signature
 * in the `Digest` header against a locally computed one.
 */
export function verifyConektaWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const secret = process.env.CONEKTA_WEBHOOK_SECRET;
  if (!secret) return false;

  const expected = createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}
