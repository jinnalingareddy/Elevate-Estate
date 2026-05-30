"use client";

import * as Dialog from "@radix-ui/react-dialog";
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
      <Dialog.Portal>
            {/* Overlay */}
            <Dialog.Overlay
              className={cn(
                "fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm",
                "data-[state=open]:animate-in data-[state=closed]:animate-out",
                "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
                "duration-200"
              )}
            />

            {/* Content */}
            <Dialog.Content
              className={cn(
                "fixed left-1/2 top-1/2 z-[9999] w-[calc(100vw-2rem)]",
                "-translate-x-1/2 -translate-y-1/2",
                maxWidth,
                "rounded-xl bg-white p-6 shadow-2xl",
                "dark:bg-slate-900 dark:shadow-slate-900/50",
                "focus:outline-none",
                "data-[state=open]:animate-in data-[state=closed]:animate-out",
                "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
                "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
                "duration-200",
                className
              )}
              style={{
                paddingTop: "max(1.5rem, env(safe-area-inset-top))",
                paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
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
            </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// Re-export Radix primitives for advanced usage
const ModalTrigger = Dialog.Trigger;
const ModalClose = Dialog.Close;

export { Modal, ModalTrigger, ModalClose };
