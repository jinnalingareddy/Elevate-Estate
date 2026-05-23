"use client";

import { createContext, useContext } from "react";
import type { PlanType } from "./supabase/types";

export interface PlanData {
  name: string;
  listingLimit: number;
  featuredListings: number;
  priceMonthly: number;
  conektaPlanId: string | null;
}

export interface PayPerListingData {
  price: number;
  currency: string;
  description: string;
  conektaProductId: string;
  validityDays: number;
}

export interface PlanConfigValue {
  plans: Record<PlanType, PlanData>;
  payPerListing: PayPerListingData;
}

const PlanConfigContext = createContext<PlanConfigValue | null>(null);

export function PlanConfigProvider({
  value,
  children,
}: {
  value: PlanConfigValue;
  children: React.ReactNode;
}) {
  return (
    <PlanConfigContext.Provider value={value}>
      {children}
    </PlanConfigContext.Provider>
  );
}

export function usePlanConfig(): PlanConfigValue {
  const ctx = useContext(PlanConfigContext);
  if (!ctx) throw new Error("usePlanConfig must be used inside PlanConfigProvider");
  return ctx;
}
