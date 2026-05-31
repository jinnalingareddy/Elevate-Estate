import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

const locales = ["es", "en"] as const;
type Locale = (typeof locales)[number];

function isLocale(value: unknown): value is Locale {
  return locales.includes(value as Locale);
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const cookieLocale = (await cookies()).get("locale")?.value;
  const locale: Locale = isLocale(requested)
    ? requested
    : isLocale(cookieLocale)
      ? cookieLocale
      : "es";

  if (!isLocale(locale)) notFound();

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    timeZone: "America/Mexico_City",
  };
});
