import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";

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

  // 2. Verify admin role
  const db = getSupabaseServiceClient();
  const { data: adminProfile } = await db
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (adminProfile?.role !== "admin") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  // 3. Parse body
  let featured: boolean;
  try {
    const body = await req.json();
    featured = Boolean(body.featured);
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const { id } = await params;

  // 4. Fetch current value for audit log
  const { data: listing, error: fetchError } = await db
    .from("listings")
    .select("featured, title")
    .eq("id", id)
    .single();

  if (fetchError || !listing) {
    return NextResponse.json({ error: "Propiedad no encontrada" }, { status: 404 });
  }

  // 5. Update featured flag
  const { data: updated, error: updateError } = await db
    .from("listings")
    .update({ featured })
    .eq("id", id)
    .select("id");

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (!updated || updated.length === 0) {
    return NextResponse.json({ error: "Update afectó 0 filas — verifica SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
  }

  revalidateTag("listings", "default");

  // 6. Log to admin_audit_logs
  await db.from("admin_audit_logs").insert({
    admin_id: user.id,
    action: featured ? "feature" : "unfeature",
    target_type: "listing",
    target_id: id,
    before: { featured: listing.featured },
    after: { featured },
    ip_address:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
  });

  return NextResponse.json({ success: true, featured });
}
