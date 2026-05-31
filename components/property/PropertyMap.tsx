"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/Skeleton";

// Dynamic import with ssr: false is the canonical way to use Leaflet in Next.js.
// The inner component accesses window/document at module load time.
const PropertyMapInner = dynamic(
  () => import("./PropertyMapInner"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[180px] sm:h-[240px] md:h-[300px] w-full rounded-lg overflow-hidden">
        <Skeleton variant="card" className="h-full w-full rounded-lg" />
      </div>
    ),
  }
);

export interface PropertyMapProps {
  lat: number | null;
  lng: number | null;
  title: string;
  price: number;
  currency?: string;
}

export function PropertyMap({
  lat,
  lng,
  title,
  price,
  currency,
}: PropertyMapProps) {
  if (!lat || !lng) {
    return (
      <div className="h-[180px] sm:h-[240px] md:h-[300px] w-full rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <p className="text-sm text-slate-400">Ubicación no disponible</p>
      </div>
    );
  }

  return (
    <div className="h-[180px] sm:h-[240px] md:h-[300px] w-full rounded-lg overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700">
      <PropertyMapInner
        lat={lat}
        lng={lng}
        title={title}
        price={price}
        currency={currency}
      />
    </div>
  );
}
