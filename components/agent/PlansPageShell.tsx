"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/providers/ToastProvider";
import { cn } from "@/lib/utils";
import { usePlanConfig } from "@/lib/plan-config-context";
import type { PlanType } from "@/lib/supabase/types";
import type { ListingLimitInfo } from "@/lib/listing-limits";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PlansPageShellProps {
  currentPlan: PlanType;
  limitInfo: ListingLimitInfo;
}

// ─── Plan card ────────────────────────────────────────────────────────────────

interface PlanCardProps {
  plan: PlanType;
  currentPlan: PlanType;
  onUpgrade: (plan: "pro" | "elite") => void;
  loading: boolean;
}

const PLAN_FEATURES: Record<PlanType, string[]> = {
  free: [
    "1 propiedad activa",
    "0 propiedades destacadas",
    "Leads ilimitados",
    "Perfil de agente",
  ],
  pro: [
    "10 propiedades activas",
    "2 propiedades destacadas",
    "Leads ilimitados",
    "Perfil verificado",
    "Estadísticas avanzadas",
    "Soporte prioritario",
  ],
  elite: [
    "50 propiedades activas",
    "10 propiedades destacadas",
    "Leads ilimitados",
    "Perfil élite con badge",
    "Estadísticas avanzadas",
    "Soporte 24/7 dedicado",
    "Posicionamiento prioritario",
    "API de integraciones",
  ],
};

function PlanCard({ plan, currentPlan, onUpgrade, loading }: PlanCardProps) {
  const { plans } = usePlanConfig();
  const planConfig = plans[plan];
  const isCurrent = plan === currentPlan;
  const isElite = plan === "elite";
  const features = PLAN_FEATURES[plan];

  return (
    <div
      className={cn(
        "relative rounded-2xl border p-6 flex flex-col",
        isElite
          ? "border-gold-400 bg-gradient-to-b from-gold-50 to-white dark:from-gold-900/20 dark:to-slate-900 shadow-lg shadow-gold-100 dark:shadow-gold-900/20"
          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
      )}
    >
      {isElite && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="warning" className="px-3 py-1 text-xs font-semibold">
            <Zap className="h-3 w-3 mr-1" aria-hidden />
            Más popular
          </Badge>
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {planConfig.name}
        </h3>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            {planConfig.priceMonthly === 0
              ? "Gratis"
              : `$${planConfig.priceMonthly.toLocaleString("es-MX")}`}
          </span>
          {planConfig.priceMonthly > 0 && (
            <span className="text-sm text-slate-500 dark:text-slate-400">/mes</span>
          )}
        </div>
      </div>

      <ul className="space-y-2.5 flex-1 mb-6">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" aria-hidden />
            <span className="text-slate-700 dark:text-slate-300">{f}</span>
          </li>
        ))}
      </ul>

      {isCurrent ? (
        <Button variant="secondary" fullWidth disabled>
          Plan actual
        </Button>
      ) : plan === "free" ? (
        <Button variant="secondary" fullWidth disabled>
          Plan básico
        </Button>
      ) : (
        <Button
          variant="primary"
          fullWidth
          loading={loading}
          onClick={() => onUpgrade(plan as "pro" | "elite")}
          className={
            isElite
              ? "bg-gold-600 hover:bg-gold-700 focus-visible:ring-gold-500"
              : undefined
          }
        >
          Activar {planConfig.name}
        </Button>
      )}
    </div>
  );
}

// ─── Comparison table ─────────────────────────────────────────────────────────

const TABLE_ROWS: { label: string; free: string; pro: string; elite: string }[] = [
  { label: "Propiedades activas", free: "1", pro: "10", elite: "50" },
  { label: "Propiedades destacadas", free: "0", pro: "2", elite: "10" },
  { label: "Leads", free: "Ilimitados", pro: "Ilimitados", elite: "Ilimitados" },
  { label: "Perfil verificado", free: "—", pro: "✓", elite: "✓ Elite" },
  { label: "Soporte", free: "Email", pro: "Prioritario", elite: "24/7 Dedicado" },
  { label: "Estadísticas", free: "Básicas", pro: "Avanzadas", elite: "Avanzadas" },
  { label: "API de integraciones", free: "—", pro: "—", elite: "✓" },
];

// ─── PlansPageShell ───────────────────────────────────────────────────────────

export function PlansPageShell({ currentPlan, limitInfo }: PlansPageShellProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const { plans } = usePlanConfig();
  const [loading, setLoading] = useState<"pro" | "elite" | "single" | null>(null);

  const isAtLimit = limitInfo.available === 0;

  async function handleUpgrade(plan: "pro" | "elite") {
    setLoading(plan);
    try {
      const res = await fetch("/api/conekta/checkout-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast("Error al iniciar el pago", {
          variant: "error",
          description: data.error,
        });
        return;
      }
      window.location.href = data.url;
    } catch {
      addToast("Error de red", { variant: "error" });
    } finally {
      setLoading(null);
    }
  }

  async function handlePayPerListing() {
    setLoading("single");
    try {
      const res = await fetch("/api/conekta/checkout-single", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        addToast("Error al iniciar el pago", {
          variant: "error",
          description: data.error,
        });
        return;
      }
      window.location.href = data.url;
    } catch {
      addToast("Error de red", { variant: "error" });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="max-w-5xl">
      {/* ── Limit banner ────────────────────────────────────────────────── */}
      {isAtLimit && (
        <div className="mb-8 rounded-xl bg-gold-50 dark:bg-gold-900/20 border border-gold-200 dark:border-gold-800 px-5 py-4">
          <p className="text-sm font-medium text-gold-800 dark:text-gold-300">
            Has alcanzado el límite de propiedades de tu plan{" "}
            <strong>{plans[currentPlan].name}</strong>. Elige un plan superior
            o compra una publicación individual para continuar.
          </p>
        </div>
      )}

      {/* ── Pay-per-listing card ─────────────────────────────────────────── */}
      <div className="mb-10 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Publicación individual
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Sin suscripción. Publica una propiedad por 12 meses.
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              $299 MXN
            </span>
            <Button
              variant="secondary"
              loading={loading === "single"}
              onClick={handlePayPerListing}
            >
              Comprar
            </Button>
          </div>
        </div>
      </div>

      {/* ── Plan cards ──────────────────────────────────────────────────── */}
      <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-slate-100 mb-6">
        Planes de suscripción
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        {(["free", "pro", "elite"] as PlanType[]).map((plan) => (
          <PlanCard
            key={plan}
            plan={plan}
            currentPlan={currentPlan}
            onUpgrade={handleUpgrade}
            loading={loading === plan}
          />
        ))}
      </div>

      {/* ── Comparison table ────────────────────────────────────────────── */}
      <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-slate-100 mb-4">
        Comparación de planes
      </h2>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left px-5 py-3 font-semibold text-slate-600 dark:text-slate-300">
                  Característica
                </th>
                {(["Free", "Pro", "Elite"] as const).map((name) => (
                  <th
                    key={name}
                    className="text-center px-5 py-3 font-semibold text-slate-600 dark:text-slate-300"
                  >
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {TABLE_ROWS.map(({ label, free, pro, elite }) => (
                <tr
                  key={label}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <td className="px-5 py-3 text-slate-700 dark:text-slate-300">
                    {label}
                  </td>
                  <td className="px-5 py-3 text-center text-slate-500 dark:text-slate-400">
                    {free}
                  </td>
                  <td className="px-5 py-3 text-center text-slate-700 dark:text-slate-300">
                    {pro}
                  </td>
                  <td className="px-5 py-3 text-center text-gold-600 dark:text-gold-400 font-medium">
                    {elite}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
