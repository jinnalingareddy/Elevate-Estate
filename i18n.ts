// Root i18n configuration — shared across routing, middleware, and server helpers
export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "es";
