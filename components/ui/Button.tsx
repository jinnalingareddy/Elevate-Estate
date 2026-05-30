"use client";

import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { Loader2 } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center font-medium rounded-lg",
    "transition-colors transition-transform focus-visible:outline-none focus-visible:ring-2",
    "focus-visible:ring-gold-500 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-gold-500 text-white hover:bg-gold-600 dark:hover:bg-gold-600",
        secondary:
          "bg-slate-700 text-white hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500",
        ghost:
          "bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
        outline:
          "border border-gold-500 text-gold-500 bg-transparent hover:bg-gold-50 dark:hover:bg-gold-950/40",
      },
      size: {
        sm: "h-11 md:h-8 px-3 text-sm",
        md: "h-11 md:h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps extends VariantProps<typeof buttonVariants> {
  loading?: boolean;
  asChild?: boolean;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  form?: string;
  name?: string;
  value?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-expanded"?: boolean;
  "aria-controls"?: string;
  id?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      loading = false,
      disabled,
      asChild = false,
      children,
      type = "button",
      onClick,
      ...rest
    },
    ref
  ) => {
    const classes = cn(buttonVariants({ variant, size, fullWidth, className }));
    const isDisabled = disabled || loading;

    if (asChild) {
      return (
        <Slot ref={ref} className={classes} {...rest}>
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        className={cn(classes, !isDisabled && "hover:-translate-y-0.5 active:scale-[0.97]")}
        disabled={isDisabled}
        onClick={onClick}
        {...(rest as object)}
      >
        {loading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" aria-hidden />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
