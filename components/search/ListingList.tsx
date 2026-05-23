"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PropertyCardSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { Listing } from "@/lib/supabase/types";

// ─── ListingList ──────────────────────────────────────────────────────────────

export interface ListingListProps {
  listings: Listing[];
  total: number;
  totalPages: number;
  loading?: boolean;
  hoveredListingId: string | null;
  setHoveredListingId: (id: string | null) => void;
}

export function ListingList({
  listings,
  total,
  totalPages,
  loading = false,
  hoveredListingId,
  setHoveredListingId,
}: ListingListProps) {
  const t = useTranslations("search");
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const searchBase = pathname.startsWith("/en") ? "/en/search" : "/search";
  const [isPending, startTransition] = useTransition();

  const SORT_OPTIONS = [
    { value: "recent", label: t("sortRecent") },
    { value: "price_asc", label: t("sortPriceAsc") },
    { value: "price_desc", label: t("sortPriceDesc") },
    { value: "views", label: t("sortViews") },
  ];

  const currentPage = Number(searchParams.get("page") ?? "1");
  const sort = searchParams.get("sort") ?? "recent";
  const city = searchParams.get("city") ?? "";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    if (key !== "page") params.delete("page");
    startTransition(() => {
      router.push(`${searchBase}?${params.toString()}`);
    });
  }

  function goToPage(page: number) {
    updateParam("page", String(page));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const cityLabel = city ? ` en ${city}` : "";

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4">
          <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── No results ────────────────────────────────────────────────────────────
  if (!loading && listings.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-4 py-16 text-center">
        <SearchX className="h-14 w-14 text-slate-300 dark:text-slate-600 mb-4" aria-hidden />
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">
          {t("noResultsTitle")}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-xs">
          {t("noResultsDesc")}
        </p>
        <Button
          variant="outline"
          size="md"
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString());
            ["priceMin","priceMax","type","beds","baths","areaMin","areaMax",
              "parking","yearFrom","yearTo","amenities"].forEach((k) => params.delete(k));
            router.push(`${searchBase}?${params.toString()}`);
          }}
        >
          {t("clearFilters")}
        </Button>
      </div>
    );
  }

  // ── Listings ──────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto min-h-0">
      <div className="px-4 py-4">
        {/* Header row */}
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <p className="text-sm text-slate-600 dark:text-slate-400 shrink-0">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {total.toLocaleString("es-MX")}
            </span>{" "}
            {t("propertiesFound", { count: "" }).replace("{count} ", "").trim()}{cityLabel}
          </p>

          <select
            value={sort}
            onChange={(e) => updateParam("sort", e.target.value)}
            className={cn(
              "h-11 px-3 rounded-lg text-sm border border-slate-200 dark:border-slate-700",
              "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300",
              "focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
            )}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Cards */}
        <div className="relative">
          {isPending && (
            <div className="absolute inset-0 z-10 bg-white/60 dark:bg-slate-950/60 backdrop-blur-[1px] rounded-lg flex items-center justify-center">
              <div className="h-6 w-6 rounded-full border-2 border-gold-500 border-t-transparent animate-spin" />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {listings.map((listing, idx) => (
              <div
                key={listing.id}
                onMouseEnter={() => setHoveredListingId(listing.id)}
                onMouseLeave={() => setHoveredListingId(null)}
              >
                <PropertyCard
                  listing={listing}
                  variant="vertical"
                  onHover={setHoveredListingId}
                  priority={idx < 2}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {buildPageRange(currentPage, totalPages).map((item, i) =>
              item === "…" ? (
                <span
                  key={`ellipsis-${i}`}
                  className="px-2 text-sm text-slate-400"
                >
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => goToPage(item as number)}
                  className={cn(
                    "w-10 h-10 sm:w-8 sm:h-8 rounded-lg text-sm font-medium transition-colors",
                    currentPage === item
                      ? "bg-gold-500 text-white"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  {item}
                </button>
              )
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              aria-label="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Pagination helper ────────────────────────────────────────────────────────

function buildPageRange(
  current: number,
  total: number
): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "…")[] = [1];
  if (current > 3) pages.push("…");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("…");
  pages.push(total);

  return pages;
}
