"use client";

import { forwardRef, useId } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: "default" | "search";
  containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      label,
      error,
      helperText,
      variant = "default",
      id: idProp,
      type = "text",
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = idProp ?? generatedId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;

    const inputBase = cn(
      "w-full rounded-lg border bg-white px-3 py-2 text-base md:text-sm text-slate-900",
      "placeholder:text-slate-400",
      "transition-colors duration-150",
      "focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-0 focus:border-gold-500",
      "disabled:cursor-not-allowed disabled:opacity-50",
      // dark mode
      "dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500",
      "dark:border-slate-700 dark:focus:border-gold-500",
      error
        ? "border-red-500 focus:ring-red-500 dark:border-red-500"
        : "border-slate-300",
      variant === "search" && "pl-9",
      className
    );

    return (
      <div className={cn("flex flex-col gap-1.5", containerClassName)}>
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {variant === "search" && (
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none"
              aria-hidden
            />
          )}

          <input
            ref={ref}
            id={id}
            type={type}
            className={inputBase}
            aria-invalid={!!error}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            {...props}
          />
        </div>

        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-xs text-red-500 dark:text-red-400"
          >
            {error}
          </p>
        )}

        {!error && helperText && (
          <p
            id={helperId}
            className="text-xs text-slate-500 dark:text-slate-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
