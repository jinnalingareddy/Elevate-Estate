"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PropertyCard } from "@/components/property/PropertyCard";
import type { Listing, ListingCard, MapPin } from "@/lib/supabase/types";

// ─── Leaflet default icon fix (webpack asset hashing) ────────────────────────

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─── Tile sources ─────────────────────────────────────────────────────────────

const TILE_URLS = {
  light:     "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  dark:      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
};

const MAP_STYLE_CYCLE: Array<keyof typeof TILE_URLS> = ["light", "dark", "satellite"];

const MAP_STYLE_LABELS: Record<keyof typeof TILE_URLS, string> = {
  light:     "🌙 Oscuro",
  dark:      "🛰 Satélite",
  satellite: "☀️ Claro",
};

// ─── Cluster icon (gold bubble matching brand) ────────────────────────────────

function createClusterIcon(cluster: { getChildCount: () => number }): L.DivIcon {
  const count = cluster.getChildCount();
  const size = count < 10 ? 36 : count < 100 ? 42 : 48;
  return L.divIcon({
    html: `<div style="
      background:#e09f1a;color:#fff;border-radius:9999px;
      width:${size}px;height:${size}px;
      display:flex;align-items:center;justify-content:center;
      font-size:13px;font-weight:700;font-family:system-ui,sans-serif;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      border:2px solid #fff;
    ">${count}</div>`,
    className: "",
    iconSize: [size, size],
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPinPrice(price: number): string {
  if (price >= 1_000_000)
    return `$${(price / 1_000_000).toFixed(price % 500_000 === 0 ? 0 : 1)}M`;
  if (price >= 1_000) return `$${Math.round(price / 1_000)}K`;
  return `$${price}`;
}

function createPinIcon(price: number, active: boolean): L.DivIcon {
  const bg = active ? "#c47c12" : "#e09f1a"; // gold-600 on hover, gold-500 default
  const scale = active ? "scale(1.3)" : "scale(1)";
  const label = formatPinPrice(price);
  return L.divIcon({
    className: "",
    iconSize: [80, 30],
    iconAnchor: [40, 15],
    popupAnchor: [0, -20],
    html: `
      <div style="
        display:inline-flex;align-items:center;justify-content:center;
        background:${bg};color:#fff;
        font-size:11px;font-weight:700;font-family:system-ui,sans-serif;
        padding:4px 10px;border-radius:9999px;
        box-shadow:0 2px 8px rgba(0,0,0,0.35);
        transform:${scale};
        transition:transform 200ms ease,background 200ms ease;
        white-space:nowrap;
      ">${label}</div>
    `,
  });
}

// ─── Fit bounds on mount ──────────────────────────────────────────────────────

function FitBounds({ pins }: { pins: MapPin[] }) {
  const map = useMap();
  useEffect(() => {
    if (pins.length === 0) return;
    if (pins.length === 1) {
      map.setView([pins[0].lat, pins[0].lng], 14);
      return;
    }
    const bounds = L.latLngBounds(pins.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });
  }, [map, pins]);
  return null;
}

// ─── Force tile reload when map container becomes visible ─────────────────────

function MapResizer({ visible }: { visible: boolean }) {
  const map = useMap();
  const prevVisible = useRef(false);
  useEffect(() => {
    if (visible && !prevVisible.current) {
      const t = setTimeout(() => {
        map.invalidateSize({ animate: false });
      }, 120);
      return () => clearTimeout(t);
    }
    prevVisible.current = visible;
  }, [visible, map]);
  return null;
}

// ─── MapView ──────────────────────────────────────────────────────────────────

export interface MapViewProps {
  listings: ListingCard[];
  mapPins: MapPin[];
  hoveredListingId: string | null;
  onPinHover: (id: string | null) => void;
  visible?: boolean;
}

// Compute initial center/zoom from pins so the map opens in the right place.
// Falls back to Mexico's geographic center if no pins have coordinates.
function getInitialView(pins: MapPin[]): { center: [number, number]; zoom: number } {
  if (pins.length === 0) return { center: [23.6345, -102.5528], zoom: 5 };
  if (pins.length === 1) return { center: [pins[0].lat, pins[0].lng], zoom: 13 };
  const avgLat = pins.reduce((s, p) => s + p.lat, 0) / pins.length;
  const avgLng = pins.reduce((s, p) => s + p.lng, 0) / pins.length;
  // Tighter zoom when pins are clustered in one city
  const latSpread = Math.max(...pins.map((p) => p.lat)) - Math.min(...pins.map((p) => p.lat));
  const zoom = latSpread < 0.5 ? 13 : latSpread < 2 ? 11 : 9;
  return { center: [avgLat, avgLng], zoom };
}

export function MapView({ listings, mapPins, hoveredListingId, onPinHover, visible = true }: MapViewProps) {
  const { center, zoom } = getInitialView(mapPins);

  // Persisted map style preference — safe because MapView is SSR-disabled
  const [mapStyle, setMapStyle] = useState<keyof typeof TILE_URLS>(() => {
    if (typeof window === "undefined") return "light";
    const saved = localStorage.getItem("ee-map-style") as keyof typeof TILE_URLS | null;
    return saved && saved in TILE_URLS ? saved : "light";
  });

  function toggleMapStyle() {
    setMapStyle((prev) => {
      const idx = MAP_STYLE_CYCLE.indexOf(prev);
      const next = MAP_STYLE_CYCLE[(idx + 1) % MAP_STYLE_CYCLE.length];
      localStorage.setItem("ee-map-style", next);
      return next;
    });
  }

  return (
    <div className="h-full w-full relative">
      <style>{`
        .leaflet-container { height: 100%; width: 100%; }
        .leaflet-popup-content-wrapper {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-popup-content { margin: 0 !important; }
        .leaflet-popup-tip-container { display: none; }
        .leaflet-control-attribution {
          font-size: 10px;
          opacity: 0.6;
        }
        .leaflet-control-zoom a {
          color: #e09f1a !important;
          font-weight: 700 !important;
        }
        .leaflet-control-zoom a:hover {
          color: #c47c12 !important;
          background: #fef9ec !important;
        }
        .leaflet-marker-icon { border: none !important; background: transparent !important; }
        .leaflet-popup-close-button {
          top: 6px !important;
          right: 8px !important;
          color: #94a3b8 !important;
          font-size: 18px !important;
          font-weight: 400 !important;
          line-height: 1 !important;
        }
        .leaflet-popup-close-button:hover {
          color: #475569 !important;
        }
      `}</style>

      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        {/* key forces TileLayer remount when style changes — react-leaflet doesn't update url reactively */}
        <TileLayer
          key={mapStyle}
          url={TILE_URLS[mapStyle]}
          attribution={
            mapStyle === "satellite"
              ? "Tiles &copy; Esri"
              : '&copy; <a href="https://carto.com/">CARTO</a>'
          }
          subdomains={mapStyle === "satellite" ? "" : "abcd"}
          maxZoom={19}
        />

        <FitBounds pins={mapPins} />
        <MapResizer visible={visible} />

        <MarkerClusterGroup
          iconCreateFunction={createClusterIcon}
          maxClusterRadius={60}
          showCoverageOnHover={false}
          spiderfyOnMaxZoom
        >
          {mapPins.map((pin) => {
            const fullListing = listings.find((l) => l.id === pin.id);
            return (
              <Marker
                key={pin.id}
                position={[pin.lat, pin.lng]}
                icon={createPinIcon(pin.price, hoveredListingId === pin.id)}
                eventHandlers={{
                  mouseover: () => onPinHover(pin.id),
                  mouseout: () => onPinHover(null),
                }}
              >
                <Popup minWidth={224} maxWidth={224}>
                  {fullListing ? (
                    <PropertyCard listing={fullListing} variant="mini" />
                  ) : (
                    <div style={{
                      background: "#fff",
                      borderRadius: "10px",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
                      padding: "12px 14px",
                      minWidth: 190,
                      fontFamily: "system-ui, sans-serif",
                    }}>
                      <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 13, color: "#1e293b", lineHeight: 1.35 }}>{pin.title}</p>
                      <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 15, color: "#e09f1a" }}>{formatPinPrice(pin.price)}</p>
                      <a
                        href={`/propiedades/${pin.slug}`}
                        style={{ fontSize: 12, color: "#e09f1a", fontWeight: 600, textDecoration: "none", borderBottom: "1px solid #e09f1a", paddingBottom: 1 }}
                      >
                        Ver propiedad →
                      </a>
                    </div>
                  )}
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Map style toggle — sits above Leaflet tiles; raised on mobile to avoid "Ver Mapa" FAB */}
      <button
        type="button"
        onClick={toggleMapStyle}
        aria-label="Cambiar vista del mapa"
        className="absolute bottom-20 sm:bottom-6 right-4 z-[400] flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        {MAP_STYLE_LABELS[mapStyle]}
      </button>
    </div>
  );
}
