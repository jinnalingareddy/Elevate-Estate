import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// getUser() validates the JWT with the Supabase Auth server — correct for API routes.
// The FavoritesProvider calls this in the background (non-blocking), so the
// extra network round-trip (~300ms) no longer affects perceived page load time.
async function getRequestUser() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  try {
    const { supabase, user } = await getRequestUser();

    if (!user) {
      return NextResponse.json({ favorites: [] });
    }

    const { data, error } = await supabase
      .from("favorites")
      .select("listing_id")
      .eq("user_id", user.id);

    if (error) throw error;

    // Cache in the browser for 30 s, serve stale for 2 min while revalidating.
    // Eliminates repeat fetches on client-side navigation within a session.
    return NextResponse.json(
      { favorites: data?.map((f) => f.listing_id) ?? [] },
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=120",
        },
      }
    );
  } catch {
    return NextResponse.json({ favorites: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getRequestUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = z
      .object({ listingId: z.string().uuid("listingId must be a valid UUID") })
      .safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "listingId required" },
        { status: 400 }
      );
    }
    const { listingId } = parsed.data;

    const { data: existing } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("listing_id", listingId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("listing_id", listingId);

      return NextResponse.json({ favorited: false });
    }

    await supabase
      .from("favorites")
      .insert({ user_id: user.id, listing_id: listingId });

    return NextResponse.json({ favorited: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
