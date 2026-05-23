"use client";

import Image from "next/image";
import Link from "next/link";
import { Edit2, Eye, MessageSquare, Power } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn, formatPrice } from "@/lib/utils";
import type { Listing, ListingStatus } from "@/lib/supabase/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<
  ListingStatus,
  { variant: "success" | "warning" | "default" | "error"; label: string }
> = {
  active: { variant: "success", label: "Activo" },
  pending: { variant: "warning", label: "Pendiente" },
  sold: { variant: "default", label: "Vendido" },
  draft: { variant: "warning", label: "Borrador" },
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ListingCardProps {
  listing: Listing;
  leadsCount?: number;
  onToggleStatus?: (id: string, newStatus: ListingStatus) => void;
}

// ─── ListingCard ──────────────────────────────────────────────────────────────

export function ListingCard({
  listing,
  leadsCount = 0,
  onToggleStatus,
}: ListingCardProps) {
  const coverImage = listing.images[0];
  const { variant, label } = STATUS_BADGE[listing.status];

  const nextStatus: ListingStatus =
    listing.status === "active" ? "draft" : "active";
  const toggleLabel = listing.status === "active" ? "Desactivar" : "Activar";

  return (
    <div
      className={cn(
        "group flex flex-col bg-white dark:bg-slate-800 rounded-xl overflow-hidden",
        "border border-slate-100 dark:border-slate-700 shadow-sm",
        "hover:shadow-md transition-shadow duration-200"
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0">
        {coverImage ? (
          <Image
            src={coverImage.thumbnail_url}
            alt={listing.title}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <span className="text-sm text-slate-400 dark:text-slate-500">
              Sin foto
            </span>
          </div>
        )}
        <div className="absolute top-2 left-2">
          <Badge variant={variant} size="sm">
            {label}
          </Badge>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2 flex-1 min-w-0">
        <Link
          href={`/propiedades/${listing.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 hover:text-gold-600 dark:hover:text-gold-400 transition-colors"
        >
          {listing.title}
        </Link>

        <p className="text-xl font-bold font-serif text-slate-900 dark:text-slate-100 leading-none">
          {formatPrice(listing.price)}
        </p>

        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {listing.views.toLocaleString("es-MX")} vistas
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {leadsCount} prospecto{leadsCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="flex-1">
          <Link href={`/agent/listings/${listing.id}/edit`}>
            <Edit2 className="h-3.5 w-3.5 mr-1.5" aria-hidden />
            Editar
          </Link>
        </Button>

        {onToggleStatus && listing.status !== "sold" && (
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex-1",
              listing.status === "active"
                ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                : "text-teal-600 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-900/20"
            )}
            onClick={() => onToggleStatus(listing.id, nextStatus)}
          >
            <Power className="h-3.5 w-3.5 mr-1.5" aria-hidden />
            {toggleLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
