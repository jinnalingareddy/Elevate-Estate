import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getListingLimitInfo, canCreateListing } from "@/lib/listing-limits";
import { getAgentSubscription } from "@/lib/supabase/queries/subscriptions";
import { AgentSidebar } from "@/components/layout/AgentSidebar";
import { ListingForm } from "@/components/agent/ListingForm";
import { config } from "@/lib/config";

export const metadata: Metadata = {
  title: "Nueva propiedad — EstateElevate",
};

export const dynamic = "force-dynamic";

export default async function NewListingPage() {
  const supabase = getSupabaseServerClient();
  // Middleware already validated the JWT — getSession() is safe here and avoids
  // a second network round-trip to the Supabase Auth server.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/agent/auth");

  const agentId = session.user.id;

  const [canCreate, subscription] = await Promise.all([
    canCreateListing(agentId).catch(() => false),
    getAgentSubscription(agentId).catch(() => null),
  ]);

  const agentPlan = (subscription?.plan ?? "free") as "free" | "pro" | "elite";

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <AgentSidebar />
      <main className="flex-1 lg:pl-64">
        <div className="px-4 sm:px-8 pb-8 pt-14 lg:pt-8 max-w-3xl">
          {/* Back link */}
          <Link
            href="/agent/listings"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors mb-6"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Mis propiedades
          </Link>

          <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-slate-100 mb-8">
            Nueva propiedad
          </h1>

          {canCreate ? (
            <ListingForm mode="create" agentId={agentId} agentPlan={agentPlan} />
          ) : (
            <div className="rounded-2xl border border-gold-200 dark:border-gold-800 bg-gold-50 dark:bg-gold-900/20 p-8 text-center">
              <p className="text-lg font-semibold text-gold-800 dark:text-gold-300 mb-2">
                Límite de propiedades alcanzado
              </p>
              <p className="text-sm text-gold-700 dark:text-gold-400 mb-6">
                Tu plan{" "}
                <strong>{config.plans[agentPlan].name}</strong> permite hasta{" "}
                <strong>{config.plans[agentPlan].listingLimit}</strong>{" "}
                propiedad{config.plans[agentPlan].listingLimit !== 1 ? "es" : ""} activa. Actualiza tu plan
                o compra una publicación individual para continuar.
              </p>
              <div className="flex justify-center gap-3 flex-wrap">
                <Link
                  href="/agent/plans"
                  className="inline-flex items-center justify-center h-10 px-5 rounded-lg bg-gold-600 hover:bg-gold-700 text-white text-sm font-medium transition-colors"
                >
                  Ver planes
                </Link>
                <Link
                  href="/agent/listings"
                  className="inline-flex items-center justify-center h-10 px-5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Mis propiedades
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
