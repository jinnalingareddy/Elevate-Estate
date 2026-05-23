"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search,
  MoreVertical,
  Ban,
  RotateCcw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/supabase/types";
import { Link } from "@/lib/navigation";

export type AgentRow = Pick<
  Profile,
  | "id"
  | "full_name"
  | "email"
  | "agency_name"
  | "avatar_url"
  | "plan"
  | "role"
  | "created_at"
> & { active_listings: number };

type FilterTab = "all" | "active" | "suspended" | "pro" | "elite";

const PAGE_SIZE = 20;

function Initials({ name, email }: { name: string | null; email: string }) {
  const text = name ?? email;
  const initials = text
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-500/20 text-gold-700 dark:text-gold-400 text-sm font-semibold">
      {initials}
    </span>
  );
}

function PlanBadge({ plan }: { plan: Profile["plan"] }) {
  if (plan === "elite")
    return (
      <Badge variant="featured" size="sm">
        Elite
      </Badge>
    );
  if (plan === "pro")
    return (
      <Badge variant="warning" size="sm">
        Pro
      </Badge>
    );
  return (
    <Badge variant="default" size="sm">
      Free
    </Badge>
  );
}

export function AgentsClient({ agents }: { agents: AgentRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<FilterTab>("all");
  const [page, setPage] = useState(1);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let rows = agents;

    // Tab filter
    if (tab === "active") rows = rows.filter((a) => a.role === "agent");
    else if (tab === "suspended") rows = rows.filter((a) => a.role === "banned");
    else if (tab === "pro") rows = rows.filter((a) => a.plan === "pro");
    else if (tab === "elite") rows = rows.filter((a) => a.plan === "elite");

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (a) =>
          a.full_name?.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.agency_name?.toLowerCase().includes(q)
      );
    }

    return rows;
  }, [agents, tab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  async function handleBan(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/agents/${id}/ban`, { method: "POST" });
      if (!res.ok) throw new Error();
      startTransition(() => router.refresh());
    } catch {
      alert("Error al suspender agente");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleUnban(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/agents/${id}/unban`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      startTransition(() => router.refresh());
    } catch {
      alert("Error al reactivar agente");
    } finally {
      setLoadingId(null);
    }
  }

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "active", label: "Activos" },
    { key: "suspended", label: "Suspendidos" },
    { key: "pro", label: "Pro" },
    { key: "elite", label: "Elite" },
  ];

  return (
    <div className="space-y-4">
      {/* Search + tabs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden />
          <input
            type="text"
            placeholder="Buscar por nombre o email…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className={cn(
              "w-full pl-9 pr-4 py-2 text-sm rounded-lg",
              "border border-slate-200 dark:border-slate-700",
              "bg-white dark:bg-slate-900",
              "text-slate-900 dark:text-slate-100",
              "placeholder-slate-400",
              "focus:outline-none focus:ring-2 focus:ring-gold-500"
            )}
          />
        </div>

        <div className="flex gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                setTab(key);
                setPage(1);
              }}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                tab === key
                  ? "bg-gold-500 text-white"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">
                  Agente
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400 hidden md:table-cell">
                  Agencia
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400 hidden sm:table-cell">
                  Plan
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">
                  Estado
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400 hidden lg:table-cell">
                  Miembro desde
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-400 hidden lg:table-cell">
                  Propiedades
                </th>
                <th className="px-4 py-3" aria-label="Acciones" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-slate-400"
                  >
                    No se encontraron agentes
                  </td>
                </tr>
              ) : (
                paginated.map((agent) => (
                  <tr
                    key={agent.id}
                    className={cn(
                      "hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors",
                      (loadingId === agent.id || isPending) && "opacity-60"
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {agent.avatar_url ? (
                          <Image
                            src={agent.avatar_url}
                            alt=""
                            width={36}
                            height={36}
                            className="h-9 w-9 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <Initials
                            name={agent.full_name}
                            email={agent.email}
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                            {agent.full_name ?? "Sin nombre"}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {agent.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 hidden md:table-cell">
                      {agent.agency_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <PlanBadge plan={agent.plan} />
                    </td>
                    <td className="px-4 py-3">
                      {agent.role === "banned" ? (
                        <Badge variant="error" dot size="sm">
                          Suspendido
                        </Badge>
                      ) : (
                        <Badge variant="success" dot size="sm">
                          Activo
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 tabular-nums hidden lg:table-cell">
                      {new Date(agent.created_at).toLocaleDateString("es-MX", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300 hidden lg:table-cell">
                      {agent.active_listings}
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenuRoot>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            aria-label="Acciones"
                            disabled={loadingId === agent.id}
                          >
                            <MoreVertical className="h-4 w-4" aria-hidden />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {agent.role === "banned" ? (
                            <DropdownMenuItem
                              onSelect={() => handleUnban(agent.id)}
                            >
                              <RotateCcw className="h-4 w-4" aria-hidden />
                              Reactivar
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              destructive
                              onSelect={() => handleBan(agent.id)}
                            >
                              <Ban className="h-4 w-4" aria-hidden />
                              Suspender
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/admin/listings?agent=${agent.id}`}
                              className="flex items-center gap-2"
                            >
                              <ExternalLink className="h-4 w-4" aria-hidden />
                              Ver propiedades
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenuRoot>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {filtered.length} agentes · página {currentPage} de {totalPages}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Página siguiente"
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
