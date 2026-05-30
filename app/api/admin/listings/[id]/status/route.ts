import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import type { ListingStatus } from "@/lib/supabase/types";

const VALID_STATUSES: ListingStatus[] = ["active", "draft", "pending", "sold"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Verify session
  const supabase = getSupabaseServerClient();
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

  // 3. Parse and validate body
  let status: ListingStatus;
  try {
    const body = await req.json();
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }
    status = body.status;
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const { id } = params;

  // 4. Fetch current status for audit log
  const { data: listing, error: fetchError } = await db
    .from("listings")
    .select("status, title")
    .eq("id", id)
    .single();

  if (fetchError || !listing) {
    return NextResponse.json({ error: "Propiedad no encontrada" }, { status: 404 });
  }

  // 5. Update status
  const { error: updateError } = await db
    .from("listings")
    .update({ status })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  revalidateTag("listings");

  // 6. Log to admin_audit_log
  await db.from("admin_audit_logs").insert({
    admin_id: user.id,
    action: "status_change",
    target_type: "listing",
    target_id: id,
    before: { status: listing.status },
    after: { status },
    ip_address:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
  });

  return NextResponse.json({ success: true, status });
}
