"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MessageCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/providers/ToastProvider";
import { getThumbnailUrl } from "@/lib/cloudinary";
import { getWhatsAppUrl, getPropertyWhatsAppMessage } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import type { Listing } from "@/lib/supabase/types";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  nombre: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(80),
  telefono: z
    .string()
    .regex(
      /^(\+?52)?[0-9]{10}$/,
      "Número inválido. Ingresa 10 dígitos (ej. 5512345678)"
    ),
  mensaje: z.string().max(500).optional(),
  // Honeypot — must remain empty
  _hp: z.string().max(0).optional(),
});

type FormValues = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface QuickContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  listingTitle: string;
  agentId: string;
  agentName: string | null;
  agentWhatsApp: string | null;
  agentAvatarUrl: string | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function QuickContactModal({
  open,
  onOpenChange,
  listingId,
  listingTitle,
  agentId,
  agentName,
  agentWhatsApp,
  agentAvatarUrl,
}: QuickContactModalProps) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  // Bot detection: record when the form was shown
  const mountTimeRef = useRef<number>(0);
  useEffect(() => {
    if (open) mountTimeRef.current = Date.now();
  }, [open]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: "", telefono: "", mensaje: "", _hp: "" },
  });

  async function onSubmit(data: FormValues) {
    // Bot guard: filled faster than 2 seconds
    if (Date.now() - mountTimeRef.current < 2000) return;
    // Honeypot guard
    if (data._hp) return;

    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listingId,
          agent_id: agentId,
          name: data.nombre,
          phone: data.telefono,
          message: data.mensaje ?? "",
          source: "quick_contact_modal",
          submitted_at: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error("Error al enviar");

      addToast("Consulta enviada", {
        description: "El agente se pondrá en contacto contigo pronto.",
        variant: "success",
      });
      reset();
      onOpenChange(false);
    } catch {
      addToast("Error al enviar", {
        description: "Intenta de nuevo o contáctanos por WhatsApp.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  // Build a minimal listing-like object for the WhatsApp message helper
  const whatsAppMessage = `Hola, vi la propiedad "${listingTitle}" en EstateElevate y me gustaría obtener más información.`;
  const whatsAppUrl = agentWhatsApp
    ? getWhatsAppUrl(agentWhatsApp, whatsAppMessage)
    : null;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Contactar Agente"
      description={listingTitle}
      maxWidth="max-w-md"
    >
      {/* Agent card */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 mb-5">
        {agentAvatarUrl ? (
          <div className="relative h-10 w-10 rounded-full overflow-hidden shrink-0">
            <Image
              src={getThumbnailUrl(agentAvatarUrl)}
              alt={agentName ?? "Agente"}
              fill
              sizes="40px"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="h-10 w-10 rounded-full bg-gold-500 flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold">
              {(agentName ?? "A").charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {agentName ?? "Agente disponible"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Responde en menos de 24 h
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Honeypot — visually hidden, aria-hidden, tab-skip */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "-9999px",
            width: "1px",
            height: "1px",
            overflow: "hidden",
            opacity: 0,
          }}
        >
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            {...register("_hp")}
          />
        </div>

        <Input
          label="Nombre completo"
          placeholder="María García López"
          error={errors.nombre?.message}
          autoComplete="name"
          {...register("nombre")}
        />

        <Input
          label="Número de teléfono"
          placeholder="5512345678"
          type="tel"
          inputMode="numeric"
          error={errors.telefono?.message}
          helperText="10 dígitos (México)"
          autoComplete="tel"
          {...register("telefono")}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Mensaje (opcional)
          </label>
          <textarea
            rows={3}
            placeholder="Me interesa agendar una visita..."
            className={cn(
              "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm",
              "placeholder:text-slate-400 resize-none",
              "focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500",
              "dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700",
              "dark:placeholder:text-slate-500 dark:focus:border-gold-500"
            )}
            {...register("mensaje")}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-1">
          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
          >
            Enviar Consulta
          </Button>

          {whatsAppUrl && (
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center justify-center gap-2",
                "h-10 px-4 rounded-lg text-sm font-medium w-full",
                "bg-teal-600 hover:bg-teal-500 text-white transition-colors"
              )}
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              WhatsApp Directo
            </a>
          )}
        </div>
      </form>
    </Modal>
  );
}
