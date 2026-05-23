"use client";

import {
  createContext,
  useCallback,
  useContext,
  useReducer,
  type ReactNode,
} from "react";
import * as RadixToast from "@radix-ui/react-toast";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

type ToastAction =
  | { type: "ADD"; toast: ToastItem }
  | { type: "REMOVE"; id: string };

// ─── Styles ───────────────────────────────────────────────────────────────────

const variantStyles: Record<ToastVariant, string> = {
  success:
    "border-l-4 border-l-teal-500 dark:border-l-teal-400",
  error:
    "border-l-4 border-l-red-500 dark:border-l-red-400",
  warning:
    "border-l-4 border-l-gold-500 dark:border-l-gold-400",
  info:
    "border-l-4 border-l-blue-500 dark:border-l-blue-400",
};

const variantIcons: Record<ToastVariant, React.ElementType> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const iconColors: Record<ToastVariant, string> = {
  success: "text-teal-500 dark:text-teal-400",
  error: "text-red-500 dark:text-red-400",
  warning: "text-gold-500 dark:text-gold-400",
  info: "text-blue-500 dark:text-blue-400",
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state: ToastItem[], action: ToastAction): ToastItem[] {
  if (action.type === "ADD") return [...state, action.toast];
  if (action.type === "REMOVE") return state.filter((t) => t.id !== action.id);
  return state;
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface ToastContextValue {
  addToast: (
    title: string,
    options?: { description?: string; variant?: ToastVariant }
  ) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, dispatch] = useReducer(reducer, []);

  const addToast = useCallback(
    (
      title: string,
      {
        description,
        variant = "info",
      }: { description?: string; variant?: ToastVariant } = {}
    ) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      dispatch({ type: "ADD", toast: { id, title, description, variant } });
      setTimeout(() => dispatch({ type: "REMOVE", id }), 4000);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ addToast }}>
      <RadixToast.Provider swipeDirection="right">
        {children}

        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => {
            const Icon = variantIcons[toast.variant];
            return (
              <RadixToast.Root
                key={toast.id}
                open
                onOpenChange={(open) => {
                  if (!open) dispatch({ type: "REMOVE", id: toast.id });
                }}
                asChild
                forceMount
              >
                <motion.li
                  layout
                  initial={{ opacity: 0, x: 80, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 80, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  className={cn(
                    "pointer-events-auto flex items-start gap-3",
                    "w-[360px] max-w-[calc(100vw-2rem)] rounded-lg p-4",
                    "bg-white shadow-lg dark:bg-slate-800",
                    "border border-slate-200 dark:border-slate-700",
                    variantStyles[toast.variant]
                  )}
                >
                  <Icon
                    className={cn("h-5 w-5 shrink-0 mt-0.5", iconColors[toast.variant])}
                    aria-hidden
                  />

                  <div className="flex-1 min-w-0">
                    <RadixToast.Title className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {toast.title}
                    </RadixToast.Title>
                    {toast.description && (
                      <RadixToast.Description className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {toast.description}
                      </RadixToast.Description>
                    )}
                  </div>

                  <RadixToast.Close
                    className={cn(
                      "shrink-0 rounded p-0.5 text-slate-400",
                      "hover:text-slate-600 hover:bg-slate-100",
                      "dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-700",
                      "transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500"
                    )}
                    aria-label="Cerrar"
                  >
                    <X className="h-4 w-4" />
                  </RadixToast.Close>
                </motion.li>
              </RadixToast.Root>
            );
          })}
        </AnimatePresence>

        <RadixToast.Viewport
          className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 outline-none"
          label="Notificaciones"
        />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return ctx;
}
