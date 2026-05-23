import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getAgentListings } from "@/lib/supabase/queries/listings";
import { getLeadCountsByListing } from "@/lib/supabase/queries/leads";
import { getListingLimitInfo } from "@/lib/listing-limits";
import { AgentSidebar } from "@/components/layout/AgentSidebar";
import { ListingsPageShell } from "@/components/agent/ListingsPageShell";

export const metadata: Metadata = {
  title: "Mis Propiedades — EstateElevate",
};

export const dynamic = "force-dynamic";

export default async function ListingsPage() {
  const supabase = getSupabaseServerClient();
  // Middleware already validated the JWT — getSession() is safe here and avoids
  // a second network round-trip to the Supabase Auth server.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/agent/auth");

  const agentId = session.user.id;

  const [listings, limitInfo] = await Promise.all([
    getAgentListings(agentId).catch(() => []),
    getListingLimitInfo(agentId).catch(() => ({
      plan: "free" as const,
      planLimit: 1,
      activeListings: 0,
      paidSlots: 0,
      available: 1,
    })),
  ]);

  // Use a COUNT+GROUP BY RPC instead of fetching all lead rows.
  const listingIds = listings.map((l) => l.id);
  const leadCounts = await getLeadCountsByListing(listingIds).catch(() => ({}));

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
        </div>
      </main>
    </div>
  );
}
