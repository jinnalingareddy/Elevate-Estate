import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { updateListing } from "@/lib/supabase/queries/listings";

const schema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
  property_type: z.enum(["house", "apartment", "condo", "land", "commercial"]).optional(),
  status: z.enum(["active", "draft", "sold", "pending"]).optional(),
  listing_type: z.enum(["for_sale", "for_rent", "both"]).optional(),
  price: z.number().positive().optional(),
  maintenance_fee: z.number().min(0).nullable().optional(),
  bedrooms: z.number().int().min(0).nullable().optional(),
  bathrooms: z.number().min(0).nullable().optional(),
  total_area: z.number().positive().nullable().optional(),
  parking_spots: z.number().int().min(0).nullable().optional(),
  year_built: z.number().int().min(1800).max(2100).nullable().optional(),
  city: z.string().min(1).max(100).optional(),
  state: z.string().max(100).optional(),
  address: z.string().max(300).nullable().optional(),
  neighborhood: z.string().max(200).nullable().optional(),
  country: z.string().max(100).optional(),
  postal_code: z.string().max(20).nullable().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  virtual_tour_url: z.string().url().nullable().optional().or(z.literal("")),
  video_url: z.string().url().nullable().optional().or(z.literal("")),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.object({
    public_id: z.string(),
    thumbnail_url: z.string(),
    medium_url: z.string(),
    large_url: z.string(),
  })).optional(),
  currency: z.string().optional(),
  featured: z.boolean().optional(),
  agent_id: z.string().uuid().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await getSupabaseServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Verify the listing exists and belongs to this agent
  const { data: existing, error: fetchError } = await supabase
    .from("listings")
    .select("id, agent_id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Propiedad no encontrada" }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  const isOwner = existing.agent_id === user.id;

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

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

  // Strip agent_id from payload — can't reassign ownership via this route
  const { agent_id: _agentId, ...updateData } = parsed.data;

  try {
    const listing = await updateListing(id, updateData as Parameters<typeof updateListing>[1]);
    return NextResponse.json({ listing });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al actualizar propiedad";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
