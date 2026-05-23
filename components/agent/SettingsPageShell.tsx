"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CldUploadWidget } from "next-cloudinary";
import { Camera, Eye, EyeOff, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/providers/ToastProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { usePlanConfig } from "@/lib/plan-config-context";
import { cn } from "@/lib/utils";
import type { Profile, PlanType } from "@/lib/supabase/types";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  full_name: z.string().min(2, "Ingresa tu nombre completo"),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  agency_name: z.string().optional(),
  bio: z.string().max(500, "Máximo 500 caracteres").optional(),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
});

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[A-Z]/, "Debe incluir una mayúscula")
      .regex(/[0-9]/, "Debe incluir un número"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Las contraseñas no coinciden",
    path: ["confirm"],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SettingsPageShellProps {
  profile: Profile;
  plan: PlanType;
}

// ─── SettingsPageShell ────────────────────────────────────────────────────────

export function SettingsPageShell({ profile, plan }: SettingsPageShellProps) {
  const router = useRouter();
  const { addToast } = useToast();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Notification prefs stored locally (no backend for MVP)
  const [notifLeads, setNotifLeads] = useState(true);
  const [notifMarketing, setNotifMarketing] = useState(false);

  const { plans } = usePlanConfig();
  const planConfig = plans[plan];

  const {
    register: regProfile,
    handleSubmit: handleProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile.full_name ?? "",
      phone: profile.phone ?? "",
      whatsapp: profile.whatsapp ?? "",
      agency_name: profile.agency_name ?? "",
      bio: profile.bio ?? "",
      website: profile.website ?? "",
    },
  });

  const {
    register: regPass,
    handleSubmit: handlePassword,
    reset: resetPassword,
    formState: { errors: passErrors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirm: "" },
  });

  async function onSaveProfile(values: ProfileForm) {
    setSavingProfile(true);
    try {
      const res = await fetch("/api/agent/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, avatar_url: avatarUrl }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        addToast("Error al guardar", {
          variant: "error",
          description: (err as { error?: string }).error,
        });
        return;
      }
      addToast("Perfil actualizado", { variant: "success" });
      router.refresh();
    } catch {
      addToast("Error de red", { variant: "error" });
    } finally {
      setSavingProfile(false);
    }
  }

  async function onSavePassword(values: PasswordForm) {
    setSavingPassword(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });
      if (error) {
        addToast("Error al cambiar contraseña", {
          variant: "error",
          description: error.message,
        });
        return;
      }
      addToast("Contraseña actualizada", { variant: "success" });
      resetPassword();
    } catch {
      addToast("Error de red", { variant: "error" });
    } finally {
      setSavingPassword(false);
    }
  }

  const initials = (profile.full_name ?? "A")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="max-w-2xl space-y-10">
      {/* ── Avatar ──────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-bold font-serif text-slate-900 dark:text-slate-100 mb-4">
          Foto de perfil
        </h2>

        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Avatar"
                width={80}
                height={80}
                className="rounded-full object-cover ring-2 ring-gold-200 dark:ring-gold-800"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-gold-100 dark:bg-gold-900/30 flex items-center justify-center">
                <span className="text-gold-700 dark:text-gold-300 font-bold font-serif text-2xl">
                  {initials}
                </span>
              </div>
            )}
          </div>

          <CldUploadWidget
            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "estateelevate"}
            onSuccess={(result) => {
              if (
                result.info &&
                typeof result.info === "object" &&
                "secure_url" in result.info
              ) {
                setAvatarUrl(result.info.secure_url as string);
                addToast("Foto subida", { variant: "success" });
              }
            }}
          >
            {({ open }) => (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => open()}
              >
                <Camera className="h-4 w-4 mr-2" aria-hidden />
                Cambiar foto
              </Button>
            )}
          </CldUploadWidget>
        </div>
      </section>

      {/* ── Profile form ────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-bold font-serif text-slate-900 dark:text-slate-100 mb-4">
          Información personal
        </h2>

        <form onSubmit={handleProfile(onSaveProfile)} className="space-y-4">
          <Input
            label="Nombre completo"
            placeholder="Tu nombre"
            error={profileErrors.full_name?.message}
            {...regProfile("full_name")}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Teléfono"
              type="tel"
              placeholder="+52 55 1234 5678"
              error={profileErrors.phone?.message}
              {...regProfile("phone")}
            />
            <Input
              label="WhatsApp"
              type="tel"
              placeholder="+52 55 1234 5678"
              error={profileErrors.whatsapp?.message}
              {...regProfile("whatsapp")}
            />
          </div>

          <Input
            label="Nombre de agencia"
            placeholder="Inmobiliaria XYZ"
            error={profileErrors.agency_name?.message}
            {...regProfile("agency_name")}
          />

          <Input
            label="Sitio web"
            type="url"
            placeholder="https://tusitioweb.com"
            error={profileErrors.website?.message}
            {...regProfile("website")}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Biografía{" "}
              <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <textarea
              {...regProfile("bio")}
              rows={3}
              placeholder="Cuéntanos sobre ti y tu experiencia..."
              className={cn(
                "w-full rounded-lg border border-slate-300 dark:border-slate-700",
                "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100",
                "px-3 py-2 text-sm resize-none",
                "placeholder:text-slate-400",
                "focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              )}
            />
            {profileErrors.bio && (
              <p className="text-xs text-red-500">{profileErrors.bio.message}</p>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={savingProfile}
          >
            <Save className="h-4 w-4 mr-2" aria-hidden />
            Guardar perfil
          </Button>
        </form>
      </section>

      {/* ── Password ─────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-bold font-serif text-slate-900 dark:text-slate-100 mb-4">
          Cambiar contraseña
        </h2>

        <form onSubmit={handlePassword(onSavePassword)} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                {...regPass("password")}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                className={cn(
                  "w-full rounded-lg border border-slate-300 dark:border-slate-700",
                  "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100",
                  "px-3 py-2 text-sm pr-10",
                  "focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500",
                  passErrors.password && "border-red-500 focus:ring-red-500"
                )}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden />
                )}
              </button>
            </div>
            {passErrors.password && (
              <p className="text-xs text-red-500">{passErrors.password.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Confirmar contraseña
            </label>
            <div className="relative">
              <input
                {...regPass("confirm")}
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                className={cn(
                  "w-full rounded-lg border border-slate-300 dark:border-slate-700",
                  "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100",
                  "px-3 py-2 text-sm pr-10",
                  "focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500",
                  passErrors.confirm && "border-red-500 focus:ring-red-500"
                )}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" aria-hidden />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden />
                )}
              </button>
            </div>
            {passErrors.confirm && (
              <p className="text-xs text-red-500">{passErrors.confirm.message}</p>
            )}
          </div>

          <Button type="submit" variant="secondary" loading={savingPassword}>
            Actualizar contraseña
          </Button>
        </form>
      </section>

      {/* ── Notifications ────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-bold font-serif text-slate-900 dark:text-slate-100 mb-4">
          Notificaciones
        </h2>

        <div className="space-y-3">
          {[
            {
              label: "Nuevos leads",
              description: "Recibir email cuando alguien contacte una de tus propiedades",
              value: notifLeads,
              onChange: setNotifLeads,
            },
            {
              label: "Novedades y marketing",
              description: "Actualizaciones de plataforma, tips y ofertas especiales",
              value: notifMarketing,
              onChange: setNotifMarketing,
            },
          ].map(({ label, description, value, onChange }) => (
            <div
              key={label}
              className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-700 p-4"
            >
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {label}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {description}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={value}
                onClick={() => onChange((v) => !v)}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full",
                  "transition-colors duration-200 ease-in-out focus-visible:outline-none",
                  "focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2",
                  value
                    ? "bg-teal-500"
                    : "bg-slate-200 dark:bg-slate-600"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow",
                    "transform ring-0 transition duration-200 ease-in-out mt-0.5",
                    value ? "translate-x-5" : "translate-x-0.5"
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Current plan ─────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-bold font-serif text-slate-900 dark:text-slate-100 mb-4">
          Tu plan
        </h2>
        <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-4">
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              Plan {planConfig.name}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {planConfig.listingLimit} propiedad{planConfig.listingLimit !== 1 ? "es" : ""} activa ·{" "}
              {planConfig.priceMonthly === 0
                ? "Gratis"
                : `$${planConfig.priceMonthly.toLocaleString("es-MX")}/mes`}
            </p>
          </div>
          <Button asChild variant="secondary" size="sm">
            <a href="/agent/plans">Cambiar plan</a>
          </Button>
        </div>
      </section>
    </div>
  );
}
