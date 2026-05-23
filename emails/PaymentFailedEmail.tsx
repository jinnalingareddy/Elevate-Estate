import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

// ─── Design tokens ────────────────────────────────────────────────────────────

const GOLD = "#e09f1a";
const RED = "#dc2626";
const RED_DARK = "#991b1b";
const RED_LIGHT = "#fef2f2";
const RED_BORDER = "#fecaca";
const DARK = "#0f172a";
const SLATE_600 = "#475569";
const SLATE_500 = "#64748b";
const SLATE_400 = "#94a3b8";
const BORDER = "#e2e8f0";
const BG = "#f1f5f9";
const WHITE = "#ffffff";
const SURFACE = "#f8fafc";
const AMBER_LIGHT = "#fffbeb";
const AMBER_BORDER = "#fde68a";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaymentFailedEmailProps {
  agentName: string;
  planName: string;
  gracePeriodEnd: string;
  updateUrl: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function daysUntil(iso: string): number {
  const now = new Date();
  const end = new Date(iso);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PaymentFailedEmail({
  agentName,
  planName,
  gracePeriodEnd,
  updateUrl,
}: PaymentFailedEmailProps) {
  const days = daysUntil(gracePeriodEnd);
  const deadline = formatDate(gracePeriodEnd);

  return (
    <Html lang="es" dir="ltr">
      <Head />
      <Preview>⚠️ Pago no procesado — Tu plan {planName} requiere atención inmediata</Preview>

      <Body style={{ background: BG, margin: 0, padding: "32px 0", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", background: WHITE, borderRadius: "12px", overflow: "hidden", border: `1px solid ${BORDER}` }}>

          {/* ── Red warning header ────────────────────────────────────────── */}
          <Section style={{ background: RED, padding: "24px 40px" }}>
            <Text style={{ margin: "0 0 2px", fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "20px", fontWeight: 700, color: WHITE }}>
              Estate<span style={{ color: "#fde68a" }}>Elevate</span>
            </Text>
            <Text style={{ margin: "10px 0 0", fontSize: "18px", fontWeight: 700, color: WHITE }}>
              ⚠️&nbsp;&nbsp;Pago No Procesado
            </Text>
          </Section>

          {/* ── Body ──────────────────────────────────────────────────────── */}
          <Section style={{ padding: "32px 40px 20px" }}>
            <Text style={{ margin: "0 0 8px", fontSize: "22px", fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700, color: DARK }}>
              Hola {agentName},
            </Text>
            <Text style={{ margin: "0 0 20px", fontSize: "15px", color: SLATE_600, lineHeight: "1.65" }}>
              No pudimos procesar el cobro de tu suscripción al plan{" "}
              <strong>{planName}</strong>. Esto puede deberse a fondos insuficientes o a que tu tarjeta expiró.
            </Text>
          </Section>

          {/* ── Urgency card ──────────────────────────────────────────────── */}
          <Section style={{ padding: "0 40px 24px" }}>
            <Section
              style={{
                background: RED_LIGHT,
                border: `1px solid ${RED_BORDER}`,
                borderRadius: "10px",
                padding: "20px 24px",
              }}
            >
              <Text style={{ margin: "0 0 10px", fontSize: "15px", fontWeight: 700, color: RED_DARK }}>
                Tu suscripción a {planName} no pudo renovarse
              </Text>
              <Text style={{ margin: 0, fontSize: "14px", color: RED_DARK, lineHeight: "1.6" }}>
                Tienes hasta el <strong>{deadline}</strong> para actualizar tu método de pago.
                Si no lo haces antes de esa fecha, tus propiedades activas serán movidas a borrador
                y ya no serán visibles para los compradores.
              </Text>
            </Section>
          </Section>

          {/* ── Countdown ─────────────────────────────────────────────────── */}
          <Section style={{ padding: "0 40px 28px" }}>
            <Section
              style={{
                background: AMBER_LIGHT,
                border: `1px solid ${AMBER_BORDER}`,
                borderRadius: "10px",
                padding: "16px 20px",
                textAlign: "center",
              }}
            >
              <Text style={{ margin: "0 0 4px", fontSize: "32px", fontWeight: 700, color: "#92400e", lineHeight: "1" }}>
                {days}
              </Text>
              <Text style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {days === 1 ? "día restante" : "días restantes"}
              </Text>
            </Section>
          </Section>

          {/* ── What happens if you don't act ─────────────────────────────── */}
          <Section style={{ padding: "0 40px 28px" }}>
            <Text style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 700, color: SLATE_500, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              ¿Qué pasa si no actualizo?
            </Text>
            <Section style={{ paddingLeft: "0" }}>
              <Text style={{ margin: "0 0 8px", fontSize: "13px", color: SLATE_600, lineHeight: "1.5" }}>
                🔴&nbsp;&nbsp;Tus propiedades activas pasarán a modo borrador
              </Text>
              <Text style={{ margin: "0 0 8px", fontSize: "13px", color: SLATE_600, lineHeight: "1.5" }}>
                🔴&nbsp;&nbsp;Dejarán de aparecer en resultados de búsqueda
              </Text>
              <Text style={{ margin: 0, fontSize: "13px", color: SLATE_600, lineHeight: "1.5" }}>
                🔴&nbsp;&nbsp;Perderás el acceso a funciones de tu plan {planName}
              </Text>
            </Section>
          </Section>

          {/* ── CTA ───────────────────────────────────────────────────────── */}
          <Section style={{ padding: "0 40px 36px" }}>
            <Hr style={{ border: "none", borderTop: `1px solid ${BORDER}`, margin: "0 0 28px" }} />
            <Button
              href={updateUrl}
              style={{
                background: RED,
                color: WHITE,
                fontSize: "15px",
                fontWeight: 700,
                padding: "14px 32px",
                borderRadius: "8px",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Actualizar Método de Pago →
            </Button>
            <Text style={{ margin: "16px 0 0", fontSize: "12px", color: SLATE_500 }}>
              ¿Necesitas ayuda?{" "}
              <Link href="mailto:soporte@estateelevate.mx" style={{ color: GOLD, textDecoration: "underline" }}>
                Contáctanos
              </Link>{" "}
              y te ayudaremos de inmediato.
            </Text>
          </Section>

          {/* ── Footer ────────────────────────────────────────────────────── */}
          <Section style={{ background: SURFACE, borderTop: `1px solid ${BORDER}`, padding: "20px 40px" }}>
            <Text style={{ margin: 0, fontSize: "12px", color: SLATE_400 }}>
              © {new Date().getFullYear()} EstateElevate &middot;{" "}
              <Link href="mailto:soporte@estateelevate.mx" style={{ color: SLATE_400, textDecoration: "underline" }}>
                soporte@estateelevate.mx
              </Link>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

export default PaymentFailedEmail;
