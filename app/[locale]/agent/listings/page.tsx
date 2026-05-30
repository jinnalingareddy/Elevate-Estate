import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/server";
import { getAgentListings } from "@/lib/supabase/queries/listings";
import { getLeadCountsByListing } from "@/lib/supabase/queries/leads";
import { getListingLimitInfo } from "@/lib/listing-limits";
import { AgentSidebar } from "@/components/layout/AgentSidebar";
import { ListingsPageShell } from "@/components/agent/ListingsPageShell";

export const metadata: Metadata = {
  title: "Mis Propiedades — EstateElevate",
};

export const dynamic = "force-dynamic";

const LIMIT = 50;

export default async function ListingsPage({
  searchParams,
}: {
  searchParams?: { page?: string };
}) {
  const user = await getAuthUser();
  if (!user) redirect("/agent/auth");

  const agentId = user.id;
  const page = Math.max(1, Number(searchParams?.page ?? 1));

  // Start limitInfo immediately (independent). Await listings only to get IDs for
  // lead counts — all three fetches overlap as much as possible.
  const limitInfoPromise = getListingLimitInfo(agentId).catch(() => ({
    plan: "free" as const,
    planLimit: 1,
    activeListings: 0,
    paidSlots: 0,
    available: 1,
  }));

  const { data: listings, total } = await getAgentListings(agentId, {
    page,
    limit: LIMIT,
  }).catch(() => ({ data: [], total: 0 }));

  const listingIds = listings.map((l) => l.id);
  const totalPages = Math.ceil(total / LIMIT);

  const [limitInfo, leadCounts] = await Promise.all([
    limitInfoPromise,
    getLeadCountsByListing(listingIds).catch(() => ({})),
  ]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <AgentSidebar />
      <main className="flex-1 lg:pl-64">
        <div className="px-4 sm:px-8 pb-8 pt-14 lg:pt-8">
          <ListingsPageShell
            initialListings={listings}
            leadCounts={leadCounts}
            limitInfo={limitInfo}
          />

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4">
              {page > 1 ? (
                <Link
                  href={`?page=${page - 1}`}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  ← Anterior
                </Link>
              ) : (
                <span className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-400 dark:border-slate-800 dark:text-slate-600 cursor-not-allowed">
                  ← Anterior
                </span>
              )}

              <span className="text-sm text-slate-600 dark:text-slate-400">
                Página {page} de {totalPages}
              </span>

              {page < totalPages ? (
                <Link
                  href={`?page=${page + 1}`}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Siguiente →
                </Link>
              ) : (
                <span className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-400 dark:border-slate-800 dark:text-slate-600 cursor-not-allowed">
                  Siguiente →
                </span>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
