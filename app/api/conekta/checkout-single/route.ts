import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  createOrGetConektaCustomer,
  createConektaOneTimeOrder,
} from "@/lib/conekta";
import { checkoutLimiter, applyRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // 1. Auth check
  const supabase = getSupabaseServerClient();
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

  try {
    // 3. Fetch agent profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", user.id)
      .single();

    const email = profile?.email ?? user.email ?? "";
    const name = profile?.full_name ?? "Agente";
    const phone = profile?.phone ?? "+5200000000000";

    // 4. Get or create Conekta customer
    const customerId = await createOrGetConektaCustomer(
      user.id,
      email,
      name,
      phone
    );

    // 5. Create one-time order
    const { checkoutUrl } = await createConektaOneTimeOrder(customerId, user.id);

    return NextResponse.json({ checkoutUrl });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json(
      { error: "Error al crear orden de pago" },
      { status: 502 }
    );
  }
}
