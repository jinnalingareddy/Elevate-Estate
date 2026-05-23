"use client";

import { useState, useRef, useEffect } from "react";
import { GraduationCap, ShoppingBag, Train, Utensils } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Category = "food" | "transit" | "education" | "shops";

const ICONS: Record<Category, LucideIcon> = {
  food:      Utensils,
  transit:   Train,
  education: GraduationCap,
  shops:     ShoppingBag,
};

interface NeighborhoodCardProps {
  category: Category;
  name: string;
  distance: string;
  count: string;
  places: string[];
}

export function NeighborhoodCard({ category, name, distance, count, places }: NeighborhoodCardProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const Icon = ICONS[category];

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative flex flex-col items-center text-center gap-2 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
      <div className="h-10 w-10 rounded-full bg-gold-100 dark:bg-gold-900/30 flex items-center justify-center">
        <Icon className="h-5 w-5 text-gold-600 dark:text-gold-400" aria-hidden />
      </div>
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{name}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{distance}</p>

      <button
        onClick={() => setOpen((o) => !o)}
        className="text-xs text-teal-600 dark:text-teal-400 font-medium underline-offset-2 hover:underline focus:outline-none cursor-pointer"
        aria-expanded={open}
      >
        {count}
      </button>

      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 w-52 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg p-3 text-left">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">{name} cercanos</p>
          {places.length > 0 ? (
            <ul className="space-y-1">
              {places.map((place) => (
                <li key={place} className="text-xs text-slate-700 dark:text-slate-300 truncate">
                  • {place}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic">Sin nombres disponibles</p>
          )}
        </div>
      )}
    </div>
  );
}
