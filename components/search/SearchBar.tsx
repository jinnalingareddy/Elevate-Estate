"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LocationSuggestion } from "@/lib/mexico-locations";

const PROPERTY_TYPES_KEYS = [
  { value: "", labelKey: "allTypes" },
  { value: "house", label: "Casa" },
  { value: "apartment", label: "Departamento" },
  { value: "condo", label: "Condominio" },
  { value: "land", label: "Terreno" },
  { value: "commercial", label: "Comercial" },
] as const;


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

export function SearchBar({ hideTabs = false, tagsOnly = false }: { hideTabs?: boolean; tagsOnly?: boolean } = {}) {
  const t = useTranslations("search");
  const th = useTranslations("home");
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const searchBase = pathname.startsWith("/en") ? "/en/search" : "/search";

  const TABS = [
    { id: "buy" as const, label: th("searchBuy") },
    { id: "rent" as const, label: th("searchRent") },
  ];

  const [mode, setMode] = useState<"buy" | "rent">(
    searchParams.get("mode") === "rent" ? "rent" : "buy"
  );

  // Initialize display value from URL — show "neighborhood, city" if both present
  const initialCity = searchParams.get("neighborhood")
    ? `${searchParams.get("neighborhood")}, ${searchParams.get("city") ?? ""}`.trim().replace(/,\s*$/, "")
    : (searchParams.get("city") ?? "");

  const [inputValue, setInputValue] = useState(initialCity);
  const [selected, setSelected] = useState<LocationSuggestion | null>(null);
  const [type, setType] = useState(searchParams.get("type") ?? "");
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasUserTyped = useRef(false);

  useEffect(() => {
    if (!hasUserTyped.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (inputValue.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search-suggestions?q=${encodeURIComponent(inputValue)}`
        );
        const data = await res.json();
        const locs: LocationSuggestion[] = data.locations ?? [];
        setSuggestions(locs);
        setShowSuggestions(locs.length > 0);
        setActiveIndex(-1);
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        !inputRef.current?.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function buildParams(s: LocationSuggestion) {
    const params = new URLSearchParams();
    params.set("mode", mode);
    if (s.type === "colonia" && s.colonia) {
      params.set("neighborhood", s.colonia);
    } else if (s.type === "estado") {
      params.set("state", s.estado);
    } else {
      params.set("city", s.municipio);
    }
    if (type) params.set("type", type);
    return params;
  }

  function selectSuggestion(s: LocationSuggestion) {
    setSelected(s);
    setInputValue(s.display);
    setShowSuggestions(false);
    setActiveIndex(-1);
    router.push(`${searchBase}?${buildParams(s).toString()}`);
  }

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
      selectSuggestion(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected) {
      router.push(`${searchBase}?${buildParams(selected).toString()}`);
      return;
    }
    const params = new URLSearchParams();
    params.set("mode", mode);
    if (inputValue.trim()) params.set("city", inputValue.trim());
    if (type) params.set("type", type);
    router.push(`${searchBase}?${params.toString()}`);
  }

  const tabsRow = (
    <div className="flex">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => {
            setMode(tab.id);
            const params = new URLSearchParams(searchParams.toString());
            params.set("mode", tab.id);
            router.push(`${searchBase}?${params.toString()}`);
          }}
          className={cn(
            "px-4 py-1.5 text-sm font-medium rounded-full border transition-colors",
            mode === tab.id
              ? "border-gold-500 bg-gold-50 text-gold-700 dark:bg-gold-950/40 dark:text-gold-300 dark:border-gold-400"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  if (tagsOnly) return tabsRow;

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Mode tabs — only when not hidden */}
      {!hideTabs && (
        <div className="flex border-b border-slate-200 dark:border-slate-700 mb-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setMode(tab.id);
                const params = new URLSearchParams(searchParams.toString());
                params.set("mode", tab.id);
                router.push(`${searchBase}?${params.toString()}`);
              }}
              className={cn(
                "px-6 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
                mode === tab.id
                  ? "border-gold-500 text-gold-600 dark:text-gold-400 font-semibold"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Input row wrapper — relative so dropdown can escape overflow-hidden */}
      <div className="relative">
      <div className={cn(
        "flex items-stretch border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl overflow-hidden",
        !hideTabs && "border-t-0 rounded-t-none"
      )}>
        {/* Inline mode toggle — shown only when tabs row is hidden */}
        {hideTabs && (
          <div className="flex items-center shrink-0 border-r border-slate-200 dark:border-slate-700 px-2 gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setMode(tab.id);
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("mode", tab.id);
                  router.push(`${searchBase}?${params.toString()}`);
                }}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-full transition-colors",
                  mode === tab.id
                    ? "bg-gold-500 text-white"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Property type select */}
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className={cn(
            "h-10 pl-2 pr-6 sm:pl-4 sm:pr-8 text-xs sm:text-sm shrink-0 border-r border-slate-200 dark:border-slate-700",
            "bg-transparent text-slate-700 dark:text-slate-300",
            "focus:outline-none cursor-pointer max-w-[90px] sm:max-w-none"
          )}
        >
          {PROPERTY_TYPES_KEYS.map((pt) => (
            <option key={pt.value} value={pt.value}>
              {"labelKey" in pt ? t(pt.labelKey) : pt.label}
            </option>
          ))}
        </select>

        {/* Location input */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            hasUserTyped.current = true;
            setInputValue(e.target.value);
            setSelected(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder={t("placeholder")}
          className={cn(
            "flex-1 h-10 px-4 text-sm",
            "bg-transparent text-slate-900 dark:text-slate-100",
            "placeholder:text-slate-400",
            "focus:outline-none"
          )}
        />
        {inputValue && (
          <button
            type="button"
            onClick={() => {
              setInputValue("");
              setSelected(null);
              setSuggestions([]);
              setShowSuggestions(false);
            }}
            className="self-center pr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Gold search button */}
        <button
          type="submit"
          className="h-10 w-10 shrink-0 bg-gold-500 hover:bg-gold-600 flex items-center justify-center transition-colors"
          aria-label={th("searchButton")}
        >
          <Search className="h-4 w-4 text-white" aria-hidden />
        </button>

      </div>

        {/* Suggestions dropdown — outside overflow-hidden so it isn't clipped */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "absolute top-full left-0 right-0 mt-1.5 z-[60]",
                "bg-white dark:bg-slate-800 rounded-xl shadow-xl",
                "border border-slate-200 dark:border-slate-700 overflow-hidden"
              )}
            >
              {suggestions.map((s, i) => (
                <button
                  key={`${s.type}-${s.display}`}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectSuggestion(s);
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
                    {highlightMatch(s.display, inputValue)}
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}
