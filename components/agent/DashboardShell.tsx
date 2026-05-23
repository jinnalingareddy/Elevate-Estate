"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AlertTriangle, Plus } from "lucide-react";
import { ListingCard } from "@/components/agent/ListingCard";
import { UpgradeModal } from "@/components/agent/UpgradeModal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { DashboardStatsProps } from "@/components/agent/DashboardStats";
import type { Listing } from "@/lib/supabase/types";
import type { ListingLimitInfo } from "@/lib/listing-limits";

const DashboardStats = dynamic(
  () => import("@/components/agent/DashboardStats").then(mod => ({ default: mod.DashboardStats })),
  { ssr: false, loading: () => <div className="animate-pulse h-32 rounded-xl bg-slate-100 dark:bg-slate-800" /> }
);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardShellProps {
  stats: DashboardStatsProps;
  listings: Listing[];
  limitInfo: ListingLimitInfo;
  warningBanner: string | null;
}

// ─── DashboardShell ───────────────────────────────────────────────────────────

export function DashboardShell({
  stats,
  listings,
  limitInfo,
  warningBanner,
}: DashboardShellProps) {
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  // Auto-open upgrade modal if agent has no slots left
  useEffect(() => {
    if (limitInfo.available === 0 && limitInfo.plan === "free") {
      const timer = setTimeout(() => setUpgradeOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, [limitInfo.available, limitInfo.plan]);

  return (
    <>
      {/* ── Warning banner ──────────────────────────────────────────────── */}
      {warningBanner && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
          <p className="text-sm text-amber-800 dark:text-amber-300">{warningBanner}</p>
          <Button
            variant="secondary"
            size="sm"
            className="ml-auto shrink-0"
            onClick={() => setUpgradeOpen(true)}
          >
            Ver planes
          </Button>
        </div>
      )}

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <DashboardStats {...stats} />

      {/* ── Portfolio ───────────────────────────────────────────────────── */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold font-serif text-slate-900 dark:text-slate-100">
            Mis Propiedades
          </h2>
          <div className="flex items-center gap-3">
            {limitInfo.available === 0 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setUpgradeOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1.5" aria-hidden />
                Agregar propiedad
              </Button>
            ) : (
              <Button asChild variant="primary" size="sm">
                <Link href="/agent/listings/new">
                  <Plus className="h-4 w-4 mr-1.5" aria-hidden />
                  Agregar propiedad
                </Link>
              </Button>
            )}
            <Button asChild variant="secondary" size="sm">
              <Link href="/agent/listings">Ver todas</Link>
            </Button>
          </div>
        </div>

        {listings.length === 0 ? (
          <div
            className={cn(
              "flex flex-col items-center justify-center gap-4",
              "rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700",
              "py-16 text-center"
            )}
          >
            <p className="text-slate-500 dark:text-slate-400">
              Aún no tienes propiedades publicadas.
            </p>
            {limitInfo.available > 0 ? (
              <Button asChild variant="primary" size="sm">
                <Link href="/agent/listings/new">Publicar primera propiedad</Link>
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setUpgradeOpen(true)}
              >
                Comprar publicación
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {listings.slice(0, 6).map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>

      {/* ── Upgrade modal ───────────────────────────────────────────────── */}
      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        limitInfo={limitInfo}
      />
    </>
  );
}
