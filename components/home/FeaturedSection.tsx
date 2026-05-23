"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { PropertyCard } from "@/components/property/PropertyCard";
import type { Listing } from "@/lib/supabase/types";

interface FeaturedSectionProps {
  listings: Listing[];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.18 },
  },
};

const card = {
  hidden: { opacity: 0, y: 48 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
  },
};

export function FeaturedSection({ listings }: FeaturedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  if (listings.length === 0) {
    return (
      <p className="text-center text-slate-500 dark:text-slate-400 py-12">
        Próximamente nuevas propiedades destacadas.
      </p>
    );
  }

  // Uniform 2×2 grid (up to 4 cards, 2 columns on sm+)
  return (
    <motion.div
      ref={ref}
      variants={container}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {listings.slice(0, 4).map((listing, i) => (
        <motion.div key={listing.id} variants={card} className="h-full">
          <PropertyCard listing={listing} variant="vertical" priority={i === 0} />
        </motion.div>
      ))}
    </motion.div>
  );
}
