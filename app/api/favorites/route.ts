import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ favorites: [] });
    }

    const { data, error } = await supabase
      .from("favorites")
      .select("listing_id")
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({
      favorites: data?.map((f) => f.listing_id) ?? [],
    });
  } catch {
    return NextResponse.json({ favorites: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = z.object({ listingId: z.string().uuid("listingId must be a valid UUID") }).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "listingId required" }, { status: 400 });
    }
    const { listingId } = parsed.data;

    // Check if already favorited
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
