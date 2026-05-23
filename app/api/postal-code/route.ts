import { NextRequest, NextResponse } from "next/server";

interface PostalCodeEntry {
  municipio: string;
  estado: string;
  ciudad: string;
  colonias: string[];
}

let _cache: Record<string, PostalCodeEntry> | null = null;

function getDataset(): Record<string, PostalCodeEntry> {
  if (_cache) return _cache;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  _cache = require("@/data/mexico-postal-codes.json") as Record<string, PostalCodeEntry>;
  return _cache;
}

export async function GET(request: NextRequest) {
  const cp = request.nextUrl.searchParams.get("cp") ?? "";

  if (!/^\d{5}$/.test(cp)) {
    return NextResponse.json({ error: "CP inválido" }, { status: 400 });
  }

  const dataset = getDataset();
  const entry = dataset[cp];

  if (!entry) {
    return NextResponse.json({ error: "Código postal no encontrado" }, { status: 404 });
  }

  const res = NextResponse.json(entry);
  res.headers.set("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
  return res;
}
