import { nanoid } from "nanoid";
import { getSupabaseServerClient } from "./supabase/server";

function slugifyPart(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritics
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Generates a slug in the format: {type}-{bedrooms}rec-{city}-{nanoid(6)}
 * Examples:
 *   casa-3rec-cdmx-a1b2c3
 *   departamento-2rec-monterrey-x9y8z7
 *   terreno-0rec-cancun-m3n4o5
 */
export function generateSlug(
  propertyType: string,
  bedrooms: number,
  city: string
): string {
  const typePart = slugifyPart(propertyType);
  const bedroomsPart = `${Math.max(0, bedrooms)}rec`;
  const cityPart = slugifyPart(city);
  const id = nanoid(6);
  return `${typePart}-${bedroomsPart}-${cityPart}-${id}`;
}

/**
 * Checks the listings table for slug collisions and appends -2, -3, etc.
 * until it finds an available slug.
 */
export async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  const supabase = await getSupabaseServerClient();

  const { data: existing } = await supabase
    .from("listings")
    .select("slug")
    .eq("slug", baseSlug)
    .maybeSingle();

  if (!existing) return baseSlug;

  let counter = 2;
  while (counter < 100) {
    const candidate = `${baseSlug}-${counter}`;
    const { data: collision } = await supabase
      .from("listings")
      .select("slug")
      .eq("slug", candidate)
      .maybeSingle();

    if (!collision) return candidate;
    counter++;
  }

  // Fallback: append fresh nanoid if all numeric suffixes somehow collide
  return `${baseSlug}-${nanoid(8)}`;
}
