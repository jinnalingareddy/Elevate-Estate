"use client";

import { useState, useRef, useTransition, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useI18nRouter } from "@/lib/navigation";
import {
  Building2,
  Edit2,
  Eye,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { UpgradeModal } from "@/components/agent/UpgradeModal";
import { useToast } from "@/components/providers/ToastProvider";
import { cn, formatPrice } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Listing, ListingStatus } from "@/lib/supabase/types";
import type { ListingLimitInfo } from "@/lib/listing-limits";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<
  ListingStatus,
  { variant: "success" | "warning" | "default" | "error"; label: string }
> = {
  active: { variant: "success", label: "Activo" },
  pending: { variant: "warning", label: "Pendiente" },
  sold: { variant: "default", label: "Vendido" },
  draft: { variant: "warning", label: "Borrador" },
};

const NEXT_STATUS: Partial<Record<ListingStatus, ListingStatus>> = {
  active: "draft",
  draft: "active",
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ListingsPageShellProps {
  initialListings: Listing[];
  leadCounts: Record<string, number>;
  limitInfo: ListingLimitInfo;
}

// ─── Row menu ─────────────────────────────────────────────────────────────────

interface RowMenuProps {
  listing: Listing;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}

function RowMenu({ listing, onEdit, onToggle, onDelete }: RowMenuProps) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const next = NEXT_STATUS[listing.status];

  function handleOpen() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setOpen((v) => !v);
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        aria-label="Acciones"
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden />
      </button>

      <>
        {open && (
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
        )}
        <div
          aria-hidden={!open}
          style={{ top: menuPos.top, right: menuPos.right }}
          className={cn(
            "fixed z-20 w-44",
            "bg-white dark:bg-slate-800 rounded-lg shadow-lg",
            "border border-slate-200 dark:border-slate-700",
            "py-1 overflow-hidden",
            "transition-all duration-150 origin-top-right",
            open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
          )}
        >
          <button
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            onClick={() => { setOpen(false); onEdit(); }}
          >
            <Edit2 className="h-4 w-4 text-slate-400" aria-hidden />
            Editar
          </button>
          <a
            href={`/propiedades/${listing.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            onClick={() => setOpen(false)}
          >
            <Eye className="h-4 w-4 text-slate-400" aria-hidden />
            Ver publicación
          </a>
          {next && (
            <button
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              onClick={() => { setOpen(false); onToggle(); }}
            >
              <Building2 className="h-4 w-4 text-slate-400" aria-hidden />
              {next === "active" ? "Activar" : "Pausar"}
            </button>
          )}
          <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
          <button
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={() => { setOpen(false); onDelete(); }}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Eliminar
          </button>
        </div>
      </>
    </div>
  );
}

// ─── ListingsPageShell ────────────────────────────────────────────────────────

export function ListingsPageShell({
  initialListings,
  leadCounts,
  limitInfo,
}: ListingsPageShellProps) {
  const router = useRouter();       // for router.refresh()
  const i18nRouter = useI18nRouter(); // for locale-aware navigation
  const { addToast } = useToast();
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [deleteTarget, setDeleteTarget] = useState<Listing | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [, startTransition] = useTransition();

  async function handleToggleStatus(listing: Listing) {
    const next = NEXT_STATUS[listing.status];
    if (!next) return;

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from("listings")
      .update({ status: next })
      .eq("id", listing.id);

    if (error) {
      addToast("Error al actualizar", { variant: "error", description: error.message });
      return;
    }

    setListings((prev) =>
      prev.map((l) => (l.id === listing.id ? { ...l, status: next } : l))
    );
    addToast(
      next === "active" ? "Propiedad activada" : "Propiedad pausada",
      { variant: "success" }
    );
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("id", deleteTarget.id);

    if (error) {
      addToast("Error al eliminar", { variant: "error", description: error.message });
      setDeleteTarget(null);
      return;
    }

    setListings((prev) => prev.filter((l) => l.id !== deleteTarget.id));
    addToast("Propiedad eliminada", { variant: "success" });
    setDeleteTarget(null);
    startTransition(() => router.refresh());
  }

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const l of listings) c[l.status] = (c[l.status] ?? 0) + 1;
    return c;
  }, [listings]);

  return (
    <>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-slate-100">
            Mis Propiedades
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {listings.length} propiedad{listings.length !== 1 ? "es" : ""}
          </p>
        </div>

        {limitInfo.available > 0 ? (
          <Button asChild variant="primary">
            <Link href="/agent/listings/new">
              <Plus className="h-4 w-4 mr-2" aria-hidden />
              Nueva propiedad
            </Link>
          </Button>
        ) : (
          <Button variant="primary" onClick={() => setUpgradeOpen(true)}>
            <Plus className="h-4 w-4 mr-2" aria-hidden />
            Nueva propiedad
          </Button>
        )}
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {(["active", "draft", "pending", "sold"] as ListingStatus[]).map((status) => {
          const count = statusCounts[status] ?? 0;
          const { variant, label } = STATUS_STYLES[status];
          return (
            <div
              key={status}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3"
            >
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {count}
              </p>
              <Badge variant={variant} className="mt-1">
                {label}
              </Badge>
            </div>
          );
        })}
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 py-20 text-center">
          <Building2 className="h-10 w-10 text-slate-300 dark:text-slate-600" aria-hidden />
          <p className="text-slate-500 dark:text-slate-400">
            No tienes propiedades aún.
          </p>
          <Button asChild variant="primary" size="sm">
            <Link href="/agent/listings/new">Publicar primera propiedad</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                    Propiedad
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 hidden sm:table-cell">
                    Precio
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 hidden md:table-cell">
                    Estado
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 hidden lg:table-cell">
                    Vistas
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 hidden lg:table-cell">
                    Leads
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {listings.map((listing) => {
                  const cover = listing.images[0];
                  const { variant, label } = STATUS_STYLES[listing.status];
                  return (
                    <tr
                      key={listing.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Title + thumbnail */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {cover ? (
                            <Image
                              src={cover.thumbnail_url}
                              alt={listing.title}
                              width={56}
                              height={40}
                              className="h-10 w-14 rounded-lg object-cover shrink-0"
                              loading="lazy"
                            />
                          ) : (
                            <div className="h-10 w-14 rounded-lg bg-slate-100 dark:bg-slate-700 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[160px] sm:max-w-[220px]">
                              {listing.title}
                            </p>
                            <p className="text-xs text-slate-400 truncate">
                              {listing.city}, {listing.state}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3 hidden sm:table-cell font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {formatPrice(listing.price, listing.currency)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Badge variant={variant}>{label}</Badge>
                      </td>

                      {/* Views */}
                      <td className="px-4 py-3 hidden lg:table-cell text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" aria-hidden />
                          {listing.views.toLocaleString("es-MX")}
                        </span>
                      </td>

                      {/* Leads */}
                      <td className="px-4 py-3 hidden lg:table-cell text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5" aria-hidden />
                          {leadCounts[listing.id] ?? 0}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <RowMenu
                          listing={listing}
                          onEdit={() => i18nRouter.push(`/agent/listings/${listing.id}/edit`)}
                          onToggle={() => handleToggleStatus(listing)}
                          onDelete={() => setDeleteTarget(listing)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Delete confirm modal ─────────────────────────────────────────── */}
      <Modal
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="¿Eliminar propiedad?"
      >
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
          Se eliminará permanentemente{" "}
          <strong className="text-slate-900 dark:text-slate-100">
            {deleteTarget?.title}
          </strong>
          . Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => setDeleteTarget(null)}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            className="bg-red-600 hover:bg-red-700 focus-visible:ring-red-600"
            onClick={handleDelete}
          >
            Eliminar
          </Button>
        </div>
      </Modal>

      {/* ── Upgrade modal ───────────────────────────────────────────────── */}
      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        limitInfo={limitInfo}
      />
    </>
  );
}
