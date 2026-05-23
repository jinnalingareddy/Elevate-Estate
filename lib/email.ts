import { Resend } from "resend";
import {
  renderWelcomeEmail,
  renderNewLeadEmail,
  renderPaymentReceiptEmail,
  renderPaymentFailedEmail,
  renderListingsDraftedEmail,
} from "@/emails";
import type { DraftReason } from "@/emails";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@estateelevate.mx";
const SUPPORT_EMAIL = "soporte@estateelevate.mx";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://estateelevate.mx";

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Welcome ──────────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(
  to: string,
  agentName: string
): Promise<void> {
  const html = await renderWelcomeEmail({
    agentName,
    dashboardUrl: `${APP_URL}/agent/dashboard`,
  });

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Bienvenido a EstateElevate, ${agentName}`,
    html,
  });
}

// ─── New Lead ─────────────────────────────────────────────────────────────────

export interface NewLeadEmailData {
  to: string;
  agentName: string;
  leadName: string;
  leadEmail: string;
  leadPhone?: string | null;
  message?: string | null;
  listingTitle: string;
  listingPrice: number;
  listingSlug: string;
  appUrl?: string;
}

export async function sendNewLeadEmail(d: NewLeadEmailData): Promise<void> {
  const appUrl = d.appUrl ?? APP_URL;

  const html = await renderNewLeadEmail({
    agentName: d.agentName,
    lead: {
      name: d.leadName,
      email: d.leadEmail,
      phone: d.leadPhone ?? "",
      message: d.message ?? "",
    },
    listing: {
      title: d.listingTitle,
      price: d.listingPrice,
      slug: d.listingSlug,
    },
    appUrl,
  });

  await resend.emails.send({
    from: FROM,
    to: d.to,
    subject: `🏠 Nuevo prospecto: ${d.leadName} — ${d.listingTitle}`,
    html,
  });
}

// ─── Payment receipt ──────────────────────────────────────────────────────────

export interface PaymentReceiptEmailData {
  to: string;
  agentName: string;
  type: "pay_per_listing" | "subscription";
  planName?: string;
  amountCents: number;
  nextBillingDate?: string;
  orderId: string;
  currency?: string;
  appUrl?: string;
}

export async function sendPaymentReceiptEmail(d: PaymentReceiptEmailData): Promise<void> {
  const amount = d.amountCents / 100;

  const html = await renderPaymentReceiptEmail({
    agentName: d.agentName,
    type: d.type,
    planName: d.planName,
    amount,
    nextBillingDate: d.nextBillingDate,
    orderId: d.orderId,
  });

  const description =
    d.type === "subscription"
      ? `Plan ${d.planName ?? ""} — Suscripción mensual`
      : "Espacio adicional de publicación";

  await resend.emails.send({
    from: FROM,
    to: d.to,
    subject: `✅ Pago confirmado — ${description}`,
    html,
  });
}

// ─── Payment failed ───────────────────────────────────────────────────────────

export async function sendPaymentFailedEmail(
  to: string,
  agentName: string,
  appUrl: string,
  planName = "Pro",
  gracePeriodEnd?: string
): Promise<void> {
  const end =
    gracePeriodEnd ??
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

  const html = await renderPaymentFailedEmail({
    agentName,
    planName,
    gracePeriodEnd: end,
    updateUrl: `${appUrl}/agent/subscriptions`,
  });

  await resend.emails.send({
    from: FROM,
    to,
    subject: `⚠️ Pago no procesado — Tu plan ${planName} requiere atención`,
    html,
  });
}

// ─── Listings drafted ─────────────────────────────────────────────────────────

export async function sendListingsDraftedEmail(
  to: string,
  agentName: string,
  listingTitles: string[],
  newPlan: string,
  appUrl: string,
  reason: DraftReason = "cancellation"
): Promise<void> {
  const affectedListings = listingTitles.map((title) => ({
    title,
    slug: title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-"),
  }));

  const html = await renderListingsDraftedEmail({
    agentName,
    reason,
    affectedListings,
    upgradeUrl: `${appUrl}/agent/plans`,
  });

  await resend.emails.send({
    from: FROM,
    to,
    subject: `📦 ${listingTitles.length} ${listingTitles.length === 1 ? "propiedad movida" : "propiedades movidas"} a borrador`,
    html,
  });
}

// ─── Support ticket ───────────────────────────────────────────────────────────

export interface SupportTicketEmailData {
  ticketId: string;
  email: string;
  subject: string;
  category: string;
  message: string;
  appUrl: string;
}

export async function sendSupportTicketEmails(d: SupportTicketEmailData): Promise<void> {
  const shortId = d.ticketId.slice(0, 8).toUpperCase();

  // Simple HTML for internal/confirmation emails (not templated with React Email)
  function layout(body: string): string {
    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1e293b;">
  <p style="font-family:Georgia,serif;font-size:18px;font-weight:700;margin-bottom:24px;">Estate<span style="color:#e09f1a;">Elevate</span></p>
  ${body}
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0;">
  <p style="color:#94a3b8;font-size:12px;">&copy; ${new Date().getFullYear()} EstateElevate &middot; ${SUPPORT_EMAIL}</p>
</body></html>`;
  }

  await Promise.all([
    resend.emails.send({
      from: FROM,
      to: SUPPORT_EMAIL,
      replyTo: d.email,
      subject: `[#${shortId}] ${esc(d.subject)}`,
      html: layout(`
        <h2 style="margin:0 0 16px;">Nuevo ticket de soporte</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px;background:#f8fafc;font-weight:600;width:100px;">Ticket</td><td style="padding:8px;font-family:monospace;">#${shortId}</td></tr>
          <tr style="border-top:1px solid #e2e8f0;"><td style="padding:8px;background:#f8fafc;font-weight:600;">Email</td><td style="padding:8px;">${esc(d.email)}</td></tr>
          <tr style="border-top:1px solid #e2e8f0;"><td style="padding:8px;background:#f8fafc;font-weight:600;">Categoría</td><td style="padding:8px;">${esc(d.category)}</td></tr>
          <tr style="border-top:1px solid #e2e8f0;"><td style="padding:8px;background:#f8fafc;font-weight:600;">Asunto</td><td style="padding:8px;">${esc(d.subject)}</td></tr>
          <tr style="border-top:1px solid #e2e8f0;"><td style="padding:8px;background:#f8fafc;font-weight:600;vertical-align:top;">Mensaje</td><td style="padding:8px;white-space:pre-wrap;">${esc(d.message)}</td></tr>
        </table>
      `),
    }),

    resend.emails.send({
      from: FROM,
      to: d.email,
      subject: `Ticket recibido — #${shortId}`,
      html: layout(`
        <h2 style="margin:0 0 8px;">Ticket recibido</h2>
        <p style="color:#64748b;margin:0 0 20px;">Hemos recibido tu solicitud. Nuestro equipo te responderá en breve.</p>
        <div style="background:#f8fafc;border-radius:8px;padding:20px;text-align:center;margin-bottom:20px;">
          <p style="margin:0 0 4px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">Número de ticket</p>
          <p style="margin:0;font-family:monospace;font-size:24px;font-weight:700;color:#0f172a;">#${shortId}</p>
        </div>
        <p style="color:#64748b;">Asunto: <strong>${esc(d.subject)}</strong></p>
      `),
    }),
  ]);
}

// ─── Account status (admin actions) ──────────────────────────────────────────

export async function sendSuspensionEmail(
  to: string,
  agentName: string
): Promise<void> {
  function layout(body: string): string {
    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1e293b;">
  <p style="font-family:Georgia,serif;font-size:18px;font-weight:700;">Estate<span style="color:#e09f1a;">Elevate</span></p>
  ${body}
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
  <p style="color:#94a3b8;font-size:12px;">&copy; ${new Date().getFullYear()} EstateElevate</p>
</body></html>`;
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Tu cuenta ha sido suspendida",
    html: layout(`
      <h2 style="color:#dc2626;margin:0 0 12px;">Cuenta suspendida</h2>
      <p style="color:#64748b;">Hola ${esc(agentName)}, tu cuenta ha sido suspendida por un administrador.</p>
      <p style="color:#64748b;">Si crees que esto es un error, contáctanos en <a href="mailto:${SUPPORT_EMAIL}" style="color:#e09f1a;">${SUPPORT_EMAIL}</a>.</p>
    `),
  });
}

export async function sendReactivationEmail(
  to: string,
  agentName: string,
  appUrl: string
): Promise<void> {
  function layout(body: string): string {
    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1e293b;">
  <p style="font-family:Georgia,serif;font-size:18px;font-weight:700;">Estate<span style="color:#e09f1a;">Elevate</span></p>
  ${body}
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
  <p style="color:#94a3b8;font-size:12px;">&copy; ${new Date().getFullYear()} EstateElevate</p>
</body></html>`;
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Tu cuenta ha sido reactivada",
    html: layout(`
      <h2 style="color:#10b981;margin:0 0 12px;">Cuenta reactivada ✓</h2>
      <p style="color:#64748b;">Hola ${esc(agentName)}, tu cuenta ha sido reactivada. Ya puedes acceder normalmente.</p>
      <p><a href="${appUrl}/agent/auth" style="display:inline-block;background:#e09f1a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Iniciar sesión →</a></p>
    `),
  });
}
