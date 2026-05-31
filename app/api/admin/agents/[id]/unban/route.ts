import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { sendReactivationEmail } from "@/lib/email";
import { config } from "@/lib/config";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Verify session
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // 2. Verify admin role via service client (bypasses RLS)
  const db = getSupabaseServiceClient();
  const { data: adminProfile } = await db
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (adminProfile?.role !== "admin") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const { id } = await params;

  // 3. Fetch target profile for audit log
  const { data: target, error: fetchError } = await db
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", id)
    .single();

  if (fetchError || !target) {
    return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 });
  }

  // 4. Restore role to agent
  const { error: updateError } = await db
    .from("profiles")
    .update({ role: "agent" })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // 5. Log to admin_audit_log
  await db.from("admin_audit_logs").insert({
    admin_id: user.id,
    action: "unban",
    target_type: "profile",
    target_id: id,
    before: { role: target.role },
    after: { role: "agent" },
    ip_address:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
  });

  // 6. Send reactivation email (non-fatal)
  sendReactivationEmail(
    target.email,
    target.full_name ?? "Agente",
    config.app.url
  ).catch((err) => Sentry.captureException(err));

  return NextResponse.json({ success: true });
}
