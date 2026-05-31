"use client";

import nextDynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { ListingForm as ListingFormType } from "./ListingForm";

// ssr: false must live in a Client Component (App Router restriction).
// This wrapper keeps the heavy module graph (react-hook-form, zod, leaflet,
// next-cloudinary) out of the server render path entirely.
const ListingForm = nextDynamic(
  () => import("./ListingForm").then((m) => ({ default: m.ListingForm })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"
          />
        ))}
      </div>
    ),
  }
);

export function ListingFormDynamic(
  props: ComponentProps<typeof ListingFormType>
) {
  return <ListingForm {...props} />;
}
