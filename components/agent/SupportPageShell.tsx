"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, MessageCircle, Search, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/providers/ToastProvider";
import { cn } from "@/lib/utils";
import { config } from "@/lib/config";

// ─── FAQ data ─────────────────────────────────────────────────────────────────

interface FAQ {
  q: string;
  a: string;
  category: string;
}

const FAQS: FAQ[] = [
  {
    category: "Publicaciones",
    q: "¿Cuántas propiedades puedo publicar?",
    a: "Depende de tu plan: Free (1), Pro (10) o Elite (50). También puedes comprar publicaciones individuales por $299 MXN cada una, válidas por 12 meses.",
  },
  {
    category: "Publicaciones",
    q: "¿Cómo destaco una propiedad?",
    a: "Las propiedades destacadas aparecen primero en los resultados de búsqueda. Puedes marcarlas como destacadas desde el editor de propiedad si tu plan lo permite (Pro: 2, Elite: 10).",
  },
  {
    category: "Publicaciones",
    q: "¿Cuánto tiempo tarda en aparecer mi propiedad?",
    a: "Las propiedades aparecen en los resultados en menos de 60 segundos tras publicarlas. La caché de búsqueda se actualiza cada minuto.",
  },
  {
    category: "Pagos",
    q: "¿Qué métodos de pago aceptan?",
    a: "Aceptamos tarjetas de crédito/débito, transferencia bancaria y pago en efectivo (OXXO/7-Eleven) a través de Conekta.",
  },
  {
    category: "Pagos",
    q: "¿Cómo cancelo mi suscripción?",
    a: "Puedes cancelar desde la sección Suscripciones. Tu plan seguirá activo hasta el fin del período facturado. Escríbenos a soporte@estateelevate.mx si necesitas ayuda.",
  },
  {
    category: "Leads",
    q: "¿Cómo recibo los leads?",
    a: "Los leads se almacenan en tu panel y te enviamos una notificación por email. También puedes ver el teléfono y escribir por WhatsApp directamente desde el panel.",
  },
  {
    category: "Cuenta",
    q: "¿Cómo cambio mi foto de perfil?",
    a: "Ve a Configuración → Foto de perfil y haz clic en 'Cambiar foto'. Puedes subir imágenes en JPG o PNG de hasta 10 MB.",
  },
  {
    category: "Cuenta",
    q: "¿Puedo tener varias cuentas?",
    a: "Cada agente debe tener una sola cuenta. Si necesitas acceso para un equipo, contáctanos para un plan empresarial personalizado.",
  },
];

// ─── Ticket schema ────────────────────────────────────────────────────────────

const ticketSchema = z.object({
  email: z.string().email("Correo inválido"),
  subject: z.string().min(5, "Mínimo 5 caracteres").max(120, "Máximo 120 caracteres"),
  message: z.string().min(20, "Mínimo 20 caracteres").max(4000, "Máximo 4000 caracteres"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

type TicketForm = z.infer<typeof ticketSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SupportPageShellProps {
  email: string;
}

// ─── FAQ accordion item ───────────────────────────────────────────────────────

function FAQItem({ faq }: { faq: FAQ }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-slate-200 dark:border-slate-700 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-4 text-left gap-4"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {faq.q}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" aria-hidden />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {faq.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── SupportPageShell ─────────────────────────────────────────────────────────

export function SupportPageShell({ email }: SupportPageShellProps) {
  const { addToast } = useToast();
  const [search, setSearch] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TicketForm>({
    resolver: zodResolver(ticketSchema),
    defaultValues: { email, subject: "", message: "", priority: "medium" },
  });

  const filtered = search.trim()
    ? FAQS.filter(
        (f) =>
          f.q.toLowerCase().includes(search.toLowerCase()) ||
          f.a.toLowerCase().includes(search.toLowerCase())
      )
    : FAQS;

  const categories = Array.from(new Set(filtered.map((f) => f.category)));

  async function onSubmit(values: TicketForm) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/support/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        addToast("Error al enviar", {
          variant: "error",
          description: (err as { error?: string }).error,
        });
        return;
      }
      setSubmitted(true);
      addToast("Ticket enviado", { variant: "success" });
    } catch {
      addToast("Error de red", { variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  const waSupport = `https://wa.me/521${config.app.supportEmail.replace(/[^0-9]/g, "")}`;

  return (
    <div className="max-w-3xl space-y-10">
      {/* ── Contact card ────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="flex-1">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            ¿Necesitas ayuda inmediata?
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Escríbenos por WhatsApp o email. Respondemos en menos de 2 horas en horario hábil.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <a
            href={`mailto:${config.app.supportEmail}`}
            className={cn(
              "inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium",
              "border border-slate-200 dark:border-slate-700",
              "text-slate-700 dark:text-slate-300 hover:border-gold-400 hover:text-gold-600 transition-colors"
            )}
          >
            Email
          </a>
          <a
            href={`https://wa.me/525555555555?text=Hola%2C%20necesito%20soporte%20con%20mi%20cuenta%20de%20EstateElevate`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium",
              "bg-teal-600 hover:bg-teal-700 text-white transition-colors"
            )}
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            WhatsApp
          </a>
        </div>
      </div>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-slate-100 mb-4">
          Preguntas frecuentes
        </h2>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden />
          <input
            type="search"
            placeholder="Buscar en las FAQ…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              "w-full rounded-lg border border-slate-300 dark:border-slate-700",
              "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100",
              "pl-9 pr-4 py-2 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
            )}
          />
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
            No se encontraron resultados para &ldquo;{search}&rdquo;.
          </p>
        ) : (
          <div className="space-y-6">
            {categories.map((cat) => (
              <div key={cat}>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  {cat}
                </p>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered
                    .filter((f) => f.category === cat)
                    .map((faq) => (
                      <FAQItem key={faq.q} faq={faq} />
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Ticket form ──────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-slate-100 mb-4">
          Enviar ticket de soporte
        </h2>

        {submitted ? (
          <div className="rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20 px-6 py-8 text-center">
            <p className="font-semibold text-teal-800 dark:text-teal-300 mb-1">
              ¡Ticket recibido!
            </p>
            <p className="text-sm text-teal-700 dark:text-teal-400">
              Te responderemos a <strong>{email}</strong> en menos de 24 horas hábiles.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Correo electrónico"
              type="email"
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              label="Asunto"
              placeholder="Describe brevemente tu problema"
              error={errors.subject?.message}
              {...register("subject")}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Prioridad
              </label>
              <select
                {...register("priority")}
                className={cn(
                  "rounded-lg border border-slate-300 dark:border-slate-700",
                  "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100",
                  "px-3 py-2 text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                )}
              >
                <option value="low">Baja — consulta general</option>
                <option value="medium">Media — problema funcional</option>
                <option value="high">Alta — afecta mis publicaciones</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Descripción
              </label>
              <textarea
                {...register("message")}
                rows={5}
                placeholder="Describe el problema con el mayor detalle posible..."
                className={cn(
                  "w-full rounded-lg border border-slate-300 dark:border-slate-700",
                  "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100",
                  "px-3 py-2 text-sm resize-none",
                  "placeholder:text-slate-400",
                  "focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500",
                  errors.message && "border-red-500"
                )}
              />
              {errors.message && (
                <p className="text-xs text-red-500">{errors.message.message}</p>
              )}
            </div>

            <Button type="submit" variant="primary" loading={submitting}>
              <Send className="h-4 w-4 mr-2" aria-hidden />
              Enviar ticket
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}
