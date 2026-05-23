"use client";

import { useId } from "react";
import * as RadixSwitch from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  id?: string;
  name?: string;
  className?: string;
}

function Switch({
  checked,
  defaultChecked,
  onCheckedChange,
  disabled = false,
  label,
  description,
  id: idProp,
  name,
  className,
}: SwitchProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <RadixSwitch.Root
        id={id}
        name={name}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full",
          "border-2 border-transparent",
          "transition-colors duration-200 ease-in-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          // off state
          "bg-slate-300 dark:bg-slate-600",
          // on state
          "data-[state=checked]:bg-gold-500 dark:data-[state=checked]:bg-gold-500"
        )}
      >
        <RadixSwitch.Thumb
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg",
            "ring-0 transition-transform duration-200 ease-in-out",
            "translate-x-0 data-[state=checked]:translate-x-5"
          )}
        />
      </RadixSwitch.Root>

      {(label || description) && (
        <label
          htmlFor={id}
          className={cn(
            "flex flex-col cursor-pointer select-none",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          {label && (
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {description}
            </span>
          )}
        </label>
      )}
    </div>
  );
}

export { Switch };
