import { cache } from "react";
import { unstable_cache } from "next/cache";
import { getSupabaseServerClient, getSupabaseAnonClient } from "../server";
import { deleteCloudinaryImage } from "@/lib/cloudinary-server";
import type {
  Listing,
  ListingCard,
  ListingFilters,
  MapPin,
  CreateListingInput,
  UpdateListingInput,
} from "../types";
import { nanoid } from "nanoid";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function getListings(filters: ListingFilters = {}): Promise<{
  data: ListingCard[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const supabase = getSupabaseAnonClient();
  const {
    city,
    neighborhood,
    state,
    property_type,
    listing_type,
    min_price,
    max_price,
    bedrooms,
    bathrooms,
    page = 1,
    limit = 12,
    sort = "recent",
  } = filters;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("listings")
    .select(
      "id, slug, title, price, currency, city, neighborhood, bedrooms, bathrooms, total_area, status, listing_type, property_type, featured, images, created_at, profiles(id, full_name, avatar_url)",
      { count: "estimated" }
    )
    .eq("status", "active")
    .range(from, to);

  if (city) query = query.or(`city.ilike.%${city}%,alcaldia_municipio.ilike.%${city}%`);
  if (neighborhood) query = query.ilike("neighborhood", `%${neighborhood}%`);
  if (state) query = query.ilike("state", `%${state}%`);
  if (property_type?.length) query = query.in("property_type", property_type);
  if (listing_type === "for_sale") {
    query = query.or("listing_type.eq.for_sale,listing_type.eq.both");
  } else if (listing_type === "for_rent") {
    query = query.or("listing_type.eq.for_rent,listing_type.eq.both");
  }
  if (min_price !== undefined) query = query.gte("price", min_price);
  if (max_price !== undefined) query = query.lte("price", max_price);
  if (bedrooms !== undefined) query = query.gte("bedrooms", bedrooms);
  if (bathrooms !== undefined) query = query.gte("bathrooms", bathrooms);

  if (sort === "price_asc") {
    query = query.order("price", { ascending: true });
  } else if (sort === "price_desc") {
    query = query.order("price", { ascending: false });
  } else if (sort === "views") {
    query = query.order("views", { ascending: false });
  } else {
    query = query
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });
  }

  const { data, error, count } = await query;

  if (error) throw new Error(error.message);

  const total = count ?? 0;
  return {
    data: (data as unknown as ListingCard[]) ?? [],
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export const getMapPins = cache(
  unstable_cache(
    async (filters: ListingFilters = {}): Promise<MapPin[]> => {
      const supabase = getSupabaseAnonClient();
      const {
        city,
        neighborhood,
        state,
        property_type,
        listing_type,
        min_price,
        max_price,
        bedrooms,
        bathrooms,
      } = filters;

      let query = supabase
        .from("listings")
        .select("id, lat, lng, price, title, slug")
        .eq("status", "active")
        .not("lat", "is", null)
        .not("lng", "is", null)
        .limit(500);

      if (city) query = query.or(`city.ilike.%${city}%,alcaldia_municipio.ilike.%${city}%`);
      if (neighborhood) query = query.ilike("neighborhood", `%${neighborhood}%`);
      if (state) query = query.ilike("state", `%${state}%`);
      if (property_type?.length) query = query.in("property_type", property_type);
      if (listing_type === "for_sale") {
        query = query.or("listing_type.eq.for_sale,listing_type.eq.both");
      } else if (listing_type === "for_rent") {
        query = query.or("listing_type.eq.for_rent,listing_type.eq.both");
      }
      if (min_price !== undefined) query = query.gte("price", min_price);
      if (max_price !== undefined) query = query.lte("price", max_price);
      if (bedrooms !== undefined) query = query.gte("bedrooms", bedrooms);
      if (bathrooms !== undefined) query = query.gte("bathrooms", bathrooms);

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data as MapPin[]) ?? [];
    },
    ["map-pins"],
    { revalidate: 60, tags: ["listings"] }
  )
);

export const getListingBySlug = cache(
  unstable_cache(
    async (slug: string): Promise<Listing | null> => {
      const supabase = getSupabaseAnonClient();

      const { data, error } = await supabase
        .from("listings")
        .select("*, profiles(id, full_name, avatar_url, phone, whatsapp, agency_name, bio)")
        .eq("slug", slug)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null;
        throw new Error(error.message);
      }

      return data as Listing;
    },
    ["listing-by-slug"],
    { revalidate: 300, tags: ["listings"] }
  )
);

// Narrowed columns — agent management pages don't need description, full
// address fields, or the agent's own profile joined back on every row.
export async function getAgentListings(agentId: string): Promise<Listing[]> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("listings")
    .select(
      "id, agent_id, title, slug, status, price, currency, property_type, listing_type, city, neighborhood, bedrooms, bathrooms, total_area, images, views, featured, created_at, updated_at"
    )
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as Listing[]) ?? [];
}

export const getFeaturedListings = cache(
  unstable_cache(
    async (limit = 6): Promise<ListingCard[]> => {
      const supabase = getSupabaseAnonClient();

      const { data, error } = await supabase
        .from("listings")
        .select(
          "id, slug, title, price, currency, city, neighborhood, bedrooms, bathrooms, total_area, status, listing_type, property_type, featured, images, created_at, profiles(id, full_name, avatar_url)"
        )
        .eq("status", "active")
        .eq("featured", true)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw new Error(error.message);
      return (data as unknown as ListingCard[]) ?? [];
    },
    ["featured-listings"],
    { revalidate: 300, tags: ["listings"] }
  )
);

export const getSimilarListings = cache(
  unstable_cache(
    async (listingId: string, city: string, propertyType: string, limit = 4): Promise<ListingCard[]> => {
      const supabase = getSupabaseAnonClient();

      const { data, error } = await supabase
        .from("listings")
        .select(
          "id, slug, title, price, currency, city, neighborhood, bedrooms, bathrooms, total_area, status, listing_type, property_type, featured, images, created_at, profiles(id, full_name, avatar_url)"
        )
        .eq("status", "active")
        .neq("id", listingId)
        .or(`city.eq.${city},property_type.eq.${propertyType}`)
        .order("featured", { ascending: false })
        .limit(limit);

      if (error) throw new Error(error.message);
      return (data as unknown as ListingCard[]) ?? [];
    },
    ["similar-listings"],
    { revalidate: 600, tags: ["listings"] }
  )
);

export async function createListing(data: CreateListingInput): Promise<Listing> {
  const supabase = getSupabaseServerClient();

  const baseSlug = slugify(data.title);
  const slug = `${baseSlug}-${nanoid(6)}`;

  const { data: created, error } = await supabase
    .from("listings")
    .insert({ ...data, slug, views: 0 })
    .select("*, profiles(id, full_name, avatar_url, phone, whatsapp)")
    .single();

  if (error) throw new Error(error.message);
  return created as Listing;
}

export async function updateListing(
  id: string,
  data: UpdateListingInput
): Promise<Listing> {
  const supabase = getSupabaseServerClient();

  const { data: updated, error } = await supabase
    .from("listings")
    .update(data)
    .eq("id", id)
    .select("*, profiles(id, full_name, avatar_url, phone, whatsapp)")
    .single();

  if (error) throw new Error(error.message);
  return updated as Listing;
}

export async function deleteListing(id: string): Promise<void> {
  const supabase = getSupabaseServerClient();

  const { data: listing, error: fetchError } = await supabase
    .from("listings")
    .select("images")
    .eq("id", id)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  if (listing?.images?.length) {
    await Promise.allSettled(
      listing.images.map((img: { public_id: string }) =>
        deleteCloudinaryImage(img.public_id)
      )
    );
  }

  const { error } = await supabase.from("listings").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function incrementViews(
  listingId: string,
  ipHash: string
): Promise<void> {
  const supabase = getSupabaseServerClient();

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: existing } = await supabase
    .from("listing_views")
    .select("id")
    .eq("listing_id", listingId)
    .eq("ip_hash", ipHash)
    .gte("viewed_at", since)
    .maybeSingle();

  if (existing) return;

  // Parallelize insert + counter increment instead of running them sequentially.
  await Promise.all([
    supabase.from("listing_views").insert({ listing_id: listingId, ip_hash: ipHash }),
    supabase.rpc("increment_listing_views", { listing_id: listingId }),
  ]);
}
