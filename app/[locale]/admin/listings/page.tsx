import type { Metadata } from "next";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { ListingsClient } from "@/components/admin/ListingsClient";
import type { ListingRow } from "@/components/admin/ListingsClient";

export const metadata: Metadata = {
  title: "Propiedades — Admin | EstateElevate",
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: {
    agent?: string;
    status?: string;
    city?: string;
    search?: string;
    page?: string;
  };
}) {
  const db = getSupabaseServiceClient();
  const page = Math.max(0, parseInt(searchParams.page ?? "0") || 0);

  let query = db
    .from("listings")
    .select(
      `id, title, city, price, currency, status, featured, views, created_at, images, agent_id,
       profiles!agent_id(full_name, email)`,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  if (searchParams.agent) query = query.eq("agent_id", searchParams.agent);
  if (searchParams.status && searchParams.status !== "all")
    query = query.eq("status", searchParams.status);
  if (searchParams.city?.trim())
    query = query.ilike("city", `%${searchParams.city.trim()}%`);
  if (searchParams.search?.trim())
    query = query.ilike("title", `%${searchParams.search.trim()}%`);

  const { data: listings, count } = await query;

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

  const total = count ?? 0;

  return (
    <div className="px-4 sm:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-slate-100 mb-1">
          Propiedades
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {total.toLocaleString("es-MX")} propiedades en total
        </p>
      </div>
      <ListingsClient
        listings={rows}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        initialSearch={searchParams.search ?? ""}
        initialStatus={(searchParams.status as "all" | "active" | "draft" | "pending" | "sold") ?? "all"}
        initialCity={searchParams.city ?? ""}
      />
    </div>
  );
}
