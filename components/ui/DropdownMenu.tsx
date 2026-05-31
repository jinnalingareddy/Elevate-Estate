"use client";

import * as Radix from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Sub-components ───────────────────────────────────────────────────────────

const DropdownMenuRoot = Radix.Root;
const DropdownMenuTrigger = Radix.Trigger;
const DropdownMenuGroup = Radix.Group;
const DropdownMenuPortal = Radix.Portal;
const DropdownMenuSub = Radix.Sub;
const DropdownMenuRadioGroup = Radix.RadioGroup;

// ─── Animated content wrapper ─────────────────────────────────────────────────

function DropdownMenuContent({
  className,
  sideOffset = 6,
  children,
  ...props
}: Radix.DropdownMenuContentProps) {
  return (
    <Radix.Portal>
      <Radix.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[10rem] overflow-hidden rounded-xl",
          "bg-white dark:bg-slate-800",
          "border border-slate-200 dark:border-slate-700",
          "shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
          "p-1",
          // Radix animation hooks (CSS-based for reliability)
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      >
        {children}
      </Radix.Content>
    </Radix.Portal>
  );
}

// ─── Item ─────────────────────────────────────────────────────────────────────

function DropdownMenuItem({
  className,
  inset,
  destructive = false,
  ...props
}: Radix.DropdownMenuItemProps & {
  inset?: boolean;
  destructive?: boolean;
}) {
  return (
    <Radix.Item
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2",
        "rounded-md px-2 py-1.5 text-sm outline-none",
        "transition-colors duration-100",
        destructive
          ? [
              "text-red-600 dark:text-red-400",
              "focus:bg-red-50 focus:text-red-700",
              "dark:focus:bg-red-900/20 dark:focus:text-red-300",
            ]
          : [
              "text-slate-700 dark:text-slate-200",
              "focus:bg-gold-50 focus:text-gold-700",
              "dark:focus:bg-gold-900/20 dark:focus:text-gold-300",
            ],
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        inset && "pl-8",
        className
      )}
      {...props}
    />
  );
}

// ─── Label ────────────────────────────────────────────────────────────────────

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: Radix.DropdownMenuLabelProps & { inset?: boolean }) {
  return (
    <Radix.Label
      className={cn(
        "px-2 py-1 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide",
        inset && "pl-8",
        className
      )}
      {...props}
    />
  );
}

// ─── Separator ────────────────────────────────────────────────────────────────

function DropdownMenuSeparator({ className, ...props }: Radix.DropdownMenuSeparatorProps) {
  return (
    <Radix.Separator
      className={cn(
        "-mx-1 my-1 h-px bg-slate-100 dark:bg-slate-700",
        className
      )}
      {...props}
    />
  );
}

// ─── Checkbox item ────────────────────────────────────────────────────────────

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: Radix.DropdownMenuCheckboxItemProps) {
  return (
    <Radix.CheckboxItem
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-md",
        "py-1.5 pl-8 pr-2 text-sm outline-none",
        "text-slate-700 dark:text-slate-200",
        "focus:bg-gold-50 focus:text-gold-700 dark:focus:bg-gold-900/20 dark:focus:text-gold-300",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "transition-colors duration-100",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <Radix.ItemIndicator>
          <Check className="h-3.5 w-3.5 text-gold-500" />
        </Radix.ItemIndicator>
      </span>
      {children}
    </Radix.CheckboxItem>
  );
}

// ─── Radio item ───────────────────────────────────────────────────────────────

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: Radix.DropdownMenuRadioItemProps) {
  return (
    <Radix.RadioItem
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-md",
        "py-1.5 pl-8 pr-2 text-sm outline-none",
        "text-slate-700 dark:text-slate-200",
        "focus:bg-gold-50 focus:text-gold-700 dark:focus:bg-gold-900/20 dark:focus:text-gold-300",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "transition-colors duration-100",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <Radix.ItemIndicator>
          <Circle className="h-2 w-2 fill-gold-500 text-gold-500" />
        </Radix.ItemIndicator>
      </span>
      {children}
    </Radix.RadioItem>
  );
}

// ─── Sub trigger & content ────────────────────────────────────────────────────

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: Radix.DropdownMenuSubTriggerProps & { inset?: boolean }) {
  return (
    <Radix.SubTrigger
      className={cn(
        "flex cursor-pointer select-none items-center justify-between gap-2",
        "rounded-md px-2 py-1.5 text-sm outline-none",
        "text-slate-700 dark:text-slate-200",
        "focus:bg-gold-50 focus:text-gold-700 dark:focus:bg-gold-900/20 dark:focus:text-gold-300",
        "data-[state=open]:bg-gold-50 data-[state=open]:text-gold-700",
        "dark:data-[state=open]:bg-gold-900/20 dark:data-[state=open]:text-gold-300",
        inset && "pl-8",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden />
    </Radix.SubTrigger>
  );
}

function DropdownMenuSubContent({
  className,
  ...props
}: Radix.DropdownMenuSubContentProps) {
  return (
    <Radix.SubContent
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-xl",
        "bg-white dark:bg-slate-800",
        "border border-slate-200 dark:border-slate-700",
        "shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
        "p-1",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        className
      )}
      {...props}
    />
  );
}

export {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuRadioGroup,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSub,
  DropdownMenuGroup,
  DropdownMenuPortal,
};
