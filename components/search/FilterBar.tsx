"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { FilterModal } from "./FilterModal";
import { cn } from "@/lib/utils";
import type { LocationSuggestion } from "@/lib/mexico-locations";

// ─── Constants ────────────────────────────────────────────────────────────────

const PRICE_PRESETS = [
  { label: "Hasta $1M", min: 0, max: 1_000_000 },
  { label: "$1M – $3M", min: 1_000_000, max: 3_000_000 },
  { label: "$3M – $6M", min: 3_000_000, max: 6_000_000 },
  { label: "$6M+", min: 6_000_000, max: undefined },
];

const PROPERTY_TYPES = [
  { value: "house", label: "Casa" },
  { value: "apartment", label: "Departamento" },
  { value: "condo", label: "Condominio" },
  { value: "land", label: "Terreno" },
  { value: "commercial", label: "Comercial" },
];


const BED_OPTIONS = [1, 2, 3, 4];
const BATH_OPTIONS = [1, 2, 3];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMXN(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const normalize = (s: string) =>
    s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const nText = normalize(text);
  const nQuery = normalize(query);
  const idx = nText.indexOf(nQuery);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <strong className="font-semibold text-slate-900 dark:text-white">
        {text.slice(idx, idx + nQuery.length)}
      </strong>
      {text.slice(idx + nQuery.length)}
    </>
  );
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, cb]);
}

// ─── LocationSearchInput ──────────────────────────────────────────────────────

function LocationSearchInput({
  value,
  onChange,
  onSelect,
  onClear,
  placeholder,
  inputClassName,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (s: LocationSuggestion) => void;
  onClear: () => void;
  placeholder: string;
  inputClassName?: string;
}) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hasUserTyped = useRef(false);

  useClickOutside(wrapperRef, () => setShowSuggestions(false));

  useEffect(() => {
    if (!hasUserTyped.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search-suggestions?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        const locs: LocationSuggestion[] = data.locations ?? [];
        setSuggestions(locs);
        setShowSuggestions(locs.length > 0);
        setActiveIndex(-1);
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const s = suggestions[activeIndex];
      onChange(s.display);
      setShowSuggestions(false);
      onSelect(s);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" aria-hidden />
      <input
        type="text"
        value={value}
        onChange={(e) => { hasUserTyped.current = true; onChange(e.target.value); }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          "pl-8 pr-7 border transition-colors",
          "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800",
          "text-slate-700 dark:text-slate-300 placeholder:text-slate-400",
          "focus:outline-none focus:border-gold-400 dark:focus:border-gold-500",
          inputClassName
        )}
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          aria-label="Limpiar búsqueda"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute top-full left-0 right-0 mt-1.5 z-[9999]",
              "bg-white dark:bg-slate-800 rounded-xl shadow-xl",
              "border border-slate-200 dark:border-slate-700 overflow-hidden"
            )}
            style={{ minWidth: "260px" }}
          >
            {suggestions.map((s, i) => (
              <button
                key={`${s.type}-${s.display}`}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(s.display);
                  setShowSuggestions(false);
                  onSelect(s);
                }}
                onMouseEnter={() => setActiveIndex(i)}
                className={cn(
                  "flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-left",
                  "text-slate-700 dark:text-slate-300 transition-colors",
                  i === activeIndex
                    ? "bg-gold-50 dark:bg-slate-700"
                    : "hover:bg-gold-50 dark:hover:bg-slate-700"
                )}
              >
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden />
                <span className="flex-1 truncate">
                  {highlightMatch(s.display, value)}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Dropdown wrapper ─────────────────────────────────────────────────────────

function FilterDropdown({
  label,
  active,
  autoClose = true,
  children,
}: {
  label: string;
  active: boolean;
  autoClose?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  useClickOutside(ref, () => setOpen(false));

  useEffect(() => {
    if (autoClose) setOpen(false);
  }, [searchParams, autoClose]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-colors whitespace-nowrap",
          active
            ? "border-gold-500 bg-gold-50 text-gold-700 dark:bg-gold-950/40 dark:text-gold-300 dark:border-gold-400"
            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
        )}
      >
        {label}
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")}
          aria-hidden
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute top-full left-0 mt-2 z-[9999] min-w-[220px]",
              "bg-white dark:bg-slate-800 rounded-xl shadow-xl",
              "border border-slate-200 dark:border-slate-700 p-3"
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Active chip ──────────────────────────────────────────────────────────────

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium",
        "bg-gold-100 text-gold-800 dark:bg-gold-900/40 dark:text-gold-300"
      )}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 hover:text-gold-900 dark:hover:text-gold-100 transition-colors"
        aria-label={`Quitar filtro: ${label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

// ─── FilterBar ────────────────────────────────────────────────────────────────

export function FilterBar() {
  const th = useTranslations("home");
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const searchBase = pathname.startsWith("/en") ? "/en/search" : "/search";
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  // URL params
  const cityParam = searchParams.get("city") ?? "";
  const neighborhoodParam = searchParams.get("neighborhood") ?? "";
  const mode = searchParams.get("mode") ?? "";
  const priceMin = searchParams.get("priceMin") ?? "";
  const priceMax = searchParams.get("priceMax") ?? "";
  const type = searchParams.get("type") ?? "";
  const selectedTypes = type ? type.split(",").filter(Boolean) : [];
  const beds = searchParams.get("beds") ?? "";
  const baths = searchParams.get("baths") ?? "";

  // Show "Colonia, Ciudad" when both are present
  const locationDisplay = neighborhoodParam
    ? `${neighborhoodParam}, ${cityParam}`.replace(/, $/, "")
    : cityParam;

  // Local state
  const [cityInput, setCityInput] = useState(locationDisplay);
  const [customMin, setCustomMin] = useState(priceMin);
  const [customMax, setCustomMax] = useState(priceMax);

  useEffect(() => {
    const display = neighborhoodParam
      ? `${neighborhoodParam}, ${cityParam}`.replace(/, $/, "")
      : cityParam;
    setCityInput(display);
  }, [cityParam, neighborhoodParam]);

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${searchBase}?${params.toString()}`);
  }

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    params.delete("page");
    router.push(`${searchBase}?${params.toString()}`);
  }

  function handleLocationSelect(s: LocationSuggestion) {
    if (s.type === "colonia" && s.colonia) {
      updateParams({ neighborhood: s.colonia, city: null, state: null });
    } else if (s.type === "estado") {
      updateParams({ state: s.estado, city: null, neighborhood: null });
    } else {
      updateParams({ city: s.municipio, neighborhood: null, state: null });
    }
  }

  function submitCity(value: string) {
    updateParams({ city: value.trim() || null, neighborhood: null, state: null });
  }

  function clearLocation() {
    setCityInput("");
    updateParams({ city: null, neighborhood: null, state: null });
  }

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString());
    ["priceMin", "priceMax", "type", "beds", "baths", "areaMin", "areaMax",
      "parking", "yearFrom", "yearTo", "amenities", "city", "neighborhood", "state", "zip"].forEach((k) => params.delete(k));
    params.delete("page");
    router.push(`${searchBase}?${params.toString()}`);
    setCustomMin("");
    setCustomMax("");
    setCityInput("");
  }

  const activePricePreset = PRICE_PRESETS.find(
    (p) => String(p.min || "") === priceMin && String(p.max ?? "") === priceMax
  );

  const hasPrice = !!(priceMin || priceMax);
  const hasType = !!type;
  const hasBeds = !!(beds || baths);
  const hasModal = !!(
    searchParams.get("areaMin") || searchParams.get("areaMax") ||
    searchParams.get("parking") || searchParams.get("yearFrom") ||
    searchParams.get("yearTo") || searchParams.get("amenities")
  );
  const hasAny = hasPrice || hasType || hasBeds || hasModal || !!cityParam || !!neighborhoodParam || !!searchParams.get("state");

  // Build chips for active filter summary row
  const chips: { label: string; keys: string[] }[] = [];
  if (hasPrice) {
    let label = "";
    if (activePricePreset) {
      label = activePricePreset.label;
    } else {
      const minLabel = priceMin ? formatMXN(Number(priceMin)) : "";
      const maxLabel = priceMax ? formatMXN(Number(priceMax)) : "";
      label = minLabel && maxLabel
        ? `${minLabel} – ${maxLabel}`
        : minLabel ? `Desde ${minLabel}` : `Hasta ${maxLabel}`;
    }
    chips.push({ label, keys: ["priceMin", "priceMax"] });
  }
  if (hasType) {
    const typeLabels = selectedTypes
      .map((v) => PROPERTY_TYPES.find((pt) => pt.value === v)?.label ?? v)
      .join(", ");
    chips.push({ label: typeLabels, keys: ["type"] });
  }
  if (beds) chips.push({ label: `${beds}+ rec.`, keys: ["beds"] });
  if (baths) chips.push({ label: `${baths}+ baños`, keys: ["baths"] });
  if (searchParams.get("amenities")) {
    const count = searchParams.get("amenities")!.split(",").length;
    chips.push({ label: `${count} amenidad${count > 1 ? "es" : ""}`, keys: ["amenities"] });
  }
  if (searchParams.get("parking")) {
    chips.push({ label: `${searchParams.get("parking")}+ estac.`, keys: ["parking"] });
  }
  if (searchParams.get("areaMin") || searchParams.get("areaMax")) {
    const mn = searchParams.get("areaMin") ?? "";
    const mx = searchParams.get("areaMax") ?? "";
    chips.push({
      label: mn && mx ? `${mn}–${mx} m²` : mn ? `Desde ${mn} m²` : `Hasta ${mx} m²`,
      keys: ["areaMin", "areaMax"],
    });
  }
  if (searchParams.get("yearFrom") || searchParams.get("yearTo")) {
    chips.push({ label: "Año construc.", keys: ["yearFrom", "yearTo"] });
  }

  const activeCount = chips.length;
  const modeLabel = mode === "rent" ? th("searchRent") : mode === "buy" ? th("searchBuy") : "Buy / Rent";

  return (
    <>
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="px-4 sm:px-6 py-3">

          {/* ── Mobile: search + filter trigger ─────────────────────────── */}
          <div className="flex flex-col gap-2 sm:hidden">
            {/* Location search with suggestions */}
            <LocationSearchInput
              value={cityInput}
              onChange={setCityInput}
              onSelect={handleLocationSelect}
              onClear={clearLocation}
              placeholder="Colonia, municipio o estado…"
              inputClassName="w-full h-10 rounded-full text-sm"
            />

            {/* Filters button + chips row */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterModalOpen(true)}
                className={cn(
                  "flex items-center gap-2 h-10 px-4 rounded-full border text-sm font-medium transition-colors shrink-0",
                  activeCount > 0
                    ? "border-gold-500 bg-gold-50 text-gold-700 dark:bg-gold-950/40 dark:text-gold-300 dark:border-gold-400"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                )}
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden />
                Filtros
                {activeCount > 0 && (
                  <span className="ml-1 h-5 w-5 rounded-full bg-gold-500 text-white text-xs flex items-center justify-center">
                    {activeCount}
                  </span>
                )}
              </button>
              {chips.length > 0 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-none">
                  {chips.map((chip) => (
                    <Chip
                      key={chip.keys.join(",")}
                      label={chip.label}
                      onRemove={() => {
                        const updates: Record<string, null> = {};
                        chip.keys.forEach((k) => (updates[k] = null));
                        updateParams(updates as Record<string, string | null>);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Desktop: unified filter strip ───────────────────────────── */}
          <div className="hidden sm:flex items-center gap-2 flex-wrap">

            {/* Location search with suggestions */}
            <LocationSearchInput
              value={cityInput}
              onChange={(v) => {
                setCityInput(v);
                // If user clears the field manually, submit empty
                if (!v.trim()) submitCity("");
              }}
              onSelect={handleLocationSelect}
              onClear={clearLocation}
              placeholder="Colonia, municipio o estado…"
              inputClassName="h-9 w-56 rounded-full text-sm"
            />

            {/* Buy / Rent mode */}
            <FilterDropdown label={modeLabel} active={mode === "buy" || mode === "rent"}>
              {([["", "All"], ["buy", th("searchBuy")], ["rent", th("searchRent")]] as const).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => updateParam("mode", val)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    mode === val
                      ? "bg-gold-50 text-gold-700 dark:bg-gold-950/40 dark:text-gold-300 font-medium"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  )}
                >
                  {label}
                </button>
              ))}
            </FilterDropdown>

            {/* Property type */}
            <FilterDropdown label="Property" active={hasType} autoClose={false}>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 px-1">Tipo</p>
              <div className="space-y-1">
                {PROPERTY_TYPES.map((pt) => {
                  const checked = selectedTypes.includes(pt.value);
                  return (
                    <label
                      key={pt.value}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors select-none",
                        checked
                          ? "bg-gold-50 text-gold-700 dark:bg-gold-900/40 dark:text-gold-300"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const next = checked
                            ? selectedTypes.filter((v) => v !== pt.value)
                            : [...selectedTypes, pt.value];
                          updateParam("type", next.length ? next.join(",") : null);
                        }}
                        className="accent-gold-500 h-4 w-4 rounded"
                      />
                      {pt.label}
                    </label>
                  );
                })}
              </div>
              {selectedTypes.length > 0 && (
                <button
                  type="button"
                  onClick={() => updateParam("type", null)}
                  className="mt-2 w-full text-xs text-slate-400 hover:text-gold-600 dark:hover:text-gold-400 text-center transition-colors"
                >
                  Limpiar
                </button>
              )}
            </FilterDropdown>

            {/* Bedrooms & Baths */}
            <FilterDropdown label="Bedrooms" active={hasBeds}>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 px-1">
                Recámaras
              </p>
              <div className="flex gap-1.5 mb-3">
                <button
                  type="button"
                  onClick={() => updateParam("beds", null)}
                  className={cn(pillCls, !beds && pillActiveCls)}
                >
                  Todas
                </button>
                {BED_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => updateParam("beds", String(n))}
                    className={cn(pillCls, beds === String(n) && pillActiveCls)}
                  >
                    {n}+
                  </button>
                ))}
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 px-1">
                Baños
              </p>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => updateParam("baths", null)}
                  className={cn(pillCls, !baths && pillActiveCls)}
                >
                  Todos
                </button>
                {BATH_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => updateParam("baths", String(n))}
                    className={cn(pillCls, baths === String(n) && pillActiveCls)}
                  >
                    {n}+
                  </button>
                ))}
              </div>
            </FilterDropdown>

            {/* Price */}
            <FilterDropdown label="Price" active={hasPrice}>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 px-1">
                Rango de precio
              </p>
              <div className="space-y-1 mb-3">
                {PRICE_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setCustomMin("");
                      setCustomMax("");
                      updateParams({
                        priceMin: p.min ? String(p.min) : null,
                        priceMax: p.max ? String(p.max) : null,
                      });
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      activePricePreset?.label === p.label
                        ? "bg-gold-100 text-gold-700 dark:bg-gold-900/40 dark:text-gold-300 font-medium"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 px-1">
                Personalizado (MXN)
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Mín"
                  value={customMin}
                  onChange={(e) => setCustomMin(e.target.value)}
                  onBlur={() => updateParam("priceMin", customMin || null)}
                  className={inputCls}
                />
                <input
                  type="number"
                  placeholder="Máx"
                  value={customMax}
                  onChange={(e) => setCustomMax(e.target.value)}
                  onBlur={() => updateParam("priceMax", customMax || null)}
                  className={inputCls}
                />
              </div>
            </FilterDropdown>

            {/* More filters */}
            <button
              type="button"
              onClick={() => setFilterModalOpen(true)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-colors whitespace-nowrap",
                hasModal
                  ? "border-gold-500 bg-gold-50 text-gold-700 dark:bg-gold-950/40 dark:text-gold-300 dark:border-gold-400"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
              More filters
            </button>

            {hasAny && (
              <button
                type="button"
                onClick={clearAll}
                className="ml-auto text-sm text-slate-500 dark:text-slate-400 hover:text-gold-600 dark:hover:text-gold-400 whitespace-nowrap transition-colors shrink-0"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {/* Active chips row — desktop */}
          {chips.length > 0 && (
            <div className="hidden sm:flex flex-wrap gap-2 mt-2.5">
              {chips.map((chip) => (
                <Chip
                  key={chip.keys.join(",")}
                  label={chip.label}
                  onRemove={() => {
                    const updates: Record<string, null> = {};
                    chip.keys.forEach((k) => (updates[k] = null));
                    updateParams(updates as Record<string, string | null>);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <FilterModal open={filterModalOpen} onOpenChange={setFilterModalOpen} />
    </>
  );
}

const inputCls = cn(
  "w-full h-8 px-2 rounded-lg text-sm border border-slate-200 dark:border-slate-600",
  "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400",
  "focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
);

const pillCls = cn(
  "px-3 py-1.5 rounded-lg text-sm border border-slate-200 dark:border-slate-600 transition-colors",
  "text-slate-700 dark:text-slate-300 hover:border-gold-400"
);

const pillActiveCls =
  "border-gold-500 bg-gold-100 text-gold-700 dark:bg-gold-900/40 dark:text-gold-300 dark:border-gold-400 font-medium";
