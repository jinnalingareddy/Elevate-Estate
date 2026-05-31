import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  createOrGetConektaCustomer,
  createConektaSubscription,
} from "@/lib/conekta";
import { config } from "@/lib/config";
import { checkoutLimiter, applyRateLimit, getClientIp } from "@/lib/rate-limit";

const schema = z.object({
  plan: z.enum(["pro", "elite"]),
  msiMonths: z.number().int().positive().optional(),
});

export async function POST(req: NextRequest) {
  // 1. Auth check
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // 2. Rate limiting
  const ip = getClientIp(req);
  const rl = await applyRateLimit(checkoutLimiter, ip);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta más tarde." },
      { status: 429 }
    );
  }

  // 3. Zod validation
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 422 }
    );
  }

  const { plan } = parsed.data;
  const planConfig = config.plans[plan];

  try {
    // 4. Fetch agent profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", user.id)
      .single();

    const email = profile?.email ?? user.email ?? "";
    const name = profile?.full_name ?? "Agente";
    const phone = profile?.phone ?? "+5200000000000";

    // 5. Get or create Conekta customer
    const customerId = await createOrGetConektaCustomer(
      user.id,
      email,
      name,
      phone
    );

    // 6. Resolve plan ID
    const planId =
      plan === "pro"
        ? (process.env.CONEKTA_PRO_PLAN_ID ?? planConfig.conektaPlanId ?? "")
        : (process.env.CONEKTA_ELITE_PLAN_ID ?? planConfig.conektaPlanId ?? "");

    if (!planId) {
      return NextResponse.json(
        { error: "Plan no configurado" },
        { status: 503 }
      );
    }

    // 7. Create subscription
    const { checkoutUrl } = await createConektaSubscription(customerId, planId);

    return NextResponse.json({ checkoutUrl });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json(
      { error: "Error al crear suscripción" },
      { status: 502 }
    );
  }
}
