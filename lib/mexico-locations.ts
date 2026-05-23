export interface LocationSuggestion {
  display: string;
  colonia: string | null;
  municipio: string;
  estado: string;
  type: "colonia" | "municipio" | "ciudad" | "estado";
  cp?: string;
}

interface RawEntry {
  colonia: string;
  municipio: string;
  estado: string;
  tipo: string;
}

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

let _cache: RawEntry[] | null = null;

function getDataset(): RawEntry[] {
  if (_cache) return _cache;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  _cache = require("@/data/mexico-locations.json") as RawEntry[];
  return _cache;
}

export function searchLocations(query: string, limit = 8): LocationSuggestion[] {
  if (!query || query.length < 2) return [];

  const q = normalize(query);
  const dataset = getDataset();
  const results: LocationSuggestion[] = [];
  const seen = new Set<string>();

  // 1. Match on colonia
  for (const entry of dataset) {
    if (results.length >= limit) break;
    if (normalize(entry.colonia).includes(q)) {
      const key = `c:${entry.colonia}:${entry.municipio}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          display: `${entry.colonia}, ${entry.municipio}, ${entry.estado}`,
          colonia: entry.colonia,
          municipio: entry.municipio,
          estado: entry.estado,
          type: "colonia",
        });
      }
    }
  }

  // 2. Match on municipio (deduplicated)
  if (results.length < limit) {
    const seen2 = new Set<string>();
    for (const entry of dataset) {
      if (results.length >= limit) break;
      if (normalize(entry.municipio).includes(q)) {
        const key = `m:${entry.municipio}:${entry.estado}`;
        if (!seen2.has(key)) {
          seen2.add(key);
          results.push({
            display: `${entry.municipio}, ${entry.estado}`,
            colonia: null,
            municipio: entry.municipio,
            estado: entry.estado,
            type: "municipio",
          });
        }
      }
    }
  }

  // 3. Match on estado
  if (results.length < limit) {
    const seen3 = new Set<string>();
    for (const entry of dataset) {
      if (results.length >= limit) break;
      if (normalize(entry.estado).includes(q)) {
        const key = `e:${entry.estado}`;
        if (!seen3.has(key)) {
          seen3.add(key);
          results.push({
            display: entry.estado,
            colonia: null,
            municipio: "",
            estado: entry.estado,
            type: "estado",
          });
        }
      }
    }
  }

  return results;
}
