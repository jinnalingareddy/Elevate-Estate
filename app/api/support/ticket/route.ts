import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { sendSupportTicketEmails } from "@/lib/email";
import { config } from "@/lib/config";

const schema = z.object({
  subject: z
    .string()
    .min(5, "El asunto debe tener al menos 5 caracteres")
    .max(120),
  category: z.string().min(1, "Categoría requerida").max(60),
  message: z
    .string()
    .min(20, "El mensaje debe tener al menos 20 caracteres")
    .max(4000),
});

export async function POST(req: NextRequest) {
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

  const { subject, category, message } = parsed.data;

  try {
    // 4. Fetch agent email for the ticket record
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", user.id)
      .single();

    const email = profile?.email ?? user.email ?? "";

    // 5. Insert ticket
    const { data: ticket, error: insertError } = await supabase
      .from("support_tickets")
      .insert({
        user_id: user.id,
        email,
        subject,
        message,
        priority: "medium",
        status: "open",
      })
      .select("id")
      .single();

    if (insertError || !ticket) {
      Sentry.captureException(insertError);
      return NextResponse.json(
        { error: "Error al crear ticket" },
        { status: 500 }
      );
    }

    // 6. Send emails (non-fatal)
    sendSupportTicketEmails({
      ticketId: ticket.id,
      email,
      subject,
      category,
      message,
      appUrl: config.app.url,
    }).catch((err) => Sentry.captureException(err));

    return NextResponse.json({ success: true, ticket_id: ticket.id }, { status: 201 });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json(
      { error: "Error al procesar solicitud" },
      { status: 500 }
    );
  }
}
