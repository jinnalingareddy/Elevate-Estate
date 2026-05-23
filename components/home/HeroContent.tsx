"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { SearchBar } from "@/components/search/SearchBar";

export function HeroContent() {
  const t = useTranslations("home");

  return (
    <div className="flex flex-col items-center text-center gap-6">
      <motion.h1
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight"
      >
        {t("heroTitle")}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, delay: 0.2, ease: "easeOut" }}
        className="text-white/80 text-base sm:text-lg md:text-xl lg:text-2xl max-w-2xl"
      >
        {t("heroSubtitle")}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.4, ease: "easeOut" }}
        className="w-full max-w-3xl bg-white/10 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-white/20"
      >
        <Suspense fallback={<div className="h-12" />}>
          <SearchBar />
        </Suspense>
      </motion.div>
    </div>
  );
}
