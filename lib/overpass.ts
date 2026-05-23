import { unstable_cache } from "next/cache";

export interface NeighborhoodItem {
  category: "food" | "transit" | "education" | "shops";
  name: string;
  distance: string;
  count: string;
  places: string[];
}


interface OverpassElement {
  type: string;
  id: number;
  lat: number;
  lng: number;
  tags?: Record<string, string>;
}

type Category = "food" | "transit" | "education" | "shops";


const FALLBACK_DATA: NeighborhoodItem[] = [
  { category: "food",      name: "Restaurantes", distance: "~500 m", count: "+5 lugares",  places: [] },
  { category: "transit",   name: "Transporte",   distance: "~600 m", count: "1 parada",    places: [] },
  { category: "education", name: "Escuelas",     distance: "~800 m", count: "+2 colegios", places: [] },
  { category: "shops",     name: "Comercios",    distance: "~400 m", count: "+3 tiendas",  places: [] },
];

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function classifyElement(tags: Record<string, string>): Category | null {
  const amenity = tags["amenity"] ?? "";
  const railway = tags["railway"] ?? "";
  if (/restaurant|cafe|bar|food_court|fast_food|bakery/.test(amenity)) return "food";
  if (/school|university|college|kindergarten/.test(amenity)) return "education";
  if (
    tags["public_transport"] ||
    tags["highway"] === "bus_stop" ||
    /station|subway_entrance|tram_stop|halt/.test(railway)
  )
    return "transit";
  if (tags["shop"]) return "shops";
  return null;
}

// Cached function returns only plain serializable data — no React components
const fetchNeighborhoodItem = unstable_cache(
  async (lat: number, lng: number, radius = 1500): Promise<NeighborhoodItem[]> => {
    const query = `[out:json][timeout:8];
(
  node["amenity"~"restaurant|cafe|bar|food_court|fast_food|bakery"](around:${radius},${lat},${lng});
  node["public_transport"](around:${radius},${lat},${lng});
  node["highway"="bus_stop"](around:${radius},${lat},${lng});
  node["railway"~"station|subway_entrance|tram_stop|halt"](around:${radius},${lat},${lng});
  node["amenity"~"school|university|college|kindergarten"](around:${radius},${lat},${lng});
  node["shop"](around:${radius},${lat},${lng});
);
out body;`;

    // Throw on failure so unstable_cache does NOT store the error result.
    // The public wrapper catches and applies FALLBACK_DATA instead.
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
    const data = await res.json() as { elements: OverpassElement[] };
    const elements: OverpassElement[] = data?.elements ?? [];

    type Bucket = { count: number; closestM: number; places: string[] };
    const buckets: Record<Category, Bucket> = {
      food:      { count: 0, closestM: Infinity, places: [] },
      transit:   { count: 0, closestM: Infinity, places: [] },
      education: { count: 0, closestM: Infinity, places: [] },
      shops:     { count: 0, closestM: Infinity, places: [] },
    };

    for (const el of elements) {
      if (el.lat == null || el.lng == null) continue;
      const cat = classifyElement(el.tags ?? {});
      if (!cat) continue;
      const d = haversineMeters(lat, lng, el.lat, el.lng);
      buckets[cat].count += 1;
      if (d < buckets[cat].closestM) buckets[cat].closestM = d;
      const placeName = el.tags?.["name"];
      if (placeName && buckets[cat].places.length < 10) {
        buckets[cat].places.push(placeName);
      }
    }

    const fmtDist = (m: number) =>
      m === Infinity ? null : `~${Math.round(m / 10) * 10} m`;
    const fmtCount = (n: number, singular: string, plural: string) =>
      n === 0 ? null : n === 1 ? `1 ${singular}` : `+${n} ${plural}`;

    return [
      {
        category: "food",
        name: "Restaurantes",
        distance: fmtDist(buckets.food.closestM)                    ?? FALLBACK_DATA[0].distance,
        count:    fmtCount(buckets.food.count, "lugar", "lugares")  ?? FALLBACK_DATA[0].count,
        places:   buckets.food.places,
      },
      {
        category: "transit",
        name: "Transporte",
        distance: fmtDist(buckets.transit.closestM)                       ?? FALLBACK_DATA[1].distance,
        count:    fmtCount(buckets.transit.count, "parada", "paradas")    ?? FALLBACK_DATA[1].count,
        places:   buckets.transit.places,
      },
      {
        category: "education",
        name: "Escuelas",
        distance: fmtDist(buckets.education.closestM)                         ?? FALLBACK_DATA[2].distance,
        count:    fmtCount(buckets.education.count, "colegio", "colegios")    ?? FALLBACK_DATA[2].count,
        places:   buckets.education.places,
      },
      {
        category: "shops",
        name: "Comercios",
        distance: fmtDist(buckets.shops.closestM)                         ?? FALLBACK_DATA[3].distance,
        count:    fmtCount(buckets.shops.count, "tienda", "tiendas")      ?? FALLBACK_DATA[3].count,
        places:   buckets.shops.places,
      },
    ];
  },
  ["overpass-nearby-pois"],
  { revalidate: 86_400, tags: ["overpass"] }
);

// Mexico bounding box — skip the Overpass call for clearly invalid coordinates.
const MX_BOUNDS = { latMin: 14.5, latMax: 32.7, lngMin: -118.5, lngMax: -86.7 };

function isInMexicoBounds(lat: number, lng: number): boolean {
  return lat >= MX_BOUNDS.latMin && lat <= MX_BOUNDS.latMax
      && lng >= MX_BOUNDS.lngMin && lng <= MX_BOUNDS.lngMax;
}

export async function getNearbyPOIs(
  lat: number,
  lng: number
): Promise<NeighborhoodItem[]> {
  if (!isInMexicoBounds(lat, lng)) return FALLBACK_DATA;
  try {
    return await fetchNeighborhoodItem(lat, lng);
  } catch {
    return FALLBACK_DATA;
  }
}
