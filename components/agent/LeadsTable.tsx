"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Mail,
  MoreHorizontal,
  Phone,
  X,
} from "lucide-react";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { cn, formatPrice } from "@/lib/utils";
import type { Lead, LeadStatus } from "@/lib/supabase/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<LeadStatus, string> = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  contacted:
    "bg-gold-100 text-gold-700 dark:bg-gold-900/40 dark:text-gold-300",
  qualified:
    "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  negotiating:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  closed:
    "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
};

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "NUEVO",
  contacted: "CONTACTADO",
  qualified: "CALIFICADO",
  negotiating: "NEGOCIANDO",
  closed: "CERRADO",
};

const SOURCE_STYLES: Record<string, { label: string; className: string }> = {
  whatsapp: {
    label: "WhatsApp",
    className:
      "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  },
  quick_contact_modal: {
    label: "Formulario Web",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  referral: {
    label: "Referido Directo",
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
  },
};

const AVATAR_COLORS = [
  "bg-teal-500",
  "bg-blue-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-orange-500",
  "bg-green-600",
  "bg-red-500",
  "bg-indigo-500",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAvatarColor(name: string): string {
  const hash = name
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function getSourceStyle(source: string | null) {
  if (!source) return SOURCE_STYLES.quick_contact_modal;
  return SOURCE_STYLES[source] ?? SOURCE_STYLES.quick_contact_modal;
}

function relativeDate(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: es });
  } catch {
    return iso;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

type SortField = "date" | "status" | "source";
type SortDir = "asc" | "desc";

export interface LeadsTableProps {
  leads: Lead[];
  onUpdateStatus: (leadId: string, status: LeadStatus) => Promise<void>;
  onMarkRead: (leadId: string) => Promise<void>;
}

// ─── Slide-over ───────────────────────────────────────────────────────────────

function LeadSlideOver({
  lead,
  onClose,
  onUpdateStatus,
}: {
  lead: Lead;
  onClose: () => void;
  onUpdateStatus: (leadId: string, status: LeadStatus) => Promise<void>;
}) {
  const [loading, setLoading] = useState<LeadStatus | null>(null);

  async function updateStatus(status: LeadStatus) {
    setLoading(status);
    try {
      await onUpdateStatus(lead.id, status);
    } finally {
      setLoading(null);
    }
  }

  const allStatuses: { status: LeadStatus; label: string }[] = [
    { status: "contacted", label: "Marcar Contactado" },
    { status: "qualified", label: "Marcar Calificado" },
    { status: "negotiating", label: "Marcar Negociando" },
    { status: "closed", label: "Marcar Cerrado" },
  ];
  const nextStatuses = allStatuses.filter((s) => s.status !== lead.status);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        className={cn(
          "fixed right-0 top-0 bottom-0 z-50 w-full max-w-md",
          "bg-white dark:bg-slate-900 shadow-2xl overflow-y-auto",
          "flex flex-col"
        )}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0",
                getAvatarColor(lead.name)
              )}
              aria-hidden
            >
              {getInitials(lead.name)}
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                {lead.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {relativeDate(lead.created_at)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Status */}
          <div>
            <p className={sectionLabel}>Estado</p>
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold",
                STATUS_STYLES[lead.status]
              )}
            >
              {STATUS_LABELS[lead.status]}
            </span>
          </div>

          {/* Contact info */}
          <div>
            <p className={sectionLabel}>Contacto</p>
            <div className="space-y-2">
              <a
                href={`mailto:${lead.email}`}
                className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 hover:text-gold-600 dark:hover:text-gold-400 transition-colors"
              >
                <Mail className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                {lead.email}
              </a>
              {lead.phone && (
                <a
                  href={`tel:${lead.phone}`}
                  className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 hover:text-gold-600 dark:hover:text-gold-400 transition-colors"
                >
                  <Phone className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  {lead.phone}
                </a>
              )}
            </div>
          </div>

          {/* Property */}
          {lead.listings && (
            <div>
              <p className={sectionLabel}>Propiedad</p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {lead.listings.title}
              </p>
            </div>
          )}

          {/* Message */}
          {lead.message && (
            <div>
              <p className={sectionLabel}>Mensaje</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                {lead.message}
              </p>
            </div>
          )}
        </div>

        {/* Status actions */}
        {nextStatuses.length > 0 && (
          <div className="shrink-0 px-5 py-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <p className={sectionLabel}>Actualizar Estado</p>
            <div className="flex flex-wrap gap-2">
              {nextStatuses.map(({ status, label }) => (
                <button
                  key={status}
                  onClick={() => updateStatus(status)}
                  disabled={loading !== null}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                    "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300",
                    "hover:border-gold-500 hover:text-gold-700 dark:hover:text-gold-400",
                    "disabled:opacity-50 disabled:pointer-events-none"
                  )}
                >
                  {loading === status ? "Guardando..." : label}
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
}

// ─── SortButton ───────────────────────────────────────────────────────────────

function SortButton({
  field,
  label,
  current,
  dir,
  onClick,
}: {
  field: SortField;
  label: string;
  current: SortField;
  dir: SortDir;
  onClick: () => void;
}) {
  const active = current === field;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors whitespace-nowrap"
    >
      {label}
      {active ? (
        dir === "asc" ? (
          <ArrowUp className="h-3 w-3" aria-hidden />
        ) : (
          <ArrowDown className="h-3 w-3" aria-hidden />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" aria-hidden />
      )}
    </button>
  );
}

// ─── LeadsTable ───────────────────────────────────────────────────────────────

export function LeadsTable({
  leads,
  onUpdateStatus,
  onMarkRead,
}: LeadsTableProps) {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [localReads, setLocalReads] = useState<Set<string>>(new Set());

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  const STATUS_ORDER: Record<LeadStatus, number> = {
    new: 0,
    contacted: 1,
    qualified: 2,
    negotiating: 3,
    closed: 4,
  };

  const sorted = [...leads].sort((a, b) => {
    let cmp = 0;
    if (sortField === "date") {
      cmp =
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    } else if (sortField === "status") {
      cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    } else {
      cmp = (a.source ?? "").localeCompare(b.source ?? "");
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  async function handleRowClick(lead: Lead) {
    const isUnread = !lead.read && !localReads.has(lead.id);
    if (isUnread) {
      setLocalReads((prev) => { const next = new Set(prev); next.add(lead.id); return next; });
      await onMarkRead(lead.id);
    }
    setSelectedLead(lead);
  }

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          No hay prospectos todavía.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className={thCls + " text-left"}>Contacto</th>
              <th className={thCls + " text-left"}>Propiedad</th>
              <th className={thCls}>
                <SortButton
                  field="source"
                  label="Fuente"
                  current={sortField}
                  dir={sortDir}
                  onClick={() => toggleSort("source")}
                />
              </th>
              <th className={thCls}>
                <SortButton
                  field="status"
                  label="Estado"
                  current={sortField}
                  dir={sortDir}
                  onClick={() => toggleSort("status")}
                />
              </th>
              <th className={thCls}>
                <SortButton
                  field="date"
                  label="Fecha"
                  current={sortField}
                  dir={sortDir}
                  onClick={() => toggleSort("date")}
                />
              </th>
              <th className={thCls}>
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {sorted.map((lead) => {
              const isUnread = !lead.read && !localReads.has(lead.id);
              const src = getSourceStyle(lead.source);

              return (
                <tr
                  key={lead.id}
                  onClick={() => handleRowClick(lead)}
                  className={cn(
                    "cursor-pointer transition-colors",
                    isUnread
                      ? "bg-gold-50/60 dark:bg-gold-900/10 hover:bg-gold-50 dark:hover:bg-gold-900/20"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  )}
                >
                  {/* Contacto */}
                  <td className={tdCls}>
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0",
                          getAvatarColor(lead.name)
                        )}
                        aria-hidden
                      >
                        {getInitials(lead.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {lead.name}
                          {isUnread && (
                            <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-gold-500 align-middle" />
                          )}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {lead.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Propiedad */}
                  <td className={tdCls}>
                    {lead.listings ? (
                      <div>
                        <p className="text-slate-800 dark:text-slate-200 truncate max-w-[160px]">
                          {lead.listings.title}
                        </p>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>

                  {/* Fuente */}
                  <td className={tdCls}>
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                        src.className
                      )}
                    >
                      {src.label}
                    </span>
                  </td>

                  {/* Estado */}
                  <td className={tdCls}>
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
                        STATUS_STYLES[lead.status]
                      )}
                    >
                      {STATUS_LABELS[lead.status]}
                    </span>
                  </td>

                  {/* Fecha */}
                  <td className={tdCls}>
                    <span className="text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {relativeDate(lead.created_at)}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td
                    className={cn(tdCls, "text-right")}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenuRoot>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          aria-label="Acciones del prospecto"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {(
                          [
                            ["contacted", "Marcar Contactado"],
                            ["qualified", "Marcar Calificado"],
                            ["closed", "Marcar Cerrado"],
                          ] as [LeadStatus, string][]
                        )
                          .filter(([s]) => s !== lead.status)
                          .map(([status, label]) => (
                            <DropdownMenuItem
                              key={status}
                              onSelect={() => onUpdateStatus(lead.id, status)}
                            >
                              {label}
                            </DropdownMenuItem>
                          ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() => handleRowClick(lead)}
                        >
                          Ver Detalles
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenuRoot>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Slide-over */}
      <AnimatePresence>
        {selectedLead && (
          <LeadSlideOver
            key={selectedLead.id}
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
            onUpdateStatus={onUpdateStatus}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Table cell styles ────────────────────────────────────────────────────────

const thCls =
  "px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap";

const tdCls = "px-4 py-3 align-middle";

const sectionLabel =
  "text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5";
