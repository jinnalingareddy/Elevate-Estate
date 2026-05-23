"use client";

import { useState } from "react";
import * as RadixTabs from "@radix-ui/react-tabs";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "./Badge";

export interface TabItem {
  value: string;
  label: string;
  count?: number;
  content?: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  variant?: "underline" | "pill";
  className?: string;
  contentClassName?: string;
}

function Tabs({
  items,
  defaultValue,
  value,
  onValueChange,
  variant = "underline",
  className,
  contentClassName,
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(
    defaultValue ?? items[0]?.value ?? ""
  );
  const activeValue = value ?? internalValue;

  const handleChange = (v: string) => {
    setInternalValue(v);
    onValueChange?.(v);
  };

  return (
    <RadixTabs.Root
      value={activeValue}
      onValueChange={handleChange}
      className={className}
    >
      <RadixTabs.List
        className={cn(
          "flex",
          variant === "underline" &&
            "border-b border-slate-200 dark:border-slate-700 gap-0",
          variant === "pill" &&
            "gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit"
        )}
        aria-label="Navigation tabs"
      >
        {items.map((item) => {
          const isActive = activeValue === item.value;

          return (
            <RadixTabs.Trigger
              key={item.value}
              value={item.value}
              className={cn(
                "relative inline-flex items-center gap-2 font-medium text-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-1",
                "transition-colors duration-150 select-none",

                variant === "underline" && [
                  "px-4 py-2.5",
                  isActive
                    ? "text-gold-600 dark:text-gold-400"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
                ],

                variant === "pill" && [
                  "px-3 py-1.5 rounded-md z-10",
                  isActive
                    ? "text-white"
                    : "text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200",
                ]
              )}
            >
              {/* Animated indicator */}
              {isActive && variant === "underline" && (
                <motion.span
                  layoutId="tabs-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-500 dark:bg-gold-400"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              {isActive && variant === "pill" && (
                <motion.span
                  layoutId="tabs-pill"
                  className="absolute inset-0 rounded-md bg-gold-500 dark:bg-gold-600"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              <span className="relative z-10">{item.label}</span>

              {item.count !== undefined && (
                <Badge
                  variant="default"
                  size="sm"
                  className={cn(
                    "relative z-10 text-[10px]",
                    isActive &&
                      variant === "pill" &&
                      "bg-white/20 text-white dark:bg-white/10"
                  )}
                >
                  {item.count}
                </Badge>
              )}
            </RadixTabs.Trigger>
          );
        })}
      </RadixTabs.List>

      {items.map((item) =>
        item.content ? (
          <RadixTabs.Content
            key={item.value}
            value={item.value}
            className={cn("mt-4 focus-visible:outline-none", contentClassName)}
          >
            {item.content}
          </RadixTabs.Content>
        ) : null
      )}
    </RadixTabs.Root>
  );
}

// Re-export Radix primitives for fully custom usage
const TabsRoot = RadixTabs.Root;
const TabsList = RadixTabs.List;
const TabsTrigger = RadixTabs.Trigger;
const TabsContent = RadixTabs.Content;

export { Tabs, TabsRoot, TabsList, TabsTrigger, TabsContent };
