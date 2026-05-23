"use client";

// 1×1 gray pixel — valid base64 data URI required by Next.js placeholder="blur"
const BLUR_PLACEHOLDER =
  "data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ListingImage } from "@/lib/supabase/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PropertyGalleryProps {
  images: ListingImage[];
  title: string;
}

// ─── Fullscreen modal ─────────────────────────────────────────────────────────

function FullscreenModal({
  images,
  startIndex,
  title,
  onClose,
}: {
  images: ListingImage[];
  startIndex: number;
  title: string;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(startIndex);

  const prev = useCallback(() => {
    setCurrent((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback(() => {
    setCurrent((i) => (i + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, onClose]);

  // Lock scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const img = images[current];

  const preloadIndices = useMemo(() => {
    if (images.length <= 1) return [];
    const candidates = [
      (current - 1 + images.length) % images.length,
      (current + 1) % images.length,
      (current + 2) % images.length,
    ];
    return Array.from(new Set(candidates)).filter(i => i !== current);
  }, [current, images.length]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col bg-black/95"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <p className="text-white/70 text-sm font-medium">
          {title}
        </p>
        <div className="flex items-center gap-4">
          <span className="text-white/70 text-sm tabular-nums">
            {current + 1} / {images.length}
          </span>
          <button
            onClick={onClose}
            aria-label="Cerrar galería"
            className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main image */}
      <div className="relative flex-1 flex items-center justify-center px-0 sm:px-16 min-h-0">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current}
            className="relative w-full h-full"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Image
              src={img.medium_url}
              alt={`${title} — foto ${current + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
              />
          </motion.div>
        </AnimatePresence>

        {/* Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Foto anterior"
              className={cn(
                "absolute left-0 sm:left-2 top-1/2 -translate-y-1/2",
                "p-4 sm:p-3 rounded-r-xl sm:rounded-full bg-black/50 text-white",
                "hover:bg-black/70 transition-colors"
              )}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={next}
              aria-label="Foto siguiente"
              className={cn(
                "absolute right-0 sm:right-2 top-1/2 -translate-y-1/2",
                "p-4 sm:p-3 rounded-l-xl sm:rounded-full bg-black/50 text-white",
                "hover:bg-black/70 transition-colors"
              )}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {/* Preload prev/next images so navigation is instant */}
      <div className="sr-only" aria-hidden="true">
        {preloadIndices.map(i => (
          <div key={images[i].public_id} style={{ position: "fixed", width: 1, height: 1, overflow: "hidden", opacity: 0, pointerEvents: "none" }}>
            <Image
              src={images[i].medium_url}
              alt=""
              fill
              sizes="100vw"
              priority
            />
          </div>
        ))}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="shrink-0 px-4 py-3">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none px-2" style={{ scrollSnapType: "x mandatory" }}>
            {images.map((img, i) => (
              <button
                key={img.public_id}
                onClick={() => setCurrent(i)}
                style={{ scrollSnapAlign: "center" }}
                className={cn(
                  "relative h-10 w-14 sm:h-14 sm:w-20 shrink-0 rounded overflow-hidden",
                  "transition-all duration-150",
                  i === current
                    ? "ring-2 ring-gold-500 opacity-100"
                    : "opacity-50 hover:opacity-75"
                )}
                aria-label={`Ver foto ${i + 1}`}
                aria-current={i === current ? "true" : undefined}
              >
                <Image
                  src={img.thumbnail_url}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── PropertyGallery ──────────────────────────────────────────────────────────

export function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);

  if (!images.length) {
    return (
      <div className="w-full h-[320px] bg-slate-200 dark:bg-slate-700 rounded-xl flex items-center justify-center">
        <span className="text-slate-400">Sin fotos disponibles</span>
      </div>
    );
  }

  const [hero, second, third, ...rest] = images;
  const hasMore = images.length > 3;

  return (
    <>
      {/* ── Hero grid ─────────────────────────────────────────────────────── */}
      <div className="relative flex gap-2 h-[220px] sm:h-[300px] md:h-[420px] lg:h-[520px] rounded-xl overflow-hidden">
        {/* Large photo — 60% */}
        <button
          className="relative flex-[3] overflow-hidden rounded-l-xl group"
          onClick={() => setFullscreenIndex(0)}
          aria-label={`Ver foto 1 de ${images.length}`}
        >
          <Image
            src={hero.medium_url}
            alt={`${title} — foto principal`}
            fill
            sizes="(max-width: 768px) 100vw, 60vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            priority
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER}
          />
        </button>

        {/* Right column — 40% */}
        {second && (
          <div className="flex flex-[2] flex-col gap-2">
            <button
              className="relative flex-1 overflow-hidden group"
              onClick={() => setFullscreenIndex(1)}
              aria-label={`Ver foto 2 de ${images.length}`}
            >
              <Image
                src={second.medium_url}
                alt={`${title} — foto 2`}
                fill
                sizes="(max-width: 768px) 0vw, 40vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                placeholder="blur"
                blurDataURL={BLUR_PLACEHOLDER}
              />
            </button>

            {third && (
              <button
                className="relative flex-1 overflow-hidden rounded-br-xl group"
                onClick={() => setFullscreenIndex(2)}
                aria-label={`Ver foto 3 de ${images.length}`}
              >
                <Image
                  src={third.medium_url}
                  alt={`${title} — foto 3`}
                  fill
                  sizes="(max-width: 768px) 0vw, 40vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  placeholder="blur"
                  blurDataURL={BLUR_PLACEHOLDER}
                />

                {/* "Ver todas las fotos" overlay */}
                {hasMore && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                    <Expand className="h-6 w-6 text-white" aria-hidden />
                    <span className="text-white text-sm font-semibold">
                      +{rest.length + 1} fotos
                    </span>
                  </div>
                )}
              </button>
            )}
          </div>
        )}

        {/* "Ver todas" floating button (bottom-right of hero) */}
        {images.length > 3 && (
          <button
            onClick={() => setFullscreenIndex(0)}
            className={cn(
              "absolute bottom-4 right-4 z-10",
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg",
              "bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm",
              "text-sm font-medium text-slate-800 dark:text-slate-100",
              "shadow hover:bg-white dark:hover:bg-slate-800 transition-colors"
            )}
          >
            <Expand className="h-4 w-4" aria-hidden />
            Ver todas las fotos
          </button>
        )}
      </div>

      {/* ── Fullscreen modal ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {fullscreenIndex !== null && (
          <FullscreenModal
            images={images}
            startIndex={fullscreenIndex}
            title={title}
            onClose={() => setFullscreenIndex(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
