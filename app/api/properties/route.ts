import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { createListing, getListings } from "@/lib/supabase/queries/listings";
import { canCreateListing } from "@/lib/listing-limits";
import type { PropertyType } from "@/lib/supabase/types";

const schema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(5000),
  property_type: z.enum(["house", "apartment", "condo", "land", "commercial"]),
  status: z.enum(["active", "draft", "sold", "pending"]),
  listing_type: z.enum(["for_sale", "for_rent", "both"]).optional().default("for_sale"),
  price: z.number().positive(),
  maintenance_fee: z.number().min(0).nullable().optional(),
  bedrooms: z.number().int().min(0).nullable().optional(),
  bathrooms: z.number().min(0).nullable().optional(),
  total_area: z.number().positive().nullable().optional(),
  parking_spots: z.number().int().min(0).nullable().optional(),
  year_built: z.number().int().min(1800).max(2100).nullable().optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1, "El estado es requerido").max(100),
  address: z.string().max(300).nullable().optional(),
  neighborhood: z.string().min(1, "La colonia es requerida").max(200),
  alcaldia_municipio: z.string().min(1, "La alcaldía/municipio es requerida").max(200),
  calle_numero: z.string().min(1, "La calle y número son requeridos").max(300),
  numero_interior: z.string().max(50).nullable().optional(),
  referencias: z.string().max(500).nullable().optional(),
  country: z.string().max(100).optional(),
  postal_code: z.string().regex(/^\d{5}$/, "El código postal debe tener 5 dígitos"),
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
  agent_id: z.string().uuid(),
});

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  const filters = {
    city: searchParams.get("city") ?? undefined,
    neighborhood: searchParams.get("neighborhood") ?? undefined,
    state: searchParams.get("state") ?? undefined,
    property_type: searchParams.get("property_type")
      ?.split(",")
      .filter((t): t is PropertyType =>
        ["house", "apartment", "condo", "land", "commercial"].includes(t)
      ) ?? undefined,
    listing_type: (searchParams.get("listing_type") as "for_sale" | "for_rent" | undefined) ?? undefined,
    min_price: searchParams.get("min_price") ? Number(searchParams.get("min_price")) : undefined,
    max_price: searchParams.get("max_price") ? Number(searchParams.get("max_price")) : undefined,
    bedrooms: searchParams.get("bedrooms") ? Number(searchParams.get("bedrooms")) : undefined,
    bathrooms: searchParams.get("bathrooms") ? Number(searchParams.get("bathrooms")) : undefined,
    page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
    limit: Math.min(searchParams.get("limit") ? Number(searchParams.get("limit")) : 12, 100),
    sort: (searchParams.get("sort") as "recent" | "price_asc" | "price_desc" | "views" | undefined) ?? "recent",
  };

  try {
    const result = await getListings(filters);
    const response = NextResponse.json(result);
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al obtener propiedades";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: profile } = await getSupabaseServiceClient()
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["agent", "admin"].includes(profile.role)) {
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

  const payload = parsed.data;

  // Always assign agent_id server-side — never trust the client-supplied value
  const agentId = profile.role === "admin" ? payload.agent_id : user.id;
  const safePayload = { ...payload, agent_id: agentId };

  // Check plan listing limits (only when publishing active listings)
  if (payload.status === "active") {
    const allowed = await canCreateListing(user.id);
    if (!allowed) {
      return NextResponse.json(
        { error: "Has alcanzado el límite de propiedades de tu plan" },
        { status: 403 }
      );
    }
  }

  try {
    const listing = await createListing(safePayload as Parameters<typeof createListing>[0]);
    return NextResponse.json({ listing }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear propiedad";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
