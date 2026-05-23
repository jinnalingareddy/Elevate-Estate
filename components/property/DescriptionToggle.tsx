"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const PREVIEW_CHARS = 220;

export function DescriptionToggle({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const needsToggle = text.length > PREVIEW_CHARS;
  const preview = needsToggle ? text.slice(0, PREVIEW_CHARS).trimEnd() + "…" : text;

  return (
    <div>
      <AnimatePresence initial={false} mode="wait">
        <motion.p
          key={expanded ? "full" : "preview"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line"
        >
          {expanded ? text : preview}
        </motion.p>
      </AnimatePresence>

      {needsToggle && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            "mt-3 flex items-center gap-1 text-sm font-medium",
            "text-gold-600 dark:text-gold-400 hover:text-gold-700 dark:hover:text-gold-300 transition-colors"
          )}
        >
          {expanded ? "Leer menos" : "Leer más"}
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4" aria-hidden />
          </motion.span>
        </button>
      )}
    </div>
  );
}
