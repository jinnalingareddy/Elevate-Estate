import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const schema = z
  .object({
    full_name: z.string().min(1).max(120).optional(),
    bio: z.string().max(1000).optional(),
    agency_name: z.string().max(120).optional(),
    whatsapp_number: z.string().max(20).optional(),
    email_notifications: z.boolean().optional(),
    whatsapp_notifications: z.boolean().optional(),
  })
  .refine(
    (d) => Object.values(d).some((v) => v !== undefined),
    { message: "Debe proporcionar al menos un campo" }
  );

export async function PATCH(req: NextRequest) {
  // 1. Auth check
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // 2. Parse body
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  // 3. Zod validation
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 422 }
    );
  }

  const {
    full_name,
    bio,
    agency_name,
    whatsapp_number,
    email_notifications,
    whatsapp_notifications,
  } = parsed.data;

  // 4. Build update payload — only include defined fields
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (full_name !== undefined) patch.full_name = full_name.trim();
  if (bio !== undefined) patch.bio = bio.trim();
  if (agency_name !== undefined) patch.agency_name = agency_name.trim();
  if (whatsapp_number !== undefined) patch.whatsapp = whatsapp_number.trim();
  if (email_notifications !== undefined)
    patch.email_notifications = email_notifications;
  if (whatsapp_notifications !== undefined)
    patch.whatsapp_notifications = whatsapp_notifications;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      Sentry.captureException(error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json(
      { error: "Error al actualizar perfil" },
      { status: 500 }
    );
  }
}
