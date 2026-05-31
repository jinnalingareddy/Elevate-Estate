"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, MapPin as MapPinIcon } from "lucide-react";
import { FilterBar } from "@/components/search/FilterBar";
import { ListingList } from "@/components/search/ListingList";
import { cn } from "@/lib/utils";
import type { ListingCard, MapPin as MapPinType } from "@/lib/supabase/types";

// ─── Lazy map (Leaflet can't run on SSR) ──────────────────────────────────────

const MapView = dynamic(
  () => import("@/components/search/MapView").then((m) => m.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
        <span className="text-slate-500 text-sm">Cargando mapa…</span>
      </div>
    ),
  }
);

// ─── SearchShell ──────────────────────────────────────────────────────────────
// NOTE: This component is keyed from page.tsx using the serialised search
// params, so it fully unmounts+remounts on every navigation. That means all
// local state (including hasOpenedMap) resets cleanly and Leaflet always
// receives a fresh DOM container.

interface SearchShellProps {
  listings: ListingCard[];
  total: number;
  totalPages: number;
  mapPins: MapPinType[];
}

export function SearchShell({ listings, total, totalPages, mapPins }: SearchShellProps) {
  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false); // mobile: default to list view
  const [mapCollapsed, setMapCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("ee-map-collapsed") === "true";
  });
  // Start false — IO below triggers Leaflet only when the map container enters
  // the viewport. On desktop (map visible) the IO fires on mount. On mobile
  // (map hidden via CSS) Leaflet never loads until the user taps "Ver Mapa",
  // saving ~220 KB of JS on first visit.
  const [hasOpenedMap, setHasOpenedMap] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Trigger Leaflet load as soon as the map panel is visible in the viewport.
  useEffect(() => {
    const el = mapContainerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasOpenedMap(true);
          io.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* ── Unified filter strip ─────────────────────────────────────────── */}
      <div className="relative shrink-0 z-20">
        <Suspense fallback={<div className="h-[57px] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800" />}>
          <FilterBar />
        </Suspense>
      </div>

      {/* ── Two-column content ───────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Left: listing list — hidden on mobile when map is shown */}
        <div className={cn(
          "overflow-y-auto border-r border-slate-100 dark:border-slate-800 flex flex-col transition-all duration-300",
          mapCollapsed ? "w-full md:w-full" : "w-full md:w-[55%] md:shrink-0",
          showMap && "hidden md:flex"
        )}>
          <Suspense fallback={null}>
            <ListingList
              listings={listings}
              total={total}
              totalPages={totalPages}
              hoveredListingId={hoveredListingId}
              setHoveredListingId={setHoveredListingId}
            />
          </Suspense>
        </div>

        {/* Right: map panel — always mounted on desktop to preserve Leaflet
            state. Mobile: fullscreen overlay when showMap=true */}
        <div
          ref={mapContainerRef}
          className={cn(
            "flex-1 overflow-hidden bg-slate-100 dark:bg-slate-900 relative",
            mapCollapsed ? "hidden" : "hidden md:block",
            showMap && "!block fixed inset-0 z-30 md:static md:z-auto"
          )}
        >
          {/* Desktop collapse toggle — left edge of the map panel */}
          <button
            type="button"
            onClick={() => {
              setMapCollapsed((v) => {
                const next = !v;
                localStorage.setItem("ee-map-collapsed", String(next));
                return next;
              });
            }}
            aria-label={mapCollapsed ? "Mostrar mapa" : "Ocultar mapa"}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-[500] items-center justify-center w-5 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-r-lg shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft className="h-3 w-3 text-slate-500" />
          </button>

          {hasOpenedMap && (
            <MapView
              listings={listings}
              mapPins={mapPins}
              hoveredListingId={hoveredListingId}
              onPinHover={setHoveredListingId}
              visible={showMap}
            />
          )}
        </div>

        {/* Desktop expand button — right edge of listing panel when map is collapsed */}
        {mapCollapsed && (
          <button
            type="button"
            onClick={() => {
              setMapCollapsed(false);
              setHasOpenedMap(true); // user is revealing the map — ensure it mounts
              localStorage.setItem("ee-map-collapsed", "false");
            }}
            aria-label="Mostrar mapa"
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-[500] items-center justify-center w-5 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-l-lg shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronRight className="h-3 w-3 text-slate-500" />
          </button>
        )}
      </div>

      {/* ── Mobile map/list toggle ────────────────────────────────────────── */}
      <AnimatePresence>
        <motion.button
          key="map-toggle"
          type="button"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 16, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          onClick={() => {
            setShowMap((v) => {
              if (!v) setHasOpenedMap(true); // switching to map — ensure it mounts
              return !v;
            });
          }}
          aria-label={showMap ? "Ver lista de propiedades" : "Ver mapa"}
          className={cn(
            "fixed left-1/2 -translate-x-1/2 z-40",
            "flex items-center gap-2 px-5 py-3 rounded-full",
            "bg-gold-500 hover:bg-gold-600 text-white",
            "text-sm font-semibold shadow-xl transition-colors duration-150",
            "md:hidden"
          )}
          style={{ bottom: "max(1.5rem, calc(env(safe-area-inset-bottom) + 0.5rem))" }}
        >
          <MapPinIcon className="h-4 w-4" aria-hidden />
          {showMap ? "Ver Lista" : "Ver Mapa"}
        </motion.button>
      </AnimatePresence>
    </div>
  );
}
