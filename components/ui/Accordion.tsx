"use client";

import * as RadixAccordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AccordionItem {
  value: string;
  question: string;
  answer: React.ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  type?: "single" | "multiple";
  defaultValue?: string | string[];
  className?: string;
  itemClassName?: string;
}

function Accordion({
  items,
  type = "single",
  defaultValue,
  className,
  itemClassName,
}: AccordionProps) {
  return (
    <RadixAccordion.Root
      type={type as "single"}
      defaultValue={defaultValue as string}
      collapsible={type === "single" ? true : undefined}
      className={cn("flex flex-col divide-y divide-slate-200 dark:divide-slate-700", className)}
    >
      {items.map((item) => (
        <AccordionItemComponent
          key={item.value}
          item={item}
          className={itemClassName}
        />
      ))}
    </RadixAccordion.Root>
  );
}

function AccordionItemComponent({
  item,
  className,
}: {
  item: AccordionItem;
  className?: string;
}) {
  return (
    <RadixAccordion.Item value={item.value} className={cn("group py-1", className)}>
      <RadixAccordion.Header>
        <RadixAccordion.Trigger
          className={cn(
            "flex w-full items-center justify-between gap-4",
            "py-4 text-left text-base font-medium",
            "text-slate-900 dark:text-slate-100",
            "hover:text-gold-600 dark:hover:text-gold-400",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-1",
            "transition-colors duration-150",
            "[&[data-state=open]]:text-gold-600 dark:[&[data-state=open]]:text-gold-400"
          )}
        >
          <span>{item.question}</span>

          <span className="inline-flex shrink-0 text-slate-400 dark:text-slate-500 group-data-[state=open]:text-gold-500">
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                "group-data-[state=open]:rotate-180"
              )}
              aria-hidden
            />
          </span>
        </RadixAccordion.Trigger>
      </RadixAccordion.Header>

      {/* Radix animates height via CSS overflow:hidden + data-state */}
      <RadixAccordion.Content
        className={cn(
          "overflow-hidden",
          "data-[state=open]:animate-[accordionOpen_200ms_ease-out]",
          "data-[state=closed]:animate-[accordionClose_200ms_ease-in]"
        )}
      >
        <div className="pb-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {item.answer}
        </div>
      </RadixAccordion.Content>
    </RadixAccordion.Item>
  );
}

// Re-export Radix primitives for custom usage
const AccordionRoot = RadixAccordion.Root;
const AccordionItem = RadixAccordion.Item;
const AccordionTrigger = RadixAccordion.Trigger;
const AccordionContent = RadixAccordion.Content;

export {
  Accordion,
  AccordionRoot,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
};
