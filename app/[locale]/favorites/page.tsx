import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Heart } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { PropertyCard } from "@/components/property/PropertyCard";
import { Link } from "@/lib/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Listing } from "@/lib/supabase/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("favorites");
  return { title: `${t("title")} — EstateElevate` };
}

export default async function FavoritesPage() {
  const t = await getTranslations("favorites");
  const tNav = await getTranslations("nav");

  let favorites: Listing[] = [];
  let isAuthenticated = false;

  try {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      isAuthenticated = true;

      const { data } = await supabase
        .from("favorites")
        .select("listings(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        favorites = data
          .map((f: { listings: unknown }) => f.listings as Listing)
          .filter(Boolean);
      }
    }
  } catch {
    // DB not connected or Supabase not configured — show empty state
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen pt-16 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20">
              <Heart className="h-5 w-5 text-red-500 fill-red-500" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-serif text-slate-900 dark:text-slate-100">
                {t("title")}
              </h1>
              {isAuthenticated && favorites.length > 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {t("count", { count: favorites.length })}
                </p>
              )}
            </div>
          </div>

          {/* Not authenticated */}
          {!isAuthenticated && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5">
                <Heart className="h-8 w-8 text-slate-400" aria-hidden />
              </div>
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
                {t("loginRequired")}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">
                {t("loginDesc")}
              </p>
              <Button asChild variant="primary" size="lg">
                <Link href="/agent/auth">{tNav("login")}</Link>
              </Button>
            </div>
          )}

          {/* Authenticated but no favorites */}
          {isAuthenticated && favorites.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5">
                <Heart className="h-8 w-8 text-slate-400" aria-hidden />
              </div>
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
                {t("empty")}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">
                {t("emptyDesc")}
              </p>
              <Button asChild variant="primary" size="lg">
                <Link href="/search">{t("browse")}</Link>
              </Button>
            </div>
          )}

          {/* Favorites grid */}
          {isAuthenticated && favorites.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((listing, idx) => (
                <PropertyCard
                  key={listing.id}
                  listing={listing}
                  variant="vertical"
                  priority={idx < 3}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
