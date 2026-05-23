import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { createLead } from "@/lib/supabase/queries/leads";
import { sendNewLeadEmail } from "@/lib/email";
import { leadFormLimiter, applyRateLimit, getClientIp } from "@/lib/rate-limit";
import { config } from "@/lib/config";

const MEXICAN_PHONE_RE = /^(\+?52)?[0-9]{10}$/;

const schema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z
    .string()
    .regex(MEXICAN_PHONE_RE, "Número de teléfono inválido (formato mexicano)"),
  message: z.string().optional(),
  listing_id: z.string().uuid("ID de propiedad inválido"),
  agent_id: z.string().uuid("ID de agente inválido"),
  source: z.literal("website_form"),
  // Honeypot + timing — checked before schema validation
  website: z.string().optional(),
  submitted_at: z.number().optional(),
});

export async function POST(req: NextRequest) {
  // 1. Rate limiting
  const ip = getClientIp(req);
  const rl = await applyRateLimit(leadFormLimiter, ip);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta más tarde." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(rl.limit),
          "X-RateLimit-Remaining": "0",
          "Retry-After": "3600",
        },
      }
    );
  }

  // 2. Parse body
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  if (typeof raw !== "object" || raw === null) {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const body = raw as Record<string, unknown>;

  // 3. Bot detection
  // Honeypot: if the hidden `website` field has any value, it's a bot
  if (body.website) {
    return NextResponse.json({ success: true }); // silent 200
  }

  // Timing: reject if form was submitted in < 2 seconds (bot speed)
  if (typeof body.submitted_at === "number") {
    const elapsed = Date.now() - body.submitted_at;
    if (elapsed < 2000) {
      return NextResponse.json({ success: true }); // silent 200
    }
  }

  // 4. Zod validation
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { error: issue?.message ?? "Datos inválidos" },
      { status: 422 }
    );
  }

  const { name, email, phone, message, listing_id, agent_id, source } =
    parsed.data;

  try {
    // 5. Create lead
    const lead = await createLead({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      message: message?.trim() ?? "",
      listing_id,
      agent_id,
      source,
    });

    // 6. Fetch listing title + agent email for the notification
    const db = getSupabaseServiceClient();
    const [listingRes, agentRes] = await Promise.all([
      db
        .from("listings")
        .select("title, price, slug")
        .eq("id", listing_id)
        .maybeSingle(),
      db
        .from("profiles")
        .select("email, full_name")
        .eq("id", agent_id)
        .maybeSingle(),
    ]);

    // 7. Send email notification (non-fatal)
    if (agentRes.data?.email) {
      sendNewLeadEmail({
        to: agentRes.data.email,
        agentName: agentRes.data.full_name ?? "Agente",
        leadName: name,
        leadEmail: email,
        leadPhone: phone,
        message: message ?? null,
        listingTitle: listingRes.data?.title ?? "Tu propiedad",
        listingPrice: listingRes.data?.price ?? 0,
        listingSlug: listingRes.data?.slug ?? listing_id,
        appUrl: config.app.url,
      }).catch((err) => Sentry.captureException(err));
    }

    // 8. Return success
    return NextResponse.json({ success: true, lead_id: lead.id }, { status: 201 });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: "Error al registrar prospecto" }, { status: 500 });
  }
}
