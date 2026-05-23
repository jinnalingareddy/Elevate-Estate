import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { FavoritesProvider } from "@/components/providers/FavoritesProvider";
import { ClientAuthProvider } from "@/components/providers/ClientAuthProvider";
import { AgentPreviewBar } from "@/components/layout/AgentPreviewBar";

const locales = ["es", "en"] as const;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;

  if (!locales.includes(locale as (typeof locales)[number])) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ThemeProvider>
        <ClientAuthProvider>
          <FavoritesProvider>
            <ToastProvider>
              {/* Rendered on every public page; hides itself on /agent and /admin routes */}
              <AgentPreviewBar />
              {children}
            </ToastProvider>
          </FavoritesProvider>
        </ClientAuthProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
