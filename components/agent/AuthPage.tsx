"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  forwardRef,
} from "react";
import Image from "next/image";
import { useI18nRouter } from "@/lib/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CheckCircle2,
  ChevronLeft,
  Eye,
  EyeOff,
  Mail,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/providers/ToastProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const emailLoginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
  remember: z.boolean().optional(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
});

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
      .regex(/[0-9]/, "Debe contener al menos un número"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Mínimo 2 caracteres"),
    email: z.string().email("Correo electrónico inválido"),
    phone: z
      .string()
      .regex(/^\d{10}$/, "Ingresa 10 dígitos sin espacios ni guiones"),
    whatsapp: z
      .string()
      .regex(/^\d{12}$|^$/, "Ingresa 12 dígitos (ej: 521234567890) o déjalo vacío")
      .optional()
      .or(z.literal("")),
    agencyName: z.string().min(2, "Ingresa el nombre de tu agencia"),
    password: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
      .regex(/[0-9]/, "Debe contener al menos un número"),
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "Debes aceptar los términos" }),
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type EmailLoginValues = z.infer<typeof emailLoginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMexPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("52")) return `+${digits}`;
  return `+52${digits}`;
}

// ─── Tab indicator ────────────────────────────────────────────────────────────

function TabBar({
  options,
  active,
  onChange,
  layoutId,
}: {
  options: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
  layoutId: string;
}) {
  return (
    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={cn(
            "relative flex-1 py-2.5 text-sm font-medium rounded-lg z-0 transition-colors",
            active === opt.id
              ? "text-slate-900 dark:text-white"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          )}
        >
          {active === opt.id && (
            <motion.span
              layoutId={layoutId}
              className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm"
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            />
          )}
          <span className="relative z-10">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Password field with show/hide ───────────────────────────────────────────

const PasswordField = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    error?: string;
  }
>(({ label, error, ...props }, ref) => {
  const [visible, setVisible] = useState(false);
  const id = label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={visible ? "text" : "password"}
          className={cn(
            "w-full h-10 px-3 pr-10 rounded-lg border text-sm",
            "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100",
            "placeholder:text-slate-400 transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500",
            error
              ? "border-red-500"
              : "border-slate-300 dark:border-slate-700"
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden />
          ) : (
            <Eye className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-500 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
});

PasswordField.displayName = "PasswordField";

// ─── 6-box OTP input ──────────────────────────────────────────────────────────

function OtpInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (digits: string[]) => void;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function update(index: number, char: string) {
    const next = [...value];
    next[index] = char;
    onChange(next);
    if (char && index < 5) refs.current[index + 1]?.focus();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>, i: number) {
    const raw = e.target.value.replace(/\D/g, "");
    update(i, raw.slice(-1));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, i: number) {
    if (e.key === "Backspace" && !value[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent, startIdx: number) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...value];
    for (let j = 0; j < pasted.length && startIdx + j < 6; j++) {
      next[startIdx + j] = pasted[j];
    }
    onChange(next);
    refs.current[Math.min(startIdx + pasted.length, 5)]?.focus();
  }

  return (
    <div className="flex gap-2 justify-center">
      {value.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={(e) => handlePaste(e, i)}
          aria-label={`Dígito ${i + 1} del código`}
          className={cn(
            "w-11 h-13 text-center text-lg font-bold rounded-xl border-2 transition-colors",
            "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100",
            "focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30",
            digit
              ? "border-gold-500"
              : "border-slate-300 dark:border-slate-700"
          )}
        />
      ))}
    </div>
  );
}

// ─── Email login form ─────────────────────────────────────────────────────────

function EmailLoginForm({
  onSuccess,
  onForgotPassword,
}: {
  onSuccess: () => void;
  onForgotPassword: () => void;
}) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailLoginValues>({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  async function onSubmit(values: EmailLoginValues) {
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    setLoading(false);
    if (error) {
      addToast(
        error.message.includes("Invalid login credentials")
          ? "Correo o contraseña incorrectos"
          : error.message,
        { variant: "error" }
      );
    } else {
      onSuccess();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const passwordProps = register("password") as any;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Input
        label="Correo Electrónico"
        type="email"
        placeholder="correo@empresa.com"
        error={errors.email?.message}
        {...register("email")}
      />

      <PasswordField
        label="Contraseña"
        placeholder="••••••••"
        error={errors.password?.message}
        {...passwordProps}
      />

      <div className="flex items-center justify-between gap-4">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            {...register("remember")}
            className={cn(
              "h-4 w-4 rounded border-slate-300 dark:border-slate-600",
              "text-gold-500 focus:ring-gold-500 focus:ring-offset-0"
            )}
          />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Recordarme
          </span>
        </label>
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-sm font-medium text-gold-600 dark:text-gold-400 hover:text-gold-700 dark:hover:text-gold-300 hover:underline underline-offset-2 transition-colors"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>

      <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
        Iniciar Sesión
      </Button>
    </form>
  );
}

// ─── SMS OTP form ─────────────────────────────────────────────────────────────

function SmsLoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { addToast } = useToast();
  const [phase, setPhase] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) {
      addToast("Ingresa tu número de teléfono", { variant: "warning" });
      return;
    }
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const formatted = formatMexPhone(phone.replace(/\s/g, ""));
    const { error } = await supabase.auth.signInWithOtp({ phone: formatted });
    setLoading(false);
    if (error) {
      addToast(error.message, { variant: "error" });
    } else {
      addToast("Código enviado a tu teléfono", { variant: "success" });
      setPhase("otp");
      setCooldown(30);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const token = otpDigits.join("");
    if (token.length < 6) {
      addToast("Ingresa el código de 6 dígitos completo", { variant: "warning" });
      return;
    }
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const formatted = formatMexPhone(phone.replace(/\s/g, ""));
    const { error } = await supabase.auth.verifyOtp({
      phone: formatted,
      token,
      type: "sms",
    });
    setLoading(false);
    if (error) {
      addToast(error.message, { variant: "error" });
    } else {
      onSuccess();
    }
  }

  async function handleResend() {
    if (cooldown > 0) return;
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const formatted = formatMexPhone(phone.replace(/\s/g, ""));
    const { error } = await supabase.auth.signInWithOtp({ phone: formatted });
    setLoading(false);
    if (error) {
      addToast(error.message, { variant: "error" });
    } else {
      addToast("Código reenviado", { variant: "success" });
      setCooldown(30);
      setOtpDigits(Array(6).fill(""));
    }
  }

  if (phase === "phone") {
    return (
      <form onSubmit={handleSendOtp} className="space-y-4" noValidate>
        <Input
          label="Número de Teléfono"
          type="tel"
          placeholder="55 1234 5678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          helperText="Solo número mexicano, sin código de país"
        />
        <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
          Enviar Código
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerifyOtp} className="space-y-5" noValidate>
      <div className="text-center">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Código enviado a{" "}
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {phone}
          </span>
        </p>
      </div>

      <OtpInput value={otpDigits} onChange={setOtpDigits} />

      <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
        Verificar Código
      </Button>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => {
            setPhase("phone");
            setOtpDigits(Array(6).fill(""));
          }}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
          Cambiar número
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0}
          className={cn(
            "font-medium transition-colors",
            cooldown > 0
              ? "text-slate-400 cursor-not-allowed"
              : "text-gold-600 dark:text-gold-400 hover:underline"
          )}
        >
          {cooldown > 0 ? `Reenviar (${cooldown}s)` : "Reenviar código"}
        </button>
      </div>
    </form>
  );
}

// ─── Register form ────────────────────────────────────────────────────────────

function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      whatsapp: "",
      agencyName: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: RegisterValues) {
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.fullName,
          phone: values.phone,
          whatsapp: values.whatsapp || null,
          agency_name: values.agencyName,
        },
      },
    });
    setLoading(false);

    if (error) {
      addToast(error.message, { variant: "error" });
    } else if (data.session) {
      onSuccess();
    } else {
      setRegistered(true);
    }
  }

  if (registered) {
    return (
      <div className="text-center py-6 space-y-4">
        <div className="h-14 w-14 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-7 w-7 text-teal-600 dark:text-teal-400" aria-hidden />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          ¡Registro exitoso!
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
          Revisa tu correo electrónico y haz clic en el enlace de confirmación para activar tu cuenta.
        </p>
        <Button
          variant="outline"
          size="md"
          onClick={() => setRegistered(false)}
        >
          Volver al registro
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      <Input
        label="Nombre Completo"
        placeholder="María García"
        error={errors.fullName?.message}
        {...register("fullName")}
      />

      <Input
        label="Correo Electrónico"
        type="email"
        placeholder="maria@agencia.com"
        error={errors.email?.message}
        {...register("email")}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Teléfono"
          type="tel"
          placeholder="5512345678"
          error={errors.phone?.message}
          helperText="10 dígitos"
          {...register("phone")}
        />
        <Input
          label="WhatsApp"
          type="tel"
          placeholder="52551234567"
          error={errors.whatsapp?.message}
          helperText="Opcional"
          {...register("whatsapp")}
        />
      </div>

      <Input
        label="Nombre de Agencia / Empresa"
        placeholder="Inmobiliaria Ejemplo"
        error={errors.agencyName?.message}
        {...register("agencyName")}
      />

      <PasswordField
        label="Contraseña"
        placeholder="Mínimo 8 caracteres"
        error={errors.password?.message}
        {...register("password")}
      />

      <PasswordField
        label="Confirmar Contraseña"
        placeholder="Repite tu contraseña"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      <div className="pt-1">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            {...register("acceptTerms")}
            className="h-4 w-4 mt-0.5 shrink-0 rounded border-slate-300 dark:border-slate-600 text-gold-500 focus:ring-gold-500 focus:ring-offset-0"
          />
          <span className="text-sm text-slate-600 dark:text-slate-400 leading-snug">
            Acepto los{" "}
            <a
              href="/legal/terminos"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-600 dark:text-gold-400 hover:underline font-medium"
            >
              Términos de Servicio
            </a>{" "}
            y la{" "}
            <a
              href="/legal/privacidad"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-600 dark:text-gold-400 hover:underline font-medium"
            >
              Política de Privacidad
            </a>
          </span>
        </label>
        {errors.acceptTerms && (
          <p role="alert" className="text-xs text-red-500 dark:text-red-400 mt-1 ml-6">
            {errors.acceptTerms.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
        className="mt-2"
      >
        Registrarme
      </Button>
    </form>
  );
}

// ─── Forgot password form ─────────────────────────────────────────────────────

function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const { addToast } = useToast();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(values: ForgotPasswordValues) {
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/agent/auth?type=recovery`,
    });
    setLoading(false);
    if (error) {
      addToast(error.message, { variant: "error" });
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-full bg-gold-50 dark:bg-gold-900/20 flex items-center justify-center">
            <Mail className="h-7 w-7 text-gold-500" />
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Revisa tu correo
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enviamos instrucciones a{" "}
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {getValues("email")}
            </span>
          </p>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Si no ves el correo, revisa tu carpeta de spam.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium text-gold-600 dark:text-gold-400 hover:underline underline-offset-2"
        >
          ← Volver al inicio de sesión
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <h2 className="text-xl font-semibold font-serif text-slate-900 dark:text-slate-100">
          ¿Olvidaste tu contraseña?
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Ingresa tu correo y te enviaremos instrucciones para restablecerla.
        </p>
      </div>

      <Input
        label="Correo Electrónico"
        type="email"
        placeholder="correo@empresa.com"
        error={errors.email?.message}
        {...register("email")}
      />

      <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
        Enviar instrucciones
      </Button>

      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver al inicio de sesión
      </button>
    </form>
  );
}

// ─── Reset password form (from recovery email link) ───────────────────────────

function ResetPasswordForm({ onSuccess }: { onSuccess: () => void }) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  async function onSubmit(values: ResetPasswordValues) {
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password: values.password });
    setLoading(false);
    if (error) {
      addToast(error.message, { variant: "error" });
    } else {
      addToast("Contraseña actualizada correctamente", { variant: "success" });
      onSuccess();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const passwordProps = register("password") as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const confirmProps = register("confirmPassword") as any;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <h2 className="text-xl font-semibold font-serif text-slate-900 dark:text-slate-100">
          Nueva contraseña
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Elige una contraseña segura para tu cuenta.
        </p>
      </div>

      <PasswordField
        label="Nueva contraseña"
        placeholder="Mínimo 8 caracteres"
        error={errors.password?.message}
        {...passwordProps}
      />

      <PasswordField
        label="Confirmar contraseña"
        placeholder="Repite tu contraseña"
        error={errors.confirmPassword?.message}
        {...confirmProps}
      />

      <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
        Guardar contraseña
      </Button>
    </form>
  );
}

// ─── Left decorative panel ────────────────────────────────────────────────────

const FEATURE_BULLETS = [
  "Gestiona tus propiedades fácilmente",
  "Recibe prospectos calificados",
  "Planes desde $0 MXN/mes",
];

function LeftPanel() {
  return (
    <div className="hidden lg:flex relative w-1/2 flex-col overflow-hidden">
      <Image
        src="https://res.cloudinary.com/do892kbiw/image/upload/v1779510616/static/auth-background.jpg"
        alt="Propiedad residencial de lujo"
        fill
        className="object-cover"
        priority
        sizes="50vw"
      />
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/92 via-slate-900/75 to-slate-800/55" />

      <div className="relative z-10 flex flex-col h-full p-10 lg:p-12">
        {/* Logo top-left */}
        <div>
          <span className="font-serif text-xl font-bold text-white select-none">
            Estate<span className="text-gold-400">Elevate</span>
          </span>
        </div>

        {/* Bottom content */}
        <div className="mt-auto">
          <h2 className="text-4xl font-bold font-serif text-white leading-tight">
            EstateElevate
          </h2>
          <p className="text-white/70 text-xl mt-2">
            Eleva tu negocio inmobiliario
          </p>

          <ul className="mt-8 space-y-4">
            {FEATURE_BULLETS.map((bullet) => (
              <li key={bullet} className="flex items-center gap-3">
                <span className="h-6 w-6 rounded-full bg-gold-500/20 border border-gold-400/40 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-3.5 w-3.5 text-gold-400" aria-hidden />
                </span>
                <span className="text-white/85 text-base">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── AuthPage ─────────────────────────────────────────────────────────────────

const MAIN_TABS = [
  { id: "login", label: "Iniciar Sesión" },
  { id: "register", label: "Registrarse" },
];

const LOGIN_METHOD_TABS = [
  { id: "email", label: "Email y Contraseña" },
  { id: "sms", label: "Código SMS" },
];

export function AuthPage({
  errorParam,
  returnTo,
  recoveryMode,
}: {
  errorParam?: string;
  returnTo?: string;
  recoveryMode?: boolean;
}) {
  const router = useI18nRouter();
  const { addToast } = useToast();
  const [view, setView] = useState<"auth" | "forgot" | "recovery">(
    recoveryMode ? "recovery" : "auth"
  );
  const [mainTab, setMainTab] = useState<"login" | "register">("login");
  const [loginMethod, setLoginMethod] = useState<"email" | "sms">("email");
  const errorShown = useRef(false);

  // Handle ?error= query param
  useEffect(() => {
    if (errorShown.current) return;
    errorShown.current = true;
    if (errorParam === "banned") {
      addToast("Tu cuenta ha sido suspendida. Contacta soporte.", {
        variant: "error",
      });
    } else if (errorParam === "unauthorized") {
      addToast("Inicia sesión para continuar.", { variant: "warning" });
    }
  }, [errorParam, addToast]);

  function handleAuthSuccess() {
    addToast("Sesión iniciada correctamente", { variant: "success" });
    router.push(returnTo && returnTo.startsWith("/") ? returnTo : "/agent/dashboard");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-slate-950">
      {/* ── Left panel ─────────────────────────────────────────────────── */}
      <LeftPanel />

      {/* ── Right panel ────────────────────────────────────────────────── */}
      <div className="flex-1 lg:w-1/2 flex flex-col overflow-y-auto">
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            {/* Mobile-only logo */}
            <p className="lg:hidden font-serif text-xl font-bold text-slate-900 dark:text-white mb-6">
              Estate<span className="text-gold-500">Elevate</span>
            </p>

            <AnimatePresence mode="wait">
              {view === "forgot" ? (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <ForgotPasswordForm onBack={() => setView("auth")} />
                </motion.div>
              ) : view === "recovery" ? (
                <motion.div
                  key="recovery"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <ResetPasswordForm onSuccess={handleAuthSuccess} />
                </motion.div>
              ) : (
                <motion.div
                  key="auth"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {/* Heading */}
                  <div className="mb-6">
                    <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-slate-100">
                      Portal de Agentes
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Gestiona tus propiedades y prospectos
                    </p>
                  </div>

                  {/* Main tabs */}
                  <div className="mb-6">
                    <TabBar
                      options={MAIN_TABS}
                      active={mainTab}
                      onChange={(id) => setMainTab(id as "login" | "register")}
                      layoutId="auth-main-tab"
                    />
                  </div>

                  {/* Tab content */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={mainTab}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      {mainTab === "login" ? (
                        <div>
                          {/* Login sub-tabs */}
                          <div className="flex border-b border-slate-200 dark:border-slate-800 mb-5">
                            {LOGIN_METHOD_TABS.map((tab) => (
                              <button
                                key={tab.id}
                                type="button"
                                onClick={() =>
                                  setLoginMethod(tab.id as "email" | "sms")
                                }
                                className={cn(
                                  "flex items-center gap-1.5 px-1 pb-3 mr-5 text-sm font-medium border-b-2 -mb-px transition-colors",
                                  loginMethod === tab.id
                                    ? "border-gold-500 text-gold-600 dark:text-gold-400"
                                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                )}
                              >
                                {tab.id === "email" ? (
                                  <Mail className="h-3.5 w-3.5" aria-hidden />
                                ) : (
                                  <Phone className="h-3.5 w-3.5" aria-hidden />
                                )}
                                {tab.label}
                              </button>
                            ))}
                          </div>

                          <AnimatePresence mode="wait">
                            <motion.div
                              key={loginMethod}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              transition={{ duration: 0.18 }}
                            >
                              {loginMethod === "email" ? (
                                <EmailLoginForm
                                  onSuccess={handleAuthSuccess}
                                  onForgotPassword={() => setView("forgot")}
                                />
                              ) : (
                                <SmsLoginForm onSuccess={handleAuthSuccess} />
                              )}
                            </motion.div>
                          </AnimatePresence>
                        </div>
                      ) : (
                        <RegisterForm onSuccess={handleAuthSuccess} />
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Bottom link */}
                  <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    ¿Eres comprador?{" "}
                    <a
                      href="/search"
                      className="font-medium text-gold-600 dark:text-gold-400 hover:underline underline-offset-2"
                    >
                      Explora propiedades →
                    </a>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
