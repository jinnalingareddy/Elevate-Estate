"use client";

import { useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, useInView } from "framer-motion";
import { ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const MEXICAN_STATES = [
  "Aguascalientes",
  "Baja California",
  "Baja California Sur",
  "Campeche",
  "Chiapas",
  "Chihuahua",
  "Ciudad de México",
  "Coahuila",
  "Colima",
  "Durango",
  "Guanajuato",
  "Guerrero",
  "Hidalgo",
  "Jalisco",
  "Estado de México",
  "Michoacán",
  "Morelos",
  "Nayarit",
  "Nuevo León",
  "Oaxaca",
  "Puebla",
  "Querétaro",
  "Quintana Roo",
  "San Luis Potosí",
  "Sinaloa",
  "Sonora",
  "Tabasco",
  "Tamaulipas",
  "Tlaxcala",
  "Veracruz",
  "Yucatán",
  "Zacatecas",
];

const PREVIEW_COUNT = 12;

export function StatesGrid() {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchBase = pathname.startsWith("/en") ? "/en/search" : "/search";
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const visible = expanded ? MEXICAN_STATES : MEXICAN_STATES.slice(0, PREVIEW_COUNT);
  const hidden = MEXICAN_STATES.length - PREVIEW_COUNT;

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
          Explorar por Estado
        </h3>
        <span className="text-sm text-slate-400 dark:text-slate-500">
          {MEXICAN_STATES.length} estados
        </span>
      </div>

      <motion.div
        ref={ref}
        variants={container}
        initial="hidden"
        animate={inView ? "show" : "hidden"}
        className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2"
      >
        {visible.map((state) => (
          <motion.button
            key={state}
            variants={item}
            type="button"
            onClick={() =>
              router.push(
                `${searchBase}?city=${encodeURIComponent(state)}`
              )
            }
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-left",
              "border border-slate-200 dark:border-slate-700",
              "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300",
              "hover:border-gold-400 hover:bg-gold-50 hover:text-gold-600",
              "dark:hover:border-gold-500 dark:hover:bg-gold-900/20 dark:hover:text-gold-400",
              "transition-colors duration-150"
            )}
          >
            <MapPin className="h-3 w-3 shrink-0 text-slate-400" aria-hidden />
            <span className="truncate">{state}</span>
          </motion.button>
        ))}
      </motion.div>

      {!expanded && hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className={cn(
            "mt-4 flex items-center gap-1.5 mx-auto px-5 py-3 min-h-[44px] rounded-full text-sm font-medium",
            "border border-slate-200 dark:border-slate-700",
            "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400",
            "hover:border-gold-400 hover:text-gold-600 dark:hover:text-gold-400",
            "transition-colors duration-150"
          )}
        >
          <ChevronDown className="h-4 w-4" />
          Ver {hidden} estados más
        </button>
      )}

      {expanded && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className={cn(
            "mt-4 flex items-center gap-1.5 mx-auto px-5 py-3 min-h-[44px] rounded-full text-sm font-medium",
            "border border-slate-200 dark:border-slate-700",
            "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400",
            "hover:border-gold-400 hover:text-gold-600 dark:hover:text-gold-400",
            "transition-colors duration-150"
          )}
        >
          <ChevronUp className="h-4 w-4" />
          Mostrar menos
        </button>
      )}
    </div>
  );
}
