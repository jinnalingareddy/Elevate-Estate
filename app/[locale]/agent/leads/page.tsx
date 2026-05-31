import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageCircle, TrendingUp } from "lucide-react";
import { getAuthUser } from "@/lib/supabase/server";
import { getAgentLeads, getLeadStats } from "@/lib/supabase/queries/leads";
import { AgentSidebar } from "@/components/layout/AgentSidebar";
import { LeadsPageShell } from "@/components/agent/LeadsPageShell";

export const metadata: Metadata = {
  title: "Leads — EstateElevate",
};

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/agent/auth");

  const agentId = user.id;

  const [leads, stats] = await Promise.all([
    getAgentLeads(agentId).catch(() => []),
    getLeadStats(agentId).catch(() => ({
      total: 0,
      new: 0,
      contacted: 0,
      qualified: 0,
      thisMonth: 0,
      lastMonth: 0,
      conversionRate: 0,
    })),
  ]);

  const monthChange =
    stats.lastMonth > 0
      ? Math.round(((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100)
      : 0;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <AgentSidebar />
      <main className="flex-1 lg:pl-64">
        <div className="px-4 sm:px-8 pb-8 pt-14 lg:pt-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-slate-100">
              Leads
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Gestiona las solicitudes de contacto de tus propiedades
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total leads", value: stats.total },
              { label: "Nuevos", value: stats.new },
              { label: "Este mes", value: stats.thisMonth },
              { label: "Tasa de cierre", value: `${stats.conversionRate}%` },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-4"
              >
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {value}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Conversion banner */}
          {monthChange !== 0 && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20 px-4 py-3">
              <TrendingUp className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" aria-hidden />
              <p className="text-sm text-teal-800 dark:text-teal-300">
                {monthChange > 0 ? "+" : ""}
                {monthChange}% de leads este mes vs. el mes anterior.
              </p>
            </div>
          )}

          {/* Leads table */}
          {leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 py-20 text-center">
              <MessageCircle className="h-10 w-10 text-slate-300 dark:text-slate-600" aria-hidden />
              <p className="text-slate-500 dark:text-slate-400">
                Aún no tienes leads. Publica tus propiedades para empezar a recibir contactos.
              </p>
              <Link
                href="/agent/listings"
                className="text-sm font-medium text-gold-600 dark:text-gold-400 hover:underline"
              >
                Ver propiedades
              </Link>
            </div>
          ) : (
            <LeadsPageShell leads={leads} />
          )}

          {/* Bottom cards */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* AI scoring card (UI-only teaser) */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">✨</span>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                  Scoring de leads con IA
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                Pronto podrás ver un score automático de probabilidad de cierre para cada lead,
                basado en su perfil, comportamiento y tiempo de respuesta.
              </p>
              <span className="inline-flex items-center rounded-full bg-gold-100 dark:bg-gold-900/30 px-2.5 py-1 text-xs font-medium text-gold-700 dark:text-gold-300">
                Próximamente
              </span>
            </div>

            {/* Support card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="h-4 w-4 text-teal-500" aria-hidden />
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                  ¿Necesitas ayuda?
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                Aprende a gestionar tus leads de forma efectiva con nuestra guía de mejores prácticas.
              </p>
              <Link
                href="/agent/support"
                className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline"
              >
                Ir a soporte →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
