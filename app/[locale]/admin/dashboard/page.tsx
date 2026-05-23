import type { Metadata } from "next";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import {
  Users,
  Building2,
  UserPlus,
  TrendingUp,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Link } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Dashboard — Admin | EstateElevate",
};

export const revalidate = 30;

const ACTION_STYLES: Record<string, string> = {
  ban: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  unban: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  feature: "bg-gold-100 text-gold-700 dark:bg-gold-900/30 dark:text-gold-400",
  unfeature: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  delete: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  approve: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export default async function AdminDashboardPage() {
  const db = getSupabaseServiceClient();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoIso = sevenDaysAgo.toISOString();

  const [
    agentsRes,
    listingsRes,
    newProfilesRes,
    proRes,
    eliteRes,
    auditRes,
    recentAgentsRes,
  ] = await Promise.all([
    db
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "agent"),
    db
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    db
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgoIso),
    db.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active").eq("plan", "pro"),
    db.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active").eq("plan", "elite"),
    db
      .from("admin_audit_log")
      .select("id, action, target_type, target_id, created_at, profiles!admin_id(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(20),
    db
      .from("profiles")
      .select("id, full_name, email, created_at")
      .eq("role", "agent")
      .gte("created_at", sevenDaysAgoIso)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const proCount = proRes.count ?? 0;
  const eliteCount = eliteRes.count ?? 0;
  const estimatedRevenue = proCount * 299 + eliteCount * 999;

  const stats = [
    {
      label: "Total Agentes",
      value: (agentsRes.count ?? 0).toLocaleString("es-MX"),
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Propiedades Activas",
      value: (listingsRes.count ?? 0).toLocaleString("es-MX"),
      icon: Building2,
      color: "text-teal-500",
      bg: "bg-teal-500/10",
    },
    {
      label: "Nuevos esta semana",
      value: (newProfilesRes.count ?? 0).toLocaleString("es-MX"),
      icon: UserPlus,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      label: "Ingresos estimados",
      value: formatPrice(estimatedRevenue, "MXN"),
      icon: TrendingUp,
      color: "text-gold-500",
      bg: "bg-gold-500/10",
    },
  ] as const;

  const auditLogs = auditRes.data ?? [];
  const recentAgents = recentAgentsRes.data ?? [];

  return (
    <div className="px-4 sm:px-8 py-8">
      <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-slate-100 mb-1">
        Dashboard
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
        Vista general del panel de administración
      </p>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {label}
              </span>
              <span className={`p-2 rounded-lg ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} aria-hidden />
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent activity */}
        <div className="xl:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">
              Actividad Reciente
            </h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden rounded-b-xl">
            {auditLogs.length === 0 ? (
              <p className="px-5 py-10 text-sm text-slate-400 text-center">
                Sin actividad registrada
              </p>
            ) : (
              auditLogs.map((log) => {
                const colorClass =
                  ACTION_STYLES[log.action] ??
                  "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";
                const admin =
                  log.profiles as unknown as { full_name: string | null; email: string } | null | undefined;
                return (
                  <div
                    key={log.id}
                    className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <span
                      className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${colorClass}`}
                    >
                      {log.action}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 dark:text-slate-300 truncate">
                        <span className="font-medium">{log.target_type}</span>
                        <span className="text-slate-400 mx-1">·</span>
                        <span className="font-mono text-xs">
                          {log.target_id.slice(0, 8)}
                        </span>
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        por{" "}
                        {admin?.full_name ?? admin?.email ?? "Administrador"}
                      </p>
                    </div>
                    <time
                      dateTime={log.created_at}
                      className="text-xs text-slate-400 shrink-0 tabular-nums"
                    >
                      {new Date(log.created_at).toLocaleDateString("es-MX", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          {/* Pending agents */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Clock className="h-4 w-4 text-gold-500" aria-hidden />
              <h2 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                Agentes pendientes de revisión
              </h2>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden rounded-b-xl">
              {recentAgents.length === 0 ? (
                <p className="px-5 py-6 text-sm text-slate-400 text-center">
                  Ninguno esta semana
                </p>
              ) : (
                recentAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="px-5 py-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                        {agent.full_name ?? "Sin nombre"}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {agent.email}
                      </p>
                    </div>
                    <Link
                      href="/admin/agents"
                      className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gold-500 text-white hover:bg-gold-600 transition-colors"
                    >
                      Revisar
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Reported listings — V2 placeholder */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-slate-400" aria-hidden />
                <h2 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                  Propiedades reportadas
                </h2>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                Próximamente
              </span>
            </div>
            <p className="px-5 py-8 text-sm text-slate-400 text-center">
              Disponible en V2
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
