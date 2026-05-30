import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import ReactDOM from "react-dom";
import { Suspense } from "react";
import {
  Bath,
  BedDouble,
  Building2,
  Car,
  Droplets,
  Dumbbell,
  Eye,
  Home,
  Leaf,
  MapPin,
  Maximize2,
  Package,
  Shield,
  Sun,
  Video,
  Waves,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/Badge";
import { PropertyGallery } from "@/components/property/PropertyGallery";
import { PropertyMap } from "@/components/property/PropertyMap";
import { PropertyCard } from "@/components/property/PropertyCard";
import { DescriptionToggle } from "@/components/property/DescriptionToggle";
import { AgentSidebar } from "@/components/property/AgentSidebar";
import { AgentEditButton } from "@/components/property/AgentEditButton";
import { MobileContactBar } from "@/components/property/MobileContactBar";
import NeighborhoodSection from "@/components/property/NeighborhoodSection";
import {
  getListingBySlug,
  getSimilarListings,
  incrementViews,
} from "@/lib/supabase/queries/listings";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { formatPrice, formatArea } from "@/lib/utils";
import type { PropertyType } from "@/lib/supabase/types";

export const revalidate = 60;

// ─── Static params ────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  try {
    const supabase = getSupabaseServerClient();
    const { data } = await supabase
      .from("listings")
      .select("slug")
      .eq("status", "active")
      .limit(1000);
    return (data ?? []).map((row: { slug: string }) => ({ slug: row.slug }));
  } catch {
    return [];
  }
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const listing = await getListingBySlug(params.slug).catch(() => null);
  if (!listing) return { title: "Propiedad no encontrada" };

  const coverImage = listing.images[0]?.large_url;
  const description = listing.description?.slice(0, 155) ?? "";

  return {
    title: `${listing.title} — EstateElevate`,
    description,
    openGraph: {
      title: listing.title,
      description,
      type: "website",
      ...(coverImage && {
        images: [{ url: coverImage, width: 1200, height: 630, alt: listing.title }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: listing.title,
      description,
      ...(coverImage && { images: [coverImage] }),
    },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  house: "Casa",
  apartment: "Departamento",
  condo: "Condominio",
  land: "Terreno",
  commercial: "Local Comercial",
};

const AMENITY_ICONS: Record<string, LucideIcon> = {
  Alberca: Droplets,
  Gym: Dumbbell,
  "Seguridad 24h": Shield,
  Jardín: Leaf,
  Terraza: Sun,
  Elevador: Building2,
  Bodega: Package,
  "Vista al mar": Waves,
  Estacionamiento: Car,
  "Área de juegos": Eye,
};


function isNew(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < 30 * 24 * 60 * 60 * 1000;
}

async function hashIp(ip: string): Promise<string> {
  const encoded = new TextEncoder().encode(ip);
  const buf = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PropertyPage({
  params,
}: {
  params: { slug: string };
}) {
  const listing = await getListingBySlug(params.slug).catch(() => null);
  if (!listing) notFound();

  // Preload hero image — React injects <link rel="preload"> into <head> during streaming
  const heroImageUrl = listing.images[0]?.large_url;
  if (heroImageUrl) {
    ReactDOM.preload(heroImageUrl, { as: "image", fetchPriority: "high" });
  }

  // Fire-and-forget view tracking (don't block page render).
  // getSimilarListings runs in parallel.
  const headersList = headers();
  const rawIp =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown";

  // Fire-and-forget — view tracking must not block page render
  hashIp(rawIp)
    .then((ipHash) => incrementViews(listing.id, ipHash))
    .catch(() => {});

  const similar = await getSimilarListings(listing.id, listing.city, listing.property_type, 3).catch(() => []);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://estateelevate.mx";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: listing.title,
    description: listing.description,
    url: `${appUrl}/propiedades/${listing.slug}`,
    image: listing.images[0]?.large_url,
    offers: {
      "@type": "Offer",
      price: listing.price,
      priceCurrency: listing.currency,
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: listing.address,
      addressLocality: listing.city,
      addressRegion: listing.state,
      postalCode: listing.postal_code ?? undefined,
      addressCountry: "MX",
    },
  };

  const agent = listing.profiles ?? null;
  const coverImage = listing.images[0];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar />

      {/* Floats bottom-right only when the logged-in agent owns this listing */}
      <AgentEditButton listingId={listing.id} agentId={listing.agent_id} />

      <main className="pt-20 pb-[100px] lg:pb-20 bg-white dark:bg-slate-950">
        {/* ── Gallery ───────────────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="relative">
            <PropertyGallery images={listing.images} title={listing.title} />

            {/* Overlaid badges */}
            <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2 pointer-events-none">
              {isNew(listing.created_at) && (
                <Badge variant="success" dot>
                  Recién Publicada
                </Badge>
              )}
              {listing.virtual_tour_url && (
                <Badge variant="new">
                  <Video className="h-3 w-3" aria-hidden />
                  Tour 3D
                </Badge>
              )}
              {listing.featured && (
                <Badge variant="featured">Destacada</Badge>
              )}
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ── Main info row ──────────────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mt-8 mb-4">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-serif text-slate-900 dark:text-slate-100 leading-snug md:leading-tight">
                {listing.title}
              </h1>
              <p className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-sm mt-2">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                {[listing.address, listing.neighborhood, listing.city]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>

            <div className="text-left md:text-right shrink-0">
              <p className="text-3xl md:text-4xl font-bold font-serif text-gold-600 dark:text-gold-400 leading-none">
                {formatPrice(listing.price, listing.currency)}
              </p>
              <p className="text-sm text-slate-400 mt-1">{listing.currency}</p>
            </div>
          </div>

          {/* ── Specs badges ───────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 md:gap-x-6 md:gap-y-3 py-4 border-y border-slate-100 dark:border-slate-800 mb-8">
            {listing.bedrooms !== null && (
              <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                <BedDouble className="h-5 w-5 text-gold-500" aria-hidden />
                {listing.bedrooms}{" "}
                {listing.bedrooms === 1 ? "Recámara" : "Recámaras"}
              </span>
            )}
            {listing.bathrooms !== null && (
              <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                <Bath className="h-5 w-5 text-gold-500" aria-hidden />
                {listing.bathrooms}{" "}
                {listing.bathrooms === 1 ? "Baño" : "Baños"}
              </span>
            )}
            {listing.total_area !== null && (
              <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                <Maximize2 className="h-5 w-5 text-gold-500" aria-hidden />
                {formatArea(listing.total_area)} totales
              </span>
            )}
            {listing.built_area !== null && (
              <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                <Maximize2 className="h-5 w-5 text-slate-400" aria-hidden />
                {formatArea(listing.built_area)} construidos
              </span>
            )}
            {listing.parking_spots !== null && (
              <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                <Car className="h-5 w-5 text-gold-500" aria-hidden />
                {listing.parking_spots}{" "}
                {listing.parking_spots === 1 ? "Cajón" : "Cajones"}
              </span>
            )}
            <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
              <Home className="h-5 w-5 text-gold-500" aria-hidden />
              {PROPERTY_TYPE_LABELS[listing.property_type]}
            </span>
          </div>

          {/* ── Two-column layout ──────────────────────────────────────────── */}
          <div className="flex flex-col lg:flex-row gap-10">
            {/* ── LEFT: Main content 60% ─────────────────────────────────── */}
            <div className="flex-1 min-w-0 space-y-10">
              {/* Description */}
              <section aria-labelledby="desc-heading">
                <h2
                  id="desc-heading"
                  className="text-xl font-bold font-serif text-slate-900 dark:text-slate-100 mb-4"
                >
                  Descripción
                </h2>
                <DescriptionToggle text={listing.description} />
              </section>

              {/* Amenities */}
              {listing.amenities.length > 0 && (
                <section aria-labelledby="amenities-heading">
                  <h2
                    id="amenities-heading"
                    className="text-xl font-bold font-serif text-slate-900 dark:text-slate-100 mb-4"
                  >
                    Características y Amenidades
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {listing.amenities.map((amenity) => {
                      const Icon = AMENITY_ICONS[amenity] ?? Shield;
                      return (
                        <div
                          key={amenity}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                        >
                          <Icon
                            className="h-4 w-4 text-gold-500 shrink-0"
                            aria-hidden
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                            {amenity}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Neighborhood — streamed separately so it never blocks the main RSC payload */}
              {listing.lat != null && listing.lng != null && (
                <Suspense fallback={null}>
                  <NeighborhoodSection lat={listing.lat} lng={listing.lng} />
                </Suspense>
              )}

              {/* Map */}
              <section aria-labelledby="map-heading">
                <h2
                  id="map-heading"
                  className="text-xl font-bold font-serif text-slate-900 dark:text-slate-100 mb-4"
                >
                  Ubicación
                </h2>
                <PropertyMap
                  lat={listing.lat}
                  lng={listing.lng}
                  title={listing.title}
                  price={listing.price}
                  currency={listing.currency}
                />
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                  La ubicación mostrada es aproximada para proteger la privacidad de la propiedad.
                </p>
              </section>

              {/* Similar listings */}
              {similar.length > 0 && (
                <section aria-labelledby="similar-heading">
                  <h2
                    id="similar-heading"
                    className="text-xl font-bold font-serif text-slate-900 dark:text-slate-100 mb-6"
                  >
                    Propiedades Similares
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {similar.map((item) => (
                      <PropertyCard
                        key={item.id}
                        listing={item}
                        variant="vertical"
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* ── RIGHT: Sticky sidebar 40% — hidden on mobile (MobileContactBar handles it) */}
            <aside className="hidden lg:block lg:w-[380px] xl:w-[420px] shrink-0">
              <div className="sticky" style={{ top: "calc(var(--preview-bar-h, 0px) + 96px)" }}>
                <AgentSidebar
                  listingId={listing.id}
                  agentId={listing.agent_id}
                  agent={
                    agent
                      ? {
                          full_name: agent.full_name,
                          agency_name: agent.agency_name,
                          avatar_url: agent.avatar_url,
                          phone: agent.phone,
                          whatsapp: agent.whatsapp,
                        }
                      : null
                  }
                  virtualTourUrl={listing.virtual_tour_url}
                />

                {/* Reference info */}
                <div className="mt-4 px-1 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                  <span>Ref: #{listing.id.slice(0, 8).toUpperCase()}</span>
                  {listing.views > 0 && (
                    <span>{listing.views.toLocaleString("es-MX")} vistas</span>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <MobileContactBar
        price={listing.price}
        currency={listing.currency}
        listingId={listing.id}
        listingTitle={listing.title}
        agentId={listing.agent_id}
        agentName={agent?.full_name ?? null}
        agentWhatsApp={agent?.whatsapp ?? agent?.phone ?? null}
        agentAvatarUrl={agent?.avatar_url ?? null}
      />

      <Footer />
    </>
  );
}
