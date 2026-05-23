"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Link } from "@/lib/navigation";

export function CTABanner() {
  const t = useTranslations("home");

  return (
    <section
      className="relative py-12 sm:py-16 md:py-20 overflow-hidden"
      style={{ backgroundColor: "#0f172a" }}
    >
      {/* Subtle radial gradient decoration */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(224,159,26,0.12) 0%, transparent 70%)",
        }}
      />

      <motion.div
        className="relative z-10 max-w-3xl mx-auto px-4 text-center"
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="text-sm font-semibold text-gold-400 uppercase tracking-wider mb-4">
          {t("ctaAgents")}
        </p>
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-white mb-5 leading-tight">
          {t("ctaTitle")}
        </h2>
        <p className="text-slate-400 text-base sm:text-lg mb-8 max-w-xl mx-auto">
          {t("ctaSubtitle")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/search">{t("ctaExplore")}</Link>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
