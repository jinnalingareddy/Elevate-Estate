import { createSharedPathnamesNavigation } from "next-intl/navigation";

export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];

export const {
  Link,
  redirect,
  useRouter: useI18nRouter,
  usePathname: useI18nPathname,
} = createSharedPathnamesNavigation({ locales });
