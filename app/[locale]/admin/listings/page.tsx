import type { Metadata } from "next";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { ListingsClient } from "@/components/admin/ListingsClient";
import type { ListingRow } from "@/components/admin/ListingsClient";

export const metadata: Metadata = {
  title: "Propiedades — Admin | EstateElevate",
};

export const dynamic = "force-dynamic";

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: { agent?: string };
}) {
  const db = getSupabaseServiceClient();

  const { data: listings } = await db
    .from("listings")
    .select(
      `id, title, city, price, currency, status, featured, views, created_at, images, agent_id,
       profiles!agent_id(full_name, email)`
    )
    .order("created_at", { ascending: false });

  const rows: ListingRow[] = (listings ?? []).map((l) => {
    const raw = l.profiles as unknown;
    const profile = (
      Array.isArray(raw) ? raw[0] : raw
    ) as { full_name: string | null; email: string } | null | undefined;
    return {
      id: l.id,
      title: l.title,
      city: l.city,
      price: l.price,
      currency: l.currency,
      status: l.status,
      featured: l.featured,
      views: l.views,
      created_at: l.created_at,
      images: l.images ?? [],
      agent_id: l.agent_id,
      agent_name: profile?.full_name ?? profile?.email ?? null,
    };
  });

  return (
    <div className="px-4 sm:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-slate-100 mb-1">
          Propiedades
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {rows.length} propiedades en total
        </p>
      </div>
      <ListingsClient listings={rows} agentFilter={searchParams.agent} />
    </div>
  );
}
