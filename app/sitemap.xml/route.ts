import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(
  loc: string,
  lastmod?: string,
  changefreq = "weekly",
  priority = "0.7"
): string {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod.slice(0, 10)}</lastmod>` : ""}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

export async function GET() {
  const base = config.app.url;

  // Fetch all active listings (no auth needed — public data)
  const db = getSupabaseServiceClient();
  const { data: listings } = await db
    .from("listings")
    .select("slug, updated_at")
    .eq("status", "active")
    .order("updated_at", { ascending: false });

  const staticPages = [
    urlEntry(`${base}/`, undefined, "daily", "1.0"),
    urlEntry(`${base}/search`, undefined, "daily", "0.9"),
    urlEntry(`${base}/legal/terminos`, undefined, "monthly", "0.3"),
    urlEntry(`${base}/legal/privacidad`, undefined, "monthly", "0.3"),
  ];

  const listingPages = (listings ?? []).map((l) =>
    urlEntry(
      `${base}/propiedades/${escapeXml(l.slug)}`,
      l.updated_at,
      "weekly",
      "0.8"
    )
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticPages, ...listingPages].join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
