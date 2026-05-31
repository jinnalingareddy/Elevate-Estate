import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { redirect, Link } from "@/lib/navigation";
import { ChevronLeft } from "lucide-react";
import { getAuthUser, getSupabaseServerClient } from "@/lib/supabase/server";
import { getAgentSubscription } from "@/lib/supabase/queries/subscriptions";
import { AgentSidebar } from "@/components/layout/AgentSidebar";
import { ListingForm } from "@/components/agent/ListingForm";

export const metadata: Metadata = {
  title: "Editar propiedad — EstateElevate",
};

export const dynamic = "force-dynamic";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) redirect("/agent/auth");

  const supabase = await getSupabaseServerClient();

  const [listingRes, subscription] = await Promise.all([
    supabase.from("listings").select("*").eq("id", id).single(),
    getAgentSubscription(user.id).catch(() => null),
  ]);

  if (listingRes.error || !listingRes.data) notFound();
  const listing = listingRes.data;

  if (listing.agent_id !== user.id) notFound();

  const agentPlan = (subscription?.plan ?? "free") as "free" | "pro" | "elite";

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <AgentSidebar />
      <main className="flex-1 lg:pl-64">
        <div className="px-4 sm:px-8 pb-8 pt-14 lg:pt-8 max-w-3xl">
          <Link
            href="/agent/listings"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors mb-6"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Mis propiedades
          </Link>

          <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-slate-100 mb-2">
            Editar propiedad
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 truncate">
            {listing.title}
          </p>

          <ListingForm
            mode="edit"
            initialData={listing}
            agentId={user.id}
            agentPlan={agentPlan}
          />
        </div>
      </main>
    </div>
  );
}
