import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAnonClient } from "@/lib/supabase/server";
import { searchLocations, type LocationSuggestion } from "@/lib/mexico-locations";

// In-memory cache keyed by normalized query string; entries expire after 60 s.
// Bounded to 500 entries to prevent unbounded growth within a function instance.
const _cache = new Map<string, { locations: LocationSuggestion[]; expires: number }>();
const CACHE_TTL_MS = 60_000;
const CACHE_MAX = 500;

function cacheGet(key: string): LocationSuggestion[] | null {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) { _cache.delete(key); return null; }
  return entry.locations;
}

function cacheSet(key: string, locations: LocationSuggestion[]): void {
  if (_cache.size >= CACHE_MAX) {
    _cache.delete(_cache.keys().next().value as string);
  }
  _cache.set(key, { locations, expires: Date.now() + CACHE_TTL_MS });
}

interface PostalCodeEntry {
  municipio: string;
  estado: string;
  ciudad: string;
  colonias: string[];
}

interface ColoniaIndex {
  colonia: string;
  municipio: string;
  estado: string;
  cp: string;
  normalized: string;
}

let _postalCache: Record<string, PostalCodeEntry> | null = null;
let _coloniaIndex: ColoniaIndex[] | null = null;

function getPostalDataset(): Record<string, PostalCodeEntry> {
  if (_postalCache) return _postalCache;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  _postalCache = require("@/data/mexico-postal-codes.json") as Record<string, PostalCodeEntry>;
  return _postalCache;
}

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function getColoniaIndex(): ColoniaIndex[] {
  if (_coloniaIndex) return _coloniaIndex;
  const dataset = getPostalDataset();
  const index: ColoniaIndex[] = [];
  for (const [cp, entry] of Object.entries(dataset)) {
    for (const colonia of entry.colonias) {
      index.push({
        colonia,
        municipio: entry.municipio,
        estado: entry.estado,
        cp,
        normalized: normalize(colonia),
      });
    }
  }
  _coloniaIndex = index;
  return index;
}

function searchPostalColonias(query: string, limit: number): LocationSuggestion[] {
  const q = normalize(query);
  const index = getColoniaIndex();
  const results: LocationSuggestion[] = [];
  const seen = new Set<string>();

  for (const entry of index) {
    if (results.length >= limit) break;
    if (entry.normalized.includes(q)) {
      const key = `${entry.colonia}|${entry.municipio}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          display: `${entry.colonia}, ${entry.municipio}, ${entry.estado}`,
          colonia: entry.colonia,
          municipio: entry.municipio,
          estado: entry.estado,
          type: "colonia",
          cp: entry.cp,
        });
      }
    }
  }
  return results;
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  if (q.length < 2) return NextResponse.json({ locations: [] });

  const cacheKey = q.toLowerCase();
  const hit = cacheGet(cacheKey);
  if (hit) {
    const res = NextResponse.json({ locations: hit });
    res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return res;
  }

  // 1. Exact 5-digit CP lookup
  const cpLocations: LocationSuggestion[] = [];
  if (/^\d{5}$/.test(q)) {
    const dataset = getPostalDataset();
    const entry = dataset[q];
    if (entry) {
      cpLocations.push({
        display: `CP ${q} — ${entry.municipio}, ${entry.estado}`,
        colonia: null,
        municipio: entry.municipio,
        estado: entry.estado,
        type: "municipio",
        cp: q,
      });
    }
  }

  // 2. Search mexico-locations.json (municipios/estados) + postal colonias
  const locationResults = searchLocations(q, 4);
  const coloniaResults = searchPostalColonias(q, 4);

  // Merge: colonias first, then municipios/estados, deduplicated
  const seen = new Set<string>();
  const merged: LocationSuggestion[] = [];

  for (const s of [...cpLocations, ...coloniaResults, ...locationResults]) {
    const key = s.display.toLowerCase();
    if (!seen.has(key) && merged.length < 8) {
      seen.add(key);
      merged.push(s);
    }
  }

  // 3. Supplement with DB cities if still under 8
  if (merged.length < 8) {
    const supabase = getSupabaseAnonClient();
    const { data } = await supabase
      .from("listings")
      .select("city")
      .eq("status", "active")
      .ilike("city", `%${q}%`)
      .limit(20);

    const existingKeys = new Set(merged.map((l) => l.display.toLowerCase()));
    for (const r of (data ?? []) as { city: string }[]) {
      if (merged.length >= 8) break;
      const cityLower = r.city.toLowerCase();
      if (!existingKeys.has(cityLower)) {
        existingKeys.add(cityLower);
        merged.push({
          display: r.city,
          colonia: null,
          municipio: r.city,
          estado: r.city,
          type: "ciudad",
        });
      }
    }
  }

  cacheSet(cacheKey, merged);
  const res = NextResponse.json({ locations: merged });
  res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  return res;
}
