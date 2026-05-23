"use client";

import Link from "next/link";
import { TrendingDown, TrendingUp } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { config } from "@/lib/config";
import type { PlanType } from "@/lib/supabase/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ViewDataPoint {
  date: string;
  views: number;
}

export interface DashboardStatsProps {
  totalViews: number;
  viewsChange: number;
  activeLeads: number;
  viewsData: ViewDataPoint[];
  plan: PlanType;
  planLimit: number;
  activeListings: number;
  renewalDate: string | null;
}

// ─── Chart tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 shadow-lg text-xs">
      <p className="text-slate-500 dark:text-slate-400">{label}</p>
      <p className="font-semibold text-teal-600 dark:text-teal-400">
        {payload[0].value} vistas
      </p>
    </div>
  );
}

// ─── DashboardStats ───────────────────────────────────────────────────────────

export function DashboardStats({
  totalViews,
  viewsChange,
  activeLeads,
  viewsData,
  plan,
  planLimit,
  activeListings,
  renewalDate,
}: DashboardStatsProps) {
  const planName = plan === "free" ? "Gratuito" : config.plans[plan].name;
  const usagePercent =
    planLimit > 0 ? Math.min((activeListings / planLimit) * 100, 100) : 0;
  const isPositive = viewsChange >= 0;
  const slotsLeft = planLimit - activeListings;

  const renewalLabel = renewalDate
    ? new Date(renewalDate).toLocaleDateString("es-MX", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* ── Card 1: Performance ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">
            Rendimiento de Propiedades
          </h2>
          <Badge variant="default" size="sm">
            Últimos 30 días
          </Badge>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-6 mb-5">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
              Vistas Totales
            </p>
            <p className="text-3xl font-bold font-serif text-slate-900 dark:text-slate-100 tabular-nums leading-none">
              {totalViews.toLocaleString("es-MX")}
            </p>
            <div
              className={cn(
                "flex items-center gap-1 mt-2 text-sm font-medium",
                isPositive
                  ? "text-teal-600 dark:text-teal-400"
                  : "text-red-500 dark:text-red-400"
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-4 w-4 shrink-0" aria-hidden />
              ) : (
                <TrendingDown className="h-4 w-4 shrink-0" aria-hidden />
              )}
              {isPositive ? "+" : ""}
              {viewsChange.toFixed(1)}% vs mes anterior
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
              Prospectos Activos
            </p>
            <p className="text-3xl font-bold font-serif text-slate-900 dark:text-slate-100 tabular-nums leading-none">
              {activeLeads}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Leads en proceso
            </p>
          </div>
        </div>

        {/* Sparkline chart */}
        <div className="h-20 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={viewsData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(148,163,184,0.15)"
                vertical={false}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: "rgba(148,163,184,0.3)", strokeWidth: 1 }}
              />
              <Line
                type="monotone"
                dataKey="views"
                stroke="#0f766e"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, fill: "#0f766e", strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Card 2: Plan ────────────────────────────────────────────────── */}
      <div className="bg-slate-900 rounded-2xl p-5 shadow-sm flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Plan Actual
          </p>
          <Badge variant="success" size="sm" dot>
            ACTIVO
          </Badge>
        </div>

        <p className="text-4xl font-bold font-serif text-gold-400 mt-2">
          {planName}
        </p>

        {renewalLabel && (
          <p className="text-sm text-slate-400 mt-2">
            Renovación: {renewalLabel}
          </p>
        )}

        {/* Usage bar */}
        <div className="mt-auto pt-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-400">Propiedades activas</span>
            <span className="font-semibold text-slate-200 tabular-nums">
              {activeListings}/{planLimit}
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gold-500 transition-all duration-500"
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            {slotsLeft} slot{slotsLeft !== 1 ? "s" : ""} disponible
            {slotsLeft !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="mt-4">
          <Button asChild variant="secondary" size="sm">
            <Link href="/agent/plans">Gestionar Plan</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
