import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { SearchShell } from "@/components/search/SearchShell";
import { getListings, getMapPins } from "@/lib/supabase/queries/listings";
import type { ListingFilters, ListingType, PropertyType, Listing, MapPin } from "@/lib/supabase/types";

export const revalidate = 60;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  house: "Casas",
  apartment: "Departamentos",
  condo: "Condominios",
  land: "Terrenos",
  commercial: "Comercial",
};

type SearchParams = {
  city?: string;
  neighborhood?: string;
  state?: string;
  type?: string;
  minPrice?: string;
  maxPrice?: string;
  beds?: string;
  baths?: string;
  page?: string;
  mode?: string;
  sort?: string;
};

function parseFilters(sp: SearchParams): ListingFilters {
  let listing_type: ListingType | undefined;
  if (sp.mode === "buy")  listing_type = "for_sale";
  if (sp.mode === "rent") listing_type = "for_rent";

  return {
    city: sp.city || undefined,
    neighborhood: sp.neighborhood || undefined,
    state: sp.state || undefined,
    property_type: sp.type
      ? (sp.type.split(",").filter(Boolean) as PropertyType[])
      : undefined,
    listing_type,
    min_price: sp.minPrice ? Number(sp.minPrice) : undefined,
    max_price: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    bedrooms: sp.beds ? Number(sp.beds) : undefined,
    bathrooms: sp.baths ? Number(sp.baths) : undefined,
    page: sp.page ? Math.max(1, Number(sp.page)) : 1,
    sort: (sp.sort as ListingFilters["sort"]) || "recent",
  };
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const parts: string[] = [];
  if (searchParams.type) {
    const label = PROPERTY_TYPE_LABELS[searchParams.type as PropertyType];
    if (label) parts.push(label);
  }
  if (searchParams.city) parts.push(`en ${searchParams.city}`);

  const title =
    parts.length > 0
      ? `${parts.join(" ")} — EstateElevate`
      : "Buscar Propiedades — EstateElevate";

  return {
    title,
    description: `Encuentra propiedades exclusivas${searchParams.city ? ` en ${searchParams.city}` : ""} en EstateElevate.`,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const filters = parseFilters(searchParams);

  let listings: Listing[] = [];
  let total = 0;
  let totalPages = 0;
  let mapPins: MapPin[] = [];

  try {
    const [result, pins] = await Promise.all([
      getListings(filters),
      getMapPins(filters),
    ]);
    listings = result.data;
    total = result.total;
    totalPages = result.totalPages;
    mapPins = pins;
  } catch {
    // DB not connected — show empty state
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar />
      {/* Fixed navbar spacer */}
      <div className="shrink-0 h-16" aria-hidden />

      <SearchShell
        listings={listings}
        total={total}
        totalPages={totalPages}
        mapPins={mapPins}
      />
    </div>
  );
}
