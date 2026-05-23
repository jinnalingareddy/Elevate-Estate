import type { PlanType } from "./supabase/types";

export const config = {
  plans: {
    free: {
      name: "Free",
      listingLimit: Number(process.env.LISTING_LIMIT_FREE ?? 1),
      featuredListings: 0,
      priceMonthly: 0,
      conektaPlanId: null as string | null,
    },
    pro: {
      name: "Pro",
      listingLimit: Number(process.env.LISTING_LIMIT_PRO ?? 10),
      featuredListings: 2,
      priceMonthly: Number(process.env.PRICE_PRO ?? 799),
      conektaPlanId: "plan_pro_mensual" as string | null,
    },
    elite: {
      name: "Elite",
      listingLimit: Number(process.env.LISTING_LIMIT_ELITE ?? 50),
      featuredListings: 10,
      priceMonthly: Number(process.env.PRICE_ELITE ?? 1999),
      conektaPlanId: "plan_elite_mensual" as string | null,
    },
  } satisfies Record<
    PlanType,
    {
      name: string;
      listingLimit: number;
      featuredListings: number;
      priceMonthly: number;
      conektaPlanId: string | null;
    }
  >,

  payPerListing: {
    // PRICE_PER_LISTING is in MXN pesos; stored internally as cents
    price: Number(process.env.PRICE_PER_LISTING ?? 299) * 100,
    currency: "MXN" as const,
    description: "Publicación de propiedad — EstateElevate",
    conektaProductId: "prod_listing_slot",
    validityDays: 365,
  },

  app: {
    name: "EstateElevate",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "https://estateelevate.mx",
    supportEmail: "soporte@estateelevate.mx",
    defaultLocale: "es" as const,
    locales: ["es", "en"] as const,
  },
};

export type PlanConfig = (typeof config.plans)[PlanType];
