"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Zap } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/providers/ToastProvider";
import { usePlanConfig } from "@/lib/plan-config-context";
import { cn } from "@/lib/utils";
import type { ListingLimitInfo } from "@/lib/listing-limits";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  limitInfo: ListingLimitInfo;
}

// ─── Plan option card ─────────────────────────────────────────────────────────

interface PlanCardProps {
  title: string;
  price: string;
  priceLabel: string;
  description: string;
  features: string[];
  recommended?: boolean;
  buttonLabel: string;
  buttonVariant: "primary" | "secondary";
  buttonColor?: string;
  loading?: boolean;
  onClick: () => void;
}

function PlanCard({
  title,
  price,
  priceLabel,
  description,
  features,
  recommended,
  buttonLabel,
  buttonVariant,
  buttonColor,
  loading,
  onClick,
}: PlanCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl border p-5 gap-4",
        recommended
          ? "border-gold-500 bg-gold-50/50 dark:bg-gold-900/10"
          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
      )}
    >
      {recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="warning" className="shadow-sm">
            <Zap className="h-3 w-3" aria-hidden />
            RECOMENDADO
          </Badge>
        </div>
      )}

      <div>
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-2xl font-bold font-serif text-slate-900 dark:text-slate-100">
            {price}
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {priceLabel}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>

      <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2">
            <CheckCircle2
              className="h-4 w-4 shrink-0 text-teal-500"
              aria-hidden
            />
            {f}
          </li>
        ))}
      </ul>

      <Button
        variant={buttonVariant}
        fullWidth
        loading={loading}
        onClick={onClick}
        className={cn(buttonColor, "mt-auto")}
      >
        {buttonLabel}
      </Button>
    </div>
  );
}

// ─── UpgradeModal ─────────────────────────────────────────────────────────────

export function UpgradeModal({
  open,
  onOpenChange,
  limitInfo,
}: UpgradeModalProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [slotLoading, setSlotLoading] = useState(false);
  const [proLoading, setProLoading] = useState(false);

  const planLabel =
    limitInfo.plan === "free"
      ? "Gratuito"
      : limitInfo.plan === "pro"
        ? "Pro"
        : "Elite";

  async function handlePayPerListing() {
    setSlotLoading(true);
    try {
      const res = await fetch("/api/payment/one-time", { method: "POST" });
      if (!res.ok) throw new Error();
      const { checkoutUrl } = (await res.json()) as { checkoutUrl: string };
      window.location.href = checkoutUrl;
    } catch {
      addToast("Error", {
        description: "No se pudo iniciar el pago. Intenta de nuevo.",
        variant: "error",
      });
      setSlotLoading(false);
    }
  }

  async function handleUpgradePro() {
    setProLoading(true);
    try {
      const res = await fetch("/api/payment/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "pro" }),
      });
      if (!res.ok) throw new Error();
      const { checkoutUrl } = (await res.json()) as { checkoutUrl: string };
      window.location.href = checkoutUrl;
    } catch {
      addToast("Error", {
        description: "No se pudo iniciar la suscripción. Intenta de nuevo.",
        variant: "error",
      });
      setProLoading(false);
    }
  }

  const { plans, payPerListing } = usePlanConfig();
  const payPerListingMXN = (payPerListing.price / 100).toLocaleString("es-MX");
  const proMXN = plans.pro.priceMonthly.toLocaleString("es-MX");
  const proLimit = plans.pro.listingLimit;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Has alcanzado tu límite de propiedades"
      maxWidth="max-w-2xl"
    >
      {/* Current usage */}
      <div className="mb-5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Plan actual:{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {planLabel}
            </span>
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {limitInfo.activeListings} / {limitInfo.planLimit} propiedades
            activas
          </p>
        </div>

        <div
          className={cn(
            "text-sm font-semibold tabular-nums px-3 py-1 rounded-full",
            "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
          )}
        >
          {limitInfo.activeListings}/{limitInfo.planLimit} usadas
        </div>
      </div>

      {/* Option cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PlanCard
          title="Pago por Publicación"
          price={`$${payPerListingMXN}`}
          priceLabel="MXN / publicación"
          description="Publica 1 propiedad adicional por 30 días"
          features={[
            "1 propiedad adicional",
            "Válida 30 días",
            "Sin compromiso mensual",
            "Fotos y mapa incluidos",
          ]}
          buttonLabel={`Pagar $${payPerListingMXN} MXN`}
          buttonVariant="secondary"
          buttonColor="!bg-teal-600 hover:!bg-teal-500"
          loading={slotLoading}
          onClick={handlePayPerListing}
        />

        <PlanCard
          title="Plan Pro"
          price={`$${proMXN}`}
          priceLabel="MXN / mes"
          description={`Hasta ${proLimit} propiedades simultáneas`}
          features={[
            `Hasta ${proLimit} propiedades activas`,
            "2 propiedades destacadas",
            "Estadísticas avanzadas",
            "Soporte prioritario",
          ]}
          recommended
          buttonLabel="Actualizar a Pro"
          buttonVariant="primary"
          loading={proLoading}
          onClick={handleUpgradePro}
        />
      </div>

      {/* Footer link */}
      <div className="mt-4 text-center">
        <button
          onClick={() => {
            onOpenChange(false);
            router.push("/agent/plans");
          }}
          className="text-sm text-gold-600 dark:text-gold-400 hover:underline underline-offset-2"
        >
          Ver todos los planes →
        </button>
      </div>
    </Modal>
  );
}
