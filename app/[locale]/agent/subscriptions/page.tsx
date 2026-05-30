import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, CreditCard, Package } from "lucide-react";
import { getAuthUser } from "@/lib/supabase/server";
import {
  getAgentSubscription,
  getAgentListingSlots,
} from "@/lib/supabase/queries/subscriptions";
import { getListingLimitInfo } from "@/lib/listing-limits";
import { AgentSidebar } from "@/components/layout/AgentSidebar";
import { Badge } from "@/components/ui/Badge";
import { config } from "@/lib/config";
import { formatPrice } from "@/lib/utils";
import type { PlanType } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Suscripción — EstateElevate",
};

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; variant: "success" | "warning" | "error" | "default" }> = {
  active: { label: "Activa", variant: "success" },
  trialing: { label: "Prueba", variant: "warning" },
  past_due: { label: "Pago pendiente", variant: "error" },
  cancelled: { label: "Cancelada", variant: "default" },
  unpaid: { label: "Sin pago", variant: "error" },
};

const ELITE_PERKS = [
  "50 propiedades activas simultáneamente",
  "10 propiedades destacadas en resultados de búsqueda",
  "Perfil élite con badge verificado",
  "Posicionamiento prioritario en búsquedas",
  "Soporte 24/7 con agente dedicado",
  "Estadísticas avanzadas y reportes",
  "API de integraciones con tu CRM",
];

const MOCK_BILLING = [
  { date: "2026-04-01", amount: 1999, status: "paid", plan: "Elite" },
  { date: "2026-03-01", amount: 1999, status: "paid", plan: "Elite" },
  { date: "2026-02-01", amount: 1999, status: "paid", plan: "Elite" },
];

export default async function SubscriptionsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/agent/auth");

  const agentId = user.id;

  const [subscription, slots, limitInfo] = await Promise.all([
    getAgentSubscription(agentId).catch(() => null),
    getAgentListingSlots(agentId).catch(() => []),
    getListingLimitInfo(agentId).catch(() => ({
      plan: "free" as const,
      planLimit: 1,
      activeListings: 0,
      paidSlots: 0,
      available: 1,
    })),
  ]);

  const plan: PlanType = limitInfo.plan;
  const planConfig = config.plans[plan];
  const subStatus = subscription?.status ?? "active";
  const statusInfo = STATUS_LABELS[subStatus] ?? STATUS_LABELS.active;

  const renewalDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <AgentSidebar />
      <main className="flex-1 lg:pl-64">
        <div className="px-4 sm:px-8 pb-8 pt-14 lg:pt-8 max-w-3xl">
          <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-slate-100 mb-8">
            Suscripción
          </h1>

          {/* ── Current plan card ───────────────────────────────────────── */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 mb-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Plan {planConfig.name}
                  </h2>
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                </div>
                {planConfig.priceMonthly > 0 ? (
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    ${planConfig.priceMonthly.toLocaleString("es-MX")}{" "}
                    <span className="text-sm font-normal text-slate-500">MXN/mes</span>
                  </p>
                ) : (
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">Gratis</p>
                )}
                {renewalDate && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {subscription?.cancel_at_period_end
                      ? `Cancela el ${renewalDate}`
                      : `Renueva el ${renewalDate}`}
                  </p>
                )}
              </div>
              <CreditCard className="h-8 w-8 text-gold-500 shrink-0" aria-hidden />
            </div>

            <div className="flex gap-3 flex-wrap">
              <Link
                href="/agent/plans"
                className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-gold-600 hover:bg-gold-700 text-white text-sm font-medium transition-colors"
              >
                {plan === "free" ? "Activar plan" : "Cambiar plan"}
              </Link>
              {plan !== "free" && (
                <a
                  href={`mailto:${config.app.supportEmail}?subject=Cancelar%20suscripción`}
                  className="inline-flex items-center justify-center h-9 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar suscripción
                </a>
              )}
            </div>
          </div>

          {/* ── Usage grid ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            {[
              {
                label: "Propiedades activas",
                value: limitInfo.activeListings,
                max: planConfig.listingLimit,
                icon: Package,
              },
              {
                label: "Propiedades destacadas",
                value: 0,
                max: planConfig.featuredListings,
                icon: CheckCircle2,
              },
              {
                label: "Slots individuales",
                value: slots.length,
                max: null,
                icon: CreditCard,
              },
            ].map(({ label, value, max, icon: Icon }) => (
              <div
                key={label}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4 text-gold-500" aria-hidden />
                  <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                </div>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {value}
                  {max !== null && (
                    <span className="text-sm font-normal text-slate-400">
                      {" "}
                      / {max}
                    </span>
                  )}
                </p>
                {max !== null && max > 0 && (
                  <div className="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gold-500 transition-all"
                      style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Billing history (mock) ───────────────────────────────────── */}
          <section className="mb-8">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3">
              Historial de pagos
            </h2>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {MOCK_BILLING.map((row, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      Plan {row.plan}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(row.date).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {formatPrice(row.amount * 100, "MXN")}
                    </span>
                    <Badge variant="success">Pagado</Badge>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              * Historial de ejemplo. Los datos reales se sincronizan desde Conekta.
            </p>
          </section>

          {/* ── Elite perks (only shown if elite or teaser) ──────────────── */}
          {plan === "elite" && (
            <section>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-3">
                Beneficios Elite activos
              </h2>
              <ul className="space-y-2.5">
                {ELITE_PERKS.map((perk) => (
                  <li key={perk} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" aria-hidden />
                    <span className="text-slate-700 dark:text-slate-300">{perk}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {plan !== "elite" && (
            <section className="rounded-2xl border border-gold-200 dark:border-gold-800 bg-gold-50 dark:bg-gold-900/20 p-6">
              <h2 className="text-base font-bold text-gold-800 dark:text-gold-300 mb-3">
                Desbloquea Elite
              </h2>
              <ul className="space-y-2 mb-4">
                {ELITE_PERKS.slice(0, 4).map((perk) => (
                  <li key={perk} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" aria-hidden />
                    <span className="text-gold-700 dark:text-gold-400">{perk}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/agent/plans"
                className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-gold-600 hover:bg-gold-700 text-white text-sm font-medium transition-colors"
              >
                Activar Elite — $1,999/mes
              </Link>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
