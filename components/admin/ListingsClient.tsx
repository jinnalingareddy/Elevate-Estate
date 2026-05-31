"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Search, Trash2, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/Switch";
import { Badge } from "@/components/ui/Badge";
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/DropdownMenu";
import { cn, formatPrice } from "@/lib/utils";
import type { Listing, ListingStatus } from "@/lib/supabase/types";

export type ListingRow = Pick<
  Listing,
  | "id"
  | "title"
  | "city"
  | "price"
  | "currency"
  | "status"
  | "featured"
  | "views"
  | "created_at"
  | "images"
> & {
  agent_name: string | null;
  agent_id: string;
};

const STATUS_LABELS: Record<ListingStatus, string> = {
  active: "Activo",
  draft: "Borrador",
  pending: "Pendiente",
  sold: "Vendido",
};

const STATUS_VARIANTS: Record<
  ListingStatus,
  "success" | "default" | "warning" | "error"
> = {
  active: "success",
  draft: "default",
  pending: "warning",
  sold: "error",
};

function ConfirmDeleteModal({
  title,
  onConfirm,
  onCancel,
  loading,
}: {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 shadow-xl">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Eliminar propiedad
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
          ¿Eliminar <span className="font-medium text-slate-700 dark:text-slate-300">&ldquo;{title}&rdquo;</span>? Esta acción no se puede deshacer y eliminará las imágenes de Cloudinary.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {loading ? "Eliminando…" : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ListingsClient({
  listings,
  total,
  page,
  pageSize,
  initialSearch,
  initialStatus,
  initialCity,
}: {
  listings: ListingRow[];
  total: number;
  page: number;
  pageSize: number;
  initialSearch: string;
  initialStatus: ListingStatus | "all";
  initialCity: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<ListingStatus | "all">(initialStatus);
  const [cityFilter, setCityFilter] = useState(initialCity);
  const [loadingFeature, setLoadingFeature] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ListingRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [featuredOverrides, setFeaturedOverrides] = useState<Record<string, boolean>>({});

  function pushFilters(overrides: { search?: string; status?: string; city?: string; page?: number }) {
    const params = new URLSearchParams(searchParams.toString());
    const s = overrides.search ?? search;
    const st = overrides.status ?? statusFilter;
    const c = overrides.city ?? cityFilter;
    const p = overrides.page ?? 0;

    s ? params.set("search", s) : params.delete("search");
    st !== "all" ? params.set("status", st) : params.delete("status");
    c ? params.set("city", c) : params.delete("city");
    p > 0 ? params.set("page", String(p)) : params.delete("page");

    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  // Debounce text inputs so we don't push a new URL on every keystroke
  useEffect(() => {
    const id = setTimeout(() => pushFilters({ search, page: 0 }), 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    const id = setTimeout(() => pushFilters({ city: cityFilter, page: 0 }), 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityFilter]);

  const totalPages = Math.ceil(total / pageSize);

  async function handleFeatureToggle(listing: ListingRow) {
    const next =
      featuredOverrides[listing.id] !== undefined
        ? !featuredOverrides[listing.id]
        : !listing.featured;

    setFeaturedOverrides((prev) => ({ ...prev, [listing.id]: next }));
    setLoadingFeature(listing.id);

    try {
      const res = await fetch(`/api/admin/listings/${listing.id}/feature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: next }),
      });
      if (!res.ok) throw new Error();
      startTransition(() => router.refresh());
    } catch {
      // Revert optimistic update on error
      setFeaturedOverrides((prev) => ({
        ...prev,
        [listing.id]: !next,
      }));
    } finally {
      setLoadingFeature(null);
    }
  }

  async function handleStatusChange(id: string, status: ListingStatus) {
    try {
      await fetch(`/api/admin/listings/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      startTransition(() => router.refresh());
    } catch {
      // silent — page will retain old value
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/listings/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setDeleteTarget(null);
      startTransition(() => router.refresh());
    } catch {
      alert("Error al eliminar la propiedad");
    } finally {
      setDeleting(false);
    }
  }

  const statusOptions: { value: ListingStatus | "all"; label: string }[] = [
    { value: "all", label: "Todos" },
    { value: "active", label: "Activo" },
    { value: "draft", label: "Borrador" },
    { value: "pending", label: "Pendiente" },
    { value: "sold", label: "Vendido" },
  ];

  return (
    <>
      {deleteTarget && (
        <ConfirmDeleteModal
          title={deleteTarget.title}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden />
          <input
            type="text"
            placeholder="Buscar por título…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              "pl-9 pr-4 py-2 text-sm rounded-lg w-48",
              "border border-slate-200 dark:border-slate-700",
              "bg-white dark:bg-slate-900",
              "text-slate-900 dark:text-slate-100",
              "placeholder-slate-400",
              "focus:outline-none focus:ring-2 focus:ring-gold-500"
            )}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            const v = e.target.value as ListingStatus | "all";
            setStatusFilter(v);
            pushFilters({ status: v, page: 0 });
          }}
          className={cn(
            "px-3 py-2 text-sm rounded-lg",
            "border border-slate-200 dark:border-slate-700",
            "bg-white dark:bg-slate-900",
            "text-slate-900 dark:text-slate-100",
            "focus:outline-none focus:ring-2 focus:ring-gold-500"
          )}
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Ciudad…"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className={cn(
            "px-4 py-2 text-sm rounded-lg w-36",
            "border border-slate-200 dark:border-slate-700",
            "bg-white dark:bg-slate-900",
            "text-slate-900 dark:text-slate-100",
            "placeholder-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-gold-500"
          )}
        />
      </div>

      {/* Table */}
      <div
        className={cn(
          "rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden",
          (isPending) && "opacity-70"
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400 w-64">
                  Propiedad
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">
                  Agente
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">
                  Ciudad
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-400">
                  Precio
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">
                  Estado
                </th>
                <th className="px-4 py-3 text-center font-semibold text-slate-600 dark:text-slate-400">
                  Featured
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-400">
                  Vistas
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">
                  Publicado
                </th>
                <th className="px-4 py-3" aria-label="Acciones" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {listings.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-12 text-center text-slate-400"
                  >
                    No se encontraron propiedades
                  </td>
                </tr>
              ) : (
                listings.map((listing) => {
                  const isFeatured =
                    featuredOverrides[listing.id] !== undefined
                      ? featuredOverrides[listing.id]
                      : listing.featured;

                  return (
                    <tr
                      key={listing.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Thumbnail + title */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {listing.images[0] ? (
                            <Image
                              src={listing.images[0].thumbnail_url}
                              alt=""
                              width={56}
                              height={40}
                              className="h-10 w-14 rounded-md object-cover shrink-0"
                            />
                          ) : (
                            <div className="h-10 w-14 rounded-md bg-slate-100 dark:bg-slate-700 shrink-0" />
                          )}
                          <p className="font-medium text-slate-900 dark:text-slate-100 line-clamp-1 max-w-[160px]">
                            {listing.title}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {listing.agent_name ?? "—"}
                      </td>

                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {listing.city}
                      </td>

                      <td className="px-4 py-3 text-right font-medium text-slate-800 dark:text-slate-200 tabular-nums whitespace-nowrap">
                        {formatPrice(listing.price, listing.currency)}
                      </td>

                      {/* Status dropdown */}
                      <td className="px-4 py-3">
                        <DropdownMenuRoot>
                          <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded">
                              <Badge
                                variant={STATUS_VARIANTS[listing.status]}
                                dot
                                size="sm"
                              >
                                {STATUS_LABELS[listing.status]}
                              </Badge>
                              <ChevronDown className="h-3 w-3 text-slate-400" aria-hidden />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            {(
                              Object.keys(STATUS_LABELS) as ListingStatus[]
                            ).map((s) => (
                              <DropdownMenuItem
                                key={s}
                                onSelect={() =>
                                  handleStatusChange(listing.id, s)
                                }
                              >
                                <Badge
                                  variant={STATUS_VARIANTS[s]}
                                  dot
                                  size="sm"
                                >
                                  {STATUS_LABELS[s]}
                                </Badge>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenuRoot>
                      </td>

                      {/* Featured toggle */}
                      <td className="px-4 py-3 text-center">
                        <Switch
                          checked={isFeatured}
                          onCheckedChange={() => handleFeatureToggle(listing)}
                          disabled={loadingFeature === listing.id}
                          aria-label="Destacar propiedad"
                        />
                      </td>

                      <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-400">
                        {listing.views.toLocaleString("es-MX")}
                      </td>

                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
                        {new Date(listing.created_at).toLocaleDateString(
                          "es-MX",
                          { year: "numeric", month: "short", day: "numeric" }
                        )}
                      </td>

                      {/* Delete */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setDeleteTarget(listing)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          aria-label="Eliminar propiedad"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            {listings.length === 0
              ? "Sin resultados"
              : `${page * pageSize + 1}–${page * pageSize + listings.length} de ${total.toLocaleString("es-MX")} propiedades`}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => pushFilters({ page: page - 1 })}
                disabled={page === 0 || isPending}
                className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-slate-500">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => pushFilters({ page: page + 1 })}
                disabled={page >= totalPages - 1 || isPending}
                className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                aria-label="Página siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
