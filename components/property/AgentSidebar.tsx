"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink,
  Heart,
  Lock,
  MessageCircle,
  Phone,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/supabase/types";

// ─── Lead form schema ─────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(2, "Ingresa tu nombre completo"),
  email: z.string().email("Correo electrónico inválido"),
  phone: z.string().min(10, "Ingresa tu número de teléfono"),
  message: z.string().optional(),
  _trap: z.string().max(0),
});

type FormValues = z.infer<typeof schema>;

// ─── AgentSidebar ─────────────────────────────────────────────────────────────

export interface AgentSidebarProps {
  listingId: string;
  agentId: string;
  agent: Pick<Profile, "full_name" | "agency_name" | "avatar_url" | "phone" | "whatsapp"> | null;
  virtualTourUrl: string | null;
}

export function AgentSidebar({
  listingId,
  agentId,
  agent,
  virtualTourUrl,
}: AgentSidebarProps) {
  const [favorited, setFavorited] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      message: "Hola, me interesa esta propiedad...",
      _trap: "",
    },
  });

  async function onSubmit(values: FormValues) {
    if (values._trap) return; // honeypot triggered
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listingId,
          agent_id: agentId,
          name: values.name,
          email: values.email,
          phone: values.phone,
          message: values.message ?? "Hola, me interesa esta propiedad...",
          source: "property_page",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSubmitError(
          (err as { error?: string }).error ?? "Ocurrió un error. Intenta de nuevo."
        );
        return;
      }

      setRevealed(true);
    } catch {
      setSubmitError("Error de red. Verifica tu conexión e intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  const displayPhone = agent?.phone ?? agent?.whatsapp ?? "+52 55 XXXX XXXX";
  const waNumber = (agent?.whatsapp ?? agent?.phone ?? "")
    .replace(/[^0-9]/g, "")
    .replace(/^52/, "52")
    .replace(/^(?!52)/, "52");
  const waLink = waNumber ? `https://wa.me/${waNumber}` : null;

  // Initials avatar fallback
  const name = agent?.full_name ?? "Agente";
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden">
      {/* ── Agent info ─────────────────────────────────────────────────── */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-start justify-between gap-3">
          {/* Avatar */}
          <div className="flex items-center gap-3 min-w-0">
            {agent?.avatar_url ? (
              <Image
                src={agent.avatar_url}
                alt={name}
                width={56}
                height={56}
                className="rounded-full object-cover shrink-0 ring-2 ring-gold-200 dark:ring-gold-800"
              />
            ) : (
              <div className="h-14 w-14 rounded-full bg-gold-100 dark:bg-gold-900/30 flex items-center justify-center shrink-0">
                <span className="text-gold-700 dark:text-gold-300 font-bold font-serif text-lg">
                  {initials}
                </span>
              </div>
            )}

            <div className="min-w-0">
              <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                {name}
              </p>
              {agent?.agency_name && (
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                  {agent.agency_name}
                </p>
              )}
              <p className="text-xs text-teal-600 dark:text-teal-400 font-medium mt-0.5">
                Agente Verificado
              </p>
            </div>
          </div>

          {/* Bookmark */}
          <button
            type="button"
            onClick={() => setFavorited((v) => !v)}
            aria-label={favorited ? "Quitar de guardados" : "Guardar propiedad"}
            className={cn(
              "p-2 rounded-full transition-colors shrink-0",
              favorited
                ? "bg-red-50 dark:bg-red-900/20 text-red-500"
                : "bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-red-500"
            )}
          >
            <Heart
              className={cn("h-5 w-5 transition-all", favorited && "fill-red-500")}
              aria-hidden
            />
          </button>
        </div>
      </div>

      {/* ── Phone reveal ───────────────────────────────────────────────── */}
      <div className="p-5">
        <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Datos de contacto
            </p>
          </div>

          <AnimatePresence mode="wait">
            {revealed ? (
              <motion.div
                key="revealed"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2"
              >
                <Phone className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" aria-hidden />
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {displayPhone}
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="blurred"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Phone className="h-4 w-4 text-slate-300 shrink-0" aria-hidden />
                <span
                  className="text-sm font-medium text-slate-700 dark:text-slate-300 blur-sm select-none pointer-events-none"
                  aria-hidden
                >
                  {displayPhone}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {!revealed && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 leading-snug">
              Completa el formulario para revelar el contacto al instante
            </p>
          )}
        </div>

        {/* CTA buttons after reveal */}
        <AnimatePresence>
          {revealed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-2 sm:flex-row mb-4 overflow-hidden"
            >
              {(agent?.phone ?? agent?.whatsapp) && (
                <Button asChild variant="secondary" size="sm" className="flex-1">
                  <a href={`tel:${agent?.phone ?? agent?.whatsapp}`}>
                    <Phone className="h-4 w-4 mr-1.5" aria-hidden />
                    Llamar
                  </a>
                </Button>
              )}
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex-1 inline-flex items-center justify-center gap-1.5",
                    "h-10 px-3 rounded-lg text-sm font-medium",
                    "bg-teal-600 hover:bg-teal-700 text-white transition-colors"
                  )}
                >
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  WhatsApp
                </a>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lead form (hidden after reveal) */}
        <AnimatePresence initial={false}>
          {!revealed && (
            <motion.form
              key="lead-form"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-3"
              noValidate
            >
              {/* Honeypot */}
              <input
                {...register("_trap")}
                type="text"
                aria-hidden
                tabIndex={-1}
                className="absolute opacity-0 pointer-events-none h-0 w-0 overflow-hidden"
                autoComplete="off"
              />

              <Input
                label="Nombre Completo"
                placeholder="Tu nombre"
                error={errors.name?.message}
                {...register("name")}
              />

              <Input
                label="Correo Electrónico"
                type="email"
                placeholder="correo@ejemplo.com"
                error={errors.email?.message}
                {...register("email")}
              />

              <Input
                label="Número de Teléfono"
                type="tel"
                placeholder="+52 55 1234 5678"
                error={errors.phone?.message}
                {...register("phone")}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Mensaje{" "}
                  <span className="font-normal text-slate-400">(opcional)</span>
                </label>
                <textarea
                  {...register("message")}
                  rows={3}
                  className={cn(
                    "w-full rounded-lg border border-slate-300 dark:border-slate-700",
                    "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100",
                    "px-3 py-2 text-base md:text-sm resize-none",
                    "placeholder:text-slate-400",
                    "focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-colors"
                  )}
                />
              </div>

              {submitError && (
                <p role="alert" className="text-xs text-red-500 dark:text-red-400">
                  {submitError}
                </p>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={submitting}
                className="w-full"
              >
                Solicitar Información
              </Button>

              <p className="text-center text-xs text-slate-400 dark:text-slate-500 leading-tight">
                Al enviar, aceptas recibir información sobre esta propiedad.
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* ── Virtual tour button ────────────────────────────────────────── */}
      {virtualTourUrl && (
        <div className="px-5 pb-5">
          <a
            href={virtualTourUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center justify-center gap-2 w-full",
              "h-11 rounded-xl border border-slate-200 dark:border-slate-700",
              "text-sm font-medium text-slate-700 dark:text-slate-300",
              "hover:border-gold-400 hover:text-gold-600 dark:hover:text-gold-400 transition-colors"
            )}
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            Ver Tour Virtual 360°
          </a>
        </div>
      )}
    </div>
  );
}
