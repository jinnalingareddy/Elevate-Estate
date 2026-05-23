"use client";

// This file is ONLY loaded client-side via next/dynamic (ssr: false).
// Leaflet accesses window/document so it must never run on the server.

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { formatPrice } from "@/lib/utils";

// ─── Fix Leaflet's broken default icon URLs in webpack/Next.js ───────────────

function FixLeafletIcons() {
  useEffect(() => {
    // Dynamic import keeps this server-safe even though this file has ssr:false
    import("leaflet").then((L) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
    });
  }, []);
  return null;
}

// ─── Gold circle marker ───────────────────────────────────────────────────────

function useGoldIcon() {
  // We build the icon lazily to avoid accessing `L` at module parse time.
  // Safe because this module is only ever loaded in the browser.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const L = require("leaflet") as typeof import("leaflet");

  return L.divIcon({
    html: `<div style="
      width:16px;
      height:16px;
      border-radius:50%;
      background:#e09f1a;
      border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -12],
    className: "",
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PropertyMapInnerProps {
  lat: number;
  lng: number;
  title: string;
  price: number;
  currency?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PropertyMapInner({
  lat,
  lng,
  title,
  price,
  currency = "MXN",
}: PropertyMapInnerProps) {
  const goldIcon = useGoldIcon();

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <style>{`
        .property-map .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
          border-radius: 8px !important;
          overflow: hidden;
        }
        .property-map .leaflet-control-zoom a {
          color: #e09f1a !important;
          font-weight: 700 !important;
          border: none !important;
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .property-map .leaflet-control-zoom a:last-child {
          border-bottom: none !important;
        }
        .property-map .leaflet-control-zoom a:hover {
          color: #c47c12 !important;
          background: #fef9ec !important;
        }
        .property-map .leaflet-control-attribution {
          font-size: 10px;
          opacity: 0.6;
        }
      `}</style>
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      style={{ height: "100%", width: "100%" }}
      className="property-map rounded-lg z-0"
      scrollWheelZoom
    >
      <FixLeafletIcons />

      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      <Marker position={[lat, lng]} icon={goldIcon}>
        <Popup>
          <div className="text-sm">
            <p className="font-semibold text-slate-900 mb-0.5 line-clamp-2">
              {title}
            </p>
            <p className="text-gold-600 font-bold">
              {formatPrice(price)} {currency}
            </p>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
    </div>
  );
}
