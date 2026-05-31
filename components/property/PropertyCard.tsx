"use client";

// 1×1 gray pixel — valid base64 data URI required by Next.js placeholder="blur"
const BLUR_PLACEHOLDER =
  "data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useI18nRouter } from "@/lib/navigation";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  Bath,
  BedDouble,
  Building,
  Building2,
  Heart,
  House,
  LandPlot,
  MapPin,
  Maximize2,
  Store,
  Video,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { QuickContactModal } from "@/components/search/QuickContactModal";
import { useFavorites } from "@/components/providers/FavoritesProvider";
import { cn, formatPrice, formatArea } from "@/lib/utils";
import type { Listing, ListingCard, Profile, PropertyType, ListingType } from "@/lib/supabase/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PROPERTY_TYPE_CONFIG: Record<PropertyType, { label: string; icon: LucideIcon }> = {
  house:      { label: "Casa",         icon: House },
  apartment:  { label: "Departamento", icon: Building2 },
  condo:      { label: "Condominio",   icon: Building },
  land:       { label: "Terreno",      icon: LandPlot },
  commercial: { label: "Comercial",    icon: Store },
};

const LISTING_TYPE_CONFIG: Record<ListingType, { label: string; variant: "warning" | "new" | "success" }> = {
  for_sale: { label: "En Venta",      variant: "warning" },
  for_rent: { label: "En Renta",      variant: "new" },
  both:     { label: "Venta y Renta", variant: "success" },
};

function isNew(createdAt: string): boolean {
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - new Date(createdAt).getTime() < sevenDays;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PhotoBadges({ listing }: { listing: Listing | ListingCard }) {
  const t = useTranslations("property");
  const listingCfg = LISTING_TYPE_CONFIG[listing.listing_type];
  const typeCfg = PROPERTY_TYPE_CONFIG[listing.property_type];
  const TypeIcon = typeCfg.icon;

  return (
    <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
      <Badge variant={listingCfg.variant} size="sm">
        {listingCfg.label}
      </Badge>
      <Badge variant="default" size="sm">
        <TypeIcon className="h-3 w-3" aria-hidden />
        {typeCfg.label}
      </Badge>
      {isNew(listing.created_at) && (
        <Badge variant="success" dot>
          {t("recentlyListed")}
        </Badge>
      )}
      {"virtual_tour_url" in listing && listing.virtual_tour_url && (
        <Badge variant="success">
          <Video className="h-3 w-3" aria-hidden />
          {t("tour3d")}
        </Badge>
      )}
    </div>
  );
}

function FavoriteButton({
  listingId,
}: {
  listingId: string;
}) {
  const t = useTranslations("property");
  const router = useI18nRouter();
  const { isFavorited, toggleFavorite } = useFavorites();
  const active = isFavorited(listingId);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const { authed } = await toggleFavorite(listingId);
    if (!authed) {
      router.push(`/agent/auth?returnTo=${encodeURIComponent(window.location.pathname)}`);
    }
  }

  return (
    <button
      onClick={handleClick}
      aria-label={active ? t("remove") || "Quitar de favoritos" : t("save") || "Guardar en favoritos"}
      className={cn(
        "absolute top-3 right-3 z-10 p-3 rounded-full",
        "bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm",
        "shadow transition-transform hover:scale-110 active:scale-95",
        "duration-150"
      )}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-colors",
          active
            ? "fill-red-500 text-red-500"
            : "text-slate-500 dark:text-slate-400"
        )}
        aria-hidden
      />
    </button>
  );
}

function StatsRow({ listing }: { listing: Listing | ListingCard }) {
  const t = useTranslations("property");
  return (
    <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 flex-wrap">
      {listing.bedrooms !== null && (
        <span className="flex items-center gap-1.5">
          <BedDouble className="h-4 w-4 shrink-0" aria-hidden />
          {listing.bedrooms} {t("bedShort")}
        </span>
      )}
      {listing.bathrooms !== null && (
        <span className="flex items-center gap-1.5">
          <Bath className="h-4 w-4 shrink-0" aria-hidden />
          {listing.bathrooms} {t("bathShort")}
        </span>
      )}
      {listing.total_area !== null && (
        <span className="flex items-center gap-1.5">
          <Maximize2 className="h-4 w-4 shrink-0" aria-hidden />
          {formatArea(listing.total_area)}
        </span>
      )}
    </div>
  );
}

// ─── PropertyCard ─────────────────────────────────────────────────────────────

export interface PropertyCardProps {
  listing: Listing | ListingCard;
  variant?: "horizontal" | "vertical" | "mini";
  onHover?: (id: string | null) => void;
  priority?: boolean;
}

export function PropertyCard({
  listing,
  variant = "vertical",
  onHover,
  priority = false,
}: PropertyCardProps) {
  const t = useTranslations("property");
  const router = useI18nRouter();
  const [contactOpen, setContactOpen] = useState(false);
  const [imgHovered, setImgHovered] = useState(false);
  // Guard: images may arrive as a JSONB string instead of array on bad seed data
  const imageList = Array.isArray(listing.images) ? listing.images : [];
  const coverImage = imageList[0] ?? null;
  const agentProfile = listing.profiles as Profile | null | undefined;
  const agentWhatsApp = agentProfile?.whatsapp ?? agentProfile?.phone ?? null;

  // ── MINI variant ──────────────────────────────────────────────────────────
  if (variant === "mini") {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-md w-56"> {/* w-56 is intentional: this variant is only used inside map pin popups */}
        {coverImage && (
          <div className="relative h-32 w-full">
            <Image
              src={coverImage.thumbnail_url}
              alt={listing.title}
              fill
              sizes="224px"
              className="object-cover"
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
              priority={priority}
            />
          </div>
        )}
        <div className="p-3">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
            {listing.title}
          </p>
          <p className="text-sm font-bold text-gold-600 dark:text-gold-400 mt-0.5">
            {formatPrice(listing.price)} {listing.currency}
          </p>
          <div className="flex gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
            {listing.bedrooms !== null && (
              <span>{listing.bedrooms} {t("bedShort")}</span>
            )}
            {listing.bathrooms !== null && (
              <span>{listing.bathrooms} {t("bathShort")}</span>
            )}
          </div>
          <Link
            href={`/propiedades/${listing.slug}`}
            className="mt-2 inline-block text-xs font-medium text-gold-600 hover:text-gold-700 dark:text-gold-400 underline-offset-2 hover:underline"
          >
            {t("viewProperty")}
          </Link>
        </div>
      </div>
    );
  }

  // ── VERTICAL variant ──────────────────────────────────────────────────────
  if (variant === "vertical") {
    return (
      <>
        <motion.article
          className={cn(
            "relative group rounded-xl overflow-hidden bg-white dark:bg-slate-800",
            "border border-slate-100 dark:border-slate-700",
            "h-full flex flex-col cursor-default",
            "hover:shadow-[0_8px_40px_rgba(0,0,0,0.14)] dark:hover:shadow-[0_8px_40px_rgba(0,0,0,0.4)]"
          )}
          whileHover={{ y: -4 }}
          whileTap={{ y: -1 }}
          transition={{ type: "spring", stiffness: 350, damping: 22 }}
          onMouseEnter={() => onHover?.(listing.id)}
          onMouseLeave={() => onHover?.(null)}
          onClick={(e) => {
            if ((e.target as Element).closest("button, a")) return;
            router.push(`/propiedades/${listing.slug}`);
          }}
        >
          {/* Photo */}
          <div className="relative aspect-[16/9] overflow-hidden cursor-pointer">
            <Link
              href={`/propiedades/${listing.slug}`}
              className="absolute inset-0 z-[1]"
              aria-label={listing.title}
            />
            <motion.div
              className="absolute inset-0"
              animate={{ scale: imgHovered ? 1.05 : 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              onMouseEnter={() => setImgHovered(true)}
              onMouseLeave={() => setImgHovered(false)}
            >
              {coverImage ? (
                <Image
                  src={coverImage.medium_url}
                  alt={listing.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                  placeholder="blur"
                  blurDataURL={BLUR_PLACEHOLDER}
                  priority={priority}
                />
              ) : (
                <div className="h-full w-full bg-slate-200 dark:bg-slate-700" />
              )}
            </motion.div>
            <PhotoBadges listing={listing} />
            <FavoriteButton listingId={listing.id} />
          </div>

          {/* Details */}
          <div className="p-3 flex flex-col gap-1.5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors">
              {listing.title}
            </h3>

            <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
              {[listing.neighborhood, listing.city].filter(Boolean).join(", ")}
            </p>

            <StatsRow listing={listing} />

            <div className="flex items-center justify-between mt-auto pt-1 gap-2">
              <div>
                <p className="text-lg font-bold font-serif text-slate-900 dark:text-slate-100">
                  {formatPrice(listing.price)}
                </p>
                <p className="text-xs text-slate-400">{listing.currency}</p>
              </div>

              <Button
                size="sm"
                variant="primary"
                className="relative z-10 text-xs px-2.5 py-1"
                onClick={(e) => {
                  e.preventDefault();
                  setContactOpen(true);
                }}
              >
                {t("contact")}
              </Button>
            </div>
          </div>
        </motion.article>

        <QuickContactModal
          open={contactOpen}
          onOpenChange={setContactOpen}
          listingId={listing.id}
          listingTitle={listing.title}
          agentId={listing.agent_id ?? ""}
          agentName={listing.profiles?.full_name ?? null}
          agentWhatsApp={agentWhatsApp}
          agentAvatarUrl={listing.profiles?.avatar_url ?? null}
        />
      </>
    );
  }

  // ── HORIZONTAL variant (default) ──────────────────────────────────────────
  return (
    <>
      <motion.article
        className={cn(
          "relative group flex rounded-xl overflow-hidden bg-white dark:bg-slate-800",
          "border border-slate-100 dark:border-slate-700",
          "cursor-default hover:shadow-[0_8px_40px_rgba(0,0,0,0.14)] dark:hover:shadow-[0_8px_40px_rgba(0,0,0,0.4)]"
        )}
        whileHover={{ y: -4 }}
        whileTap={{ y: -1 }}
        transition={{ type: "spring", stiffness: 350, damping: 22 }}
        onMouseEnter={() => onHover?.(listing.id)}
        onMouseLeave={() => onHover?.(null)}
        onClick={(e) => {
          if ((e.target as Element).closest("button, a")) return;
          router.push(`/propiedades/${listing.slug}`);
        }}
      >
        {/* Photo – fixed width on desktop */}
        <div className="relative shrink-0 w-full sm:w-52 lg:w-[200px] h-44 sm:h-auto overflow-hidden cursor-pointer">
          <Link
            href={`/propiedades/${listing.slug}`}
            className="absolute inset-0 z-[1]"
            aria-label={listing.title}
          />
          <motion.div
            className="absolute inset-0"
            animate={{ scale: imgHovered ? 1.05 : 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            onMouseEnter={() => setImgHovered(true)}
            onMouseLeave={() => setImgHovered(false)}
          >
            {coverImage ? (
              <Image
                src={coverImage.medium_url}
                alt={listing.title}
                fill
                sizes="(max-width: 640px) 100vw, 440px"
                className="object-cover"
                placeholder="blur"
                blurDataURL={BLUR_PLACEHOLDER}
                priority={priority}
              />
            ) : (
              <div className="h-full w-full bg-slate-200 dark:bg-slate-700" />
            )}
          </motion.div>
          <PhotoBadges listing={listing} />
          <FavoriteButton listingId={listing.id} />
        </div>

        {/* Details */}
        <div className="flex flex-1 flex-col p-5 min-w-0">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors line-clamp-2">
            {listing.title}
          </h3>

          <p className="flex items-center gap-1 mt-1 text-sm text-slate-500 dark:text-slate-400">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {[listing.neighborhood, listing.city]
              .filter(Boolean)
              .join(", ")}
          </p>

          <div className="mt-3">
            <StatsRow listing={listing} />
          </div>

          {"description" in listing && listing.description && (
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 line-clamp-2 flex-1">
              {listing.description}
            </p>
          )}

          <div className="flex items-end justify-between mt-4 gap-4">
            <div>
              <p className="text-2xl font-bold font-serif text-slate-900 dark:text-slate-100">
                {formatPrice(listing.price)}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{listing.currency}</p>
            </div>

            <Button
              size="sm"
              variant="primary"
              className="relative z-10"
              onClick={(e) => {
                e.preventDefault();
                setContactOpen(true);
              }}
            >
              {t("contactAgent")}
            </Button>
          </div>
        </div>
      </motion.article>

      <QuickContactModal
        open={contactOpen}
        onOpenChange={setContactOpen}
        listingId={listing.id}
        listingTitle={listing.title}
        agentId={listing.agent_id ?? ""}
        agentName={listing.profiles?.full_name ?? null}
        agentWhatsApp={agentWhatsApp}
        agentAvatarUrl={listing.profiles?.avatar_url ?? null}
      />
    </>
  );
}
