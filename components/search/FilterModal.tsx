"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const AMENITIES = [
  "Alberca",
  "Gym",
  "Seguridad 24h",
  "Jardín",
  "Terraza",
  "Elevador",
  "Bodega",
  "Vista al mar",
];

const PARKING_OPTIONS = [
  { value: "0", label: "0" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
];

const PROPERTY_TYPES = [
  { value: "house", label: "Casa" },
  { value: "apartment", label: "Departamento" },
  { value: "condo", label: "Condominio" },
  { value: "land", label: "Terreno" },
  { value: "commercial", label: "Comercial" },
];

const PRICE_PRESETS = [
  { label: "Hasta $1M", min: 0, max: 1_000_000 },
  { label: "$1M – $3M", min: 1_000_000, max: 3_000_000 },
  { label: "$3M – $6M", min: 3_000_000, max: 6_000_000 },
  { label: "$6M+", min: 6_000_000, max: undefined },
];

const BED_OPTIONS = [1, 2, 3, 4];
const BATH_OPTIONS = [1, 2, 3];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FilterModal({ open, onOpenChange }: Props) {
  const th = useTranslations("home");
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const searchBase = pathname.startsWith("/en") ? "/en/search" : "/search";

  // Basic filters (synced from URL on open)
  const [mode, setMode] = useState<"buy" | "rent">("buy");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [beds, setBeds] = useState("");
  const [baths, setBaths] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  // Advanced filters
  const [areaMin, setAreaMin] = useState("");
  const [areaMax, setAreaMax] = useState("");
  const [parking, setParking] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setMode((searchParams.get("mode") as "buy" | "rent") ?? "buy");
      const rawType = searchParams.get("type") ?? "";
      setSelectedTypes(rawType ? rawType.split(",").filter(Boolean) : []);
      setBeds(searchParams.get("beds") ?? "");
      setBaths(searchParams.get("baths") ?? "");
      setPriceMin(searchParams.get("priceMin") ?? "");
      setPriceMax(searchParams.get("priceMax") ?? "");
      setAreaMin(searchParams.get("areaMin") ?? "");
      setAreaMax(searchParams.get("areaMax") ?? "");
      setParking(searchParams.get("parking") ?? "");
      setYearFrom(searchParams.get("yearFrom") ?? "");
      setYearTo(searchParams.get("yearTo") ?? "");
      const raw = searchParams.get("amenities");
      setAmenities(raw ? raw.split(",") : []);
    }
  }, [open, searchParams]);

  function toggleAmenity(name: string) {
    setAmenities((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  }

  function toggleType(value: string) {
    setSelectedTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  function handleClear() {
    setMode("buy");
    setSelectedTypes([]);
    setBeds("");
    setBaths("");
    setPriceMin("");
    setPriceMax("");
    setAreaMin("");
    setAreaMax("");
    setParking("");
    setYearFrom("");
    setYearTo("");
    setAmenities([]);
  }

  function handleApply() {
    const params = new URLSearchParams(searchParams.toString());
    const set = (k: string, v: string) => (v ? params.set(k, v) : params.delete(k));

    params.set("mode", mode);
    set("type", selectedTypes.join(","));
    set("beds", beds);
    set("baths", baths);
    set("priceMin", priceMin);
    set("priceMax", priceMax);
    set("areaMin", areaMin);
    set("areaMax", areaMax);
    set("parking", parking);
    set("yearFrom", yearFrom);
    set("yearTo", yearTo);
    if (amenities.length > 0) {
      params.set("amenities", amenities.join(","));
    } else {
      params.delete("amenities");
    }
    params.delete("page");
    router.push(`${searchBase}?${params.toString()}`);
    onOpenChange(false);
  }

  const activePricePreset = PRICE_PRESETS.find(
    (p) => String(p.min || "") === priceMin && String(p.max ?? "") === priceMax
  );

  const footer = (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={handleClear}
        className="text-sm text-slate-500 dark:text-slate-400 hover:text-gold-600 dark:hover:text-gold-400 transition-colors"
      >
        Limpiar todo
      </button>
      <Button variant="primary" size="md" onClick={handleApply}>
        Aplicar Filtros
      </Button>
    </div>
  );

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Filtros"
      maxWidth="max-w-xl"
      footer={footer}
    >
      <div className="space-y-6">
        {/* Modo: Comprar / Rentar */}
        <section>
          <h3 className={sectionHeading}>Operación</h3>
          <div className="flex gap-2 mt-2">
            {(["buy", "rent"] as const).map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setMode(val)}
                className={cn(
                  "flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors",
                  mode === val
                    ? "border-gold-500 bg-gold-100 text-gold-700 dark:bg-gold-900/40 dark:text-gold-300 dark:border-gold-400"
                    : "border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-gold-400"
                )}
              >
                {val === "rent" ? th("searchRent") : th("searchBuy")}
              </button>
            ))}
          </div>
        </section>

        {/* Tipo de propiedad */}
        <section>
          <h3 className={sectionHeading}>Tipo de propiedad</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            {PROPERTY_TYPES.map((pt) => {
              const checked = selectedTypes.includes(pt.value);
              return (
                <button
                  key={pt.value}
                  type="button"
                  onClick={() => toggleType(pt.value)}
                  className={cn(
                    "py-2.5 px-3 rounded-lg text-sm font-medium border transition-colors text-left",
                    checked
                      ? "border-gold-500 bg-gold-100 text-gold-700 dark:bg-gold-900/40 dark:text-gold-300 dark:border-gold-400"
                      : "border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-gold-400"
                  )}
                >
                  {pt.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Recámaras y Baños */}
        <section>
          <h3 className={sectionHeading}>Recámaras</h3>
          <div className="flex gap-2 mt-2 flex-wrap">
            <button
              type="button"
              onClick={() => setBeds("")}
              className={cn(pillCls, !beds && pillActiveCls)}
            >
              Todas
            </button>
            {BED_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setBeds(beds === String(n) ? "" : String(n))}
                className={cn(pillCls, beds === String(n) && pillActiveCls)}
              >
                {n}+
              </button>
            ))}
          </div>

          <h3 className={cn(sectionHeading, "mt-4")}>Baños</h3>
          <div className="flex gap-2 mt-2 flex-wrap">
            <button
              type="button"
              onClick={() => setBaths("")}
              className={cn(pillCls, !baths && pillActiveCls)}
            >
              Todos
            </button>
            {BATH_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setBaths(baths === String(n) ? "" : String(n))}
                className={cn(pillCls, baths === String(n) && pillActiveCls)}
              >
                {n}+
              </button>
            ))}
          </div>
        </section>

        {/* Precio */}
        <section>
          <h3 className={sectionHeading}>Rango de precio</h3>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {PRICE_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  if (activePricePreset?.label === p.label) {
                    setPriceMin("");
                    setPriceMax("");
                  } else {
                    setPriceMin(p.min ? String(p.min) : "");
                    setPriceMax(p.max ? String(p.max) : "");
                  }
                }}
                className={cn(
                  "py-2.5 px-3 rounded-lg text-sm font-medium border transition-colors text-left",
                  activePricePreset?.label === p.label
                    ? "border-gold-500 bg-gold-100 text-gold-700 dark:bg-gold-900/40 dark:text-gold-300 dark:border-gold-400"
                    : "border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-gold-400"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-3 mb-2">
            Personalizado (MXN)
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Mín"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className={inputCls}
            />
            <input
              type="number"
              placeholder="Máx"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className={inputCls}
            />
          </div>
        </section>

        {/* Superficie */}
        <section>
          <h3 className={sectionHeading}>Superficie m²</h3>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 mt-2">
            <div className="flex-1">
              <label className={labelCls}>Mínimo</label>
              <input
                type="number"
                value={areaMin}
                onChange={(e) => setAreaMin(e.target.value)}
                placeholder="Ej. 50"
                className={inputCls}
              />
            </div>
            <div className="flex-1">
              <label className={labelCls}>Máximo</label>
              <input
                type="number"
                value={areaMax}
                onChange={(e) => setAreaMax(e.target.value)}
                placeholder="Ej. 500"
                className={inputCls}
              />
            </div>
          </div>
        </section>

        {/* Estacionamientos */}
        <section>
          <h3 className={sectionHeading}>Estacionamientos</h3>
          <div className="flex gap-2 mt-2">
            {PARKING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  setParking(parking === opt.value ? "" : opt.value)
                }
                className={cn(
                  "flex-1 py-3 rounded-lg text-sm font-medium border transition-colors",
                  parking === opt.value
                    ? "border-gold-500 bg-gold-100 text-gold-700 dark:bg-gold-900/40 dark:text-gold-300 dark:border-gold-400"
                    : "border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-gold-400"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Año de construcción */}
        <section>
          <h3 className={sectionHeading}>Año de Construcción</h3>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 mt-2">
            <div className="flex-1">
              <label className={labelCls}>Desde</label>
              <input
                type="number"
                value={yearFrom}
                onChange={(e) => setYearFrom(e.target.value)}
                placeholder="Ej. 2000"
                min={1900}
                max={new Date().getFullYear()}
                className={inputCls}
              />
            </div>
            <div className="flex-1">
              <label className={labelCls}>Hasta</label>
              <input
                type="number"
                value={yearTo}
                onChange={(e) => setYearTo(e.target.value)}
                placeholder={String(new Date().getFullYear())}
                min={1900}
                max={new Date().getFullYear()}
                className={inputCls}
              />
            </div>
          </div>
        </section>

        {/* Amenidades */}
        <section>
          <h3 className={sectionHeading}>Amenidades</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            {AMENITIES.map((name) => {
              const checked = amenities.includes(name);
              return (
                <label
                  key={name}
                  className={cn(
                    "flex items-center gap-2 p-3.5 min-h-[44px] rounded-lg border text-sm cursor-pointer transition-colors select-none",
                    checked
                      ? "border-gold-500 bg-gold-50 text-gold-700 dark:bg-gold-900/30 dark:text-gold-300 dark:border-gold-400"
                      : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-gold-300"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAmenity(name)}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      "h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center transition-colors",
                      checked
                        ? "border-gold-500 bg-gold-500 dark:border-gold-400 dark:bg-gold-400"
                        : "border-slate-300 dark:border-slate-500"
                    )}
                    aria-hidden
                  >
                    {checked && (
                      <svg
                        viewBox="0 0 12 10"
                        className="h-2.5 w-2.5 text-white"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="1 5 4 9 11 1" />
                      </svg>
                    )}
                  </span>
                  {name}
                </label>
              );
            })}
          </div>
        </section>
      </div>
    </Modal>
  );
}

const sectionHeading =
  "text-sm font-semibold text-slate-800 dark:text-slate-200";

const labelCls =
  "block text-xs text-slate-500 dark:text-slate-400 mb-1";

const inputCls = cn(
  "w-full h-11 px-3 rounded-lg text-sm border border-slate-200 dark:border-slate-600",
  "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400",
  "focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
);

const pillCls = cn(
  "px-3 py-1.5 rounded-lg text-sm border border-slate-200 dark:border-slate-600 transition-colors",
  "text-slate-700 dark:text-slate-300 hover:border-gold-400"
);

const pillActiveCls =
  "border-gold-500 bg-gold-100 text-gold-700 dark:bg-gold-900/40 dark:text-gold-300 dark:border-gold-400 font-medium";
