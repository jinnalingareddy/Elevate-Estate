"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { Link } from "@/lib/navigation";
import { useTranslations } from "next-intl";

interface City {
  name: string;
  query: string;
  photo: string;
  alt: string;
}

interface CitiesGridProps {
  cities: City[];
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const card = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } },
};

export function CitiesGrid({ cities }: CitiesGridProps) {
  const t = useTranslations("home");
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      variants={container}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {cities.map((city) => (
        <motion.div key={city.query} variants={card}>
          <Link href={`/search?city=${encodeURIComponent(city.query)}`} className="group block">
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
              <Image
                src={city.photo}
                alt={city.alt}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-5">
                <p className="text-white font-semibold text-base sm:text-lg leading-tight">
                  {city.name}
                </p>
                <p className="text-white/70 text-sm mt-1 group-hover:text-gold-400 transition-colors">
                  {t("viewProperties")}
                </p>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
