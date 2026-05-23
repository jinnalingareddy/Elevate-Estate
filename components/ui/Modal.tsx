"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  /** Max width class, defaults to max-w-lg */
  maxWidth?: string;
  /** Hide the default close button */
  hideClose?: boolean;
}

function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  maxWidth = "max-w-lg",
  hideClose = false,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            {/* Overlay */}
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>

            {/* Content */}
            <Dialog.Content asChild>
              <motion.div
                className={cn(
                  "fixed left-1/2 top-1/2 z-[9999] w-[calc(100vw-2rem)]",
                  maxWidth,
                  "rounded-xl bg-white p-6 shadow-2xl",
                  "dark:bg-slate-900 dark:shadow-slate-900/50",
                  "focus:outline-none",
                  className
                )}
                style={{
                  x: "-50%",
                  y: "-50%",
                  paddingTop: "max(1.5rem, env(safe-area-inset-top))",
                  paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
                }}
                initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-48%" }}
                animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-48%" }}
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 30,
                }}
              >
                {/* Header */}
                {(title || !hideClose) && (
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      {title && (
                        <Dialog.Title className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                          {title}
                        </Dialog.Title>
                      )}
                      {description && (
                        <Dialog.Description className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {description}
                        </Dialog.Description>
                      )}
                    </div>

                    {!hideClose && (
                      <Dialog.Close
                        className={cn(
                          "shrink-0 rounded-md p-1 text-slate-400",
                          "hover:text-slate-600 hover:bg-slate-100",
                          "dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-800",
                          "focus:outline-none focus:ring-2 focus:ring-gold-500",
                          "transition-colors"
                        )}
                        aria-label="Cerrar"
                      >
                        <X className="h-5 w-5" />
                      </Dialog.Close>
                    )}
                  </div>
                )}

                {/* Body */}
                <div>{children}</div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

// Re-export Radix primitives for advanced usage
const ModalTrigger = Dialog.Trigger;
const ModalClose = Dialog.Close;

export { Modal, ModalTrigger, ModalClose };
