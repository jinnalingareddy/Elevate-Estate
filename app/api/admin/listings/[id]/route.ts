import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { deleteCloudinaryImage } from "@/lib/cloudinary-server";
import type { ListingImage } from "@/lib/supabase/types";

export async function DELETE(
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

  const { id } = await params;

  // 3. Fetch listing for images + audit
  const { data: listing, error: fetchError } = await db
    .from("listings")
    .select("id, title, images, agent_id")
    .eq("id", id)
    .single();

  if (fetchError || !listing) {
    return NextResponse.json({ error: "Propiedad no encontrada" }, { status: 404 });
  }

  // 4. Delete Cloudinary images (non-fatal — proceed even if some fail)
  const images = (listing.images ?? []) as ListingImage[];
  await Promise.allSettled(
    images.map((img) => deleteCloudinaryImage(img.public_id))
  );

  // 5. Delete listing row
  const { error: deleteError } = await db
    .from("listings")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  revalidateTag("listings", "default");

  // 6. Log to admin_audit_log
  await db.from("admin_audit_logs").insert({
    admin_id: user.id,
    action: "delete",
    target_type: "listing",
    target_id: id,
    before: { title: listing.title, agent_id: listing.agent_id },
    after: null,
    ip_address:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
  });

  return NextResponse.json({ success: true });
}
