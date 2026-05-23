import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

// ─── Design tokens ────────────────────────────────────────────────────────────

const GOLD = "#e09f1a";
const GREEN = "#059669";
const GREEN_LIGHT = "#ecfdf5";
const GREEN_BORDER = "#a7f3d0";
const DARK = "#0f172a";
const SLATE_800 = "#1e293b";
const SLATE_600 = "#475569";
const SLATE_500 = "#64748b";
const SLATE_400 = "#94a3b8";
const BORDER = "#e2e8f0";
const BG = "#f1f5f9";
const WHITE = "#ffffff";
const SURFACE = "#f8fafc";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaymentReceiptEmailProps {
  agentName: string;
  type: "subscription" | "pay_per_listing";
  planName?: string;
  amount: number;
  nextBillingDate?: string;
  orderId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── Receipt row ──────────────────────────────────────────────────────────────

function ReceiptRow({
  label,
  value,
  highlight = false,
  border = true,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
  border?: boolean;
}) {
  return (
    <Row style={border ? { borderTop: `1px solid ${BORDER}` } : {}}>
      <Column style={{ padding: "11px 16px", width: "160px" }}>
        <Text style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: SLATE_500 }}>
          {label}
        </Text>
      </Column>
      <Column style={{ padding: "11px 16px" }}>
        <Text
          style={{
            margin: 0,
            fontSize: "13px",
            color: highlight ? GOLD : SLATE_800,
            fontWeight: highlight ? 700 : 400,
            fontFamily: highlight ? "monospace" : "inherit",
          }}
        >
          {value}
        </Text>
      </Column>
    </Row>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PaymentReceiptEmail({
  agentName,
  type,
  planName,
  amount,
  nextBillingDate,
  orderId,
}: PaymentReceiptEmailProps) {
  const isSubscription = type === "subscription";
  const description = isSubscription
    ? `Plan ${planName ?? ""} — Suscripción mensual`
    : "Espacio adicional de publicación";
  const shortOrderId = orderId.slice(-8).toUpperCase();

  return (
    <Html lang="es" dir="ltr">
      <Head />
      <Preview>✅ Pago confirmado — {formatCurrency(amount)} MXN · Orden #{shortOrderId}</Preview>

      <Body style={{ background: BG, margin: 0, padding: "32px 0", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", background: WHITE, borderRadius: "12px", overflow: "hidden", border: `1px solid ${BORDER}` }}>

          {/* ── Dark header ───────────────────────────────────────────────── */}
          <Section style={{ background: DARK, padding: "20px 40px" }}>
            <Text style={{ margin: 0, fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "20px", fontWeight: 700, color: WHITE }}>
              Estate<span style={{ color: GOLD }}>Elevate</span>
            </Text>
          </Section>

          {/* ── Green confirmation banner ──────────────────────────────────── */}
          <Section style={{ background: GREEN_LIGHT, borderBottom: `1px solid ${GREEN_BORDER}`, padding: "16px 40px" }}>
            <Text style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: GREEN }}>
              ✅&nbsp;&nbsp;Pago Confirmado
            </Text>
          </Section>

          {/* ── Greeting ──────────────────────────────────────────────────── */}
          <Section style={{ padding: "32px 40px 24px" }}>
            <Text style={{ margin: "0 0 8px", fontSize: "22px", fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700, color: DARK }}>
              ¡Gracias, {agentName}!
            </Text>
            <Text style={{ margin: 0, fontSize: "14px", color: SLATE_500, lineHeight: "1.6" }}>
              Tu pago fue procesado exitosamente. Aquí tienes el comprobante de tu transacción.
            </Text>
          </Section>

          {/* ── Receipt card ──────────────────────────────────────────────── */}
          <Section style={{ padding: "0 40px 24px" }}>
            <Section
              style={{
                background: SURFACE,
                border: `1px solid ${BORDER}`,
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              <Section style={{ background: DARK, padding: "10px 16px" }}>
                <Text style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: SLATE_400, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Comprobante de pago
                </Text>
              </Section>

              <Section>
                <ReceiptRow
                  label="Orden"
                  value={`#${shortOrderId}`}
                  highlight
                  border={false}
                />
                <ReceiptRow
                  label="Fecha"
                  value={new Date().toLocaleDateString("es-MX", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                />
                <ReceiptRow label="Descripción" value={description} />
                <ReceiptRow
                  label="Monto"
                  value={
                    <span style={{ fontSize: "16px", fontWeight: 700, color: DARK }}>
                      {formatCurrency(amount)}{" "}
                      <span style={{ fontSize: "12px", color: SLATE_500, fontWeight: 400 }}>MXN</span>
                    </span>
                  }
                />
              </Section>
            </Section>
          </Section>

          {/* ── Status info ───────────────────────────────────────────────── */}
          <Section style={{ padding: "0 40px 28px" }}>
            {isSubscription && nextBillingDate ? (
              <Section
                style={{
                  background: GREEN_LIGHT,
                  border: `1px solid ${GREEN_BORDER}`,
                  borderRadius: "8px",
                  padding: "14px 18px",
                }}
              >
                <Text style={{ margin: 0, fontSize: "13px", color: "#065f46", lineHeight: "1.55" }}>
                  🎉 Tu plan <strong>{planName}</strong> está activo hasta el{" "}
                  <strong>{formatDate(nextBillingDate)}</strong>. Se renovará automáticamente en esa fecha.
                </Text>
              </Section>
            ) : (
              <Section
                style={{
                  background: GREEN_LIGHT,
                  border: `1px solid ${GREEN_BORDER}`,
                  borderRadius: "8px",
                  padding: "14px 18px",
                }}
              >
                <Text style={{ margin: 0, fontSize: "13px", color: "#065f46", lineHeight: "1.55" }}>
                  🏠 Tu espacio adicional de publicación está activo. Puedes publicar una propiedad extra en tu portal.
                </Text>
              </Section>
            )}
          </Section>

          {/* ── CTA ───────────────────────────────────────────────────────── */}
          <Section style={{ padding: "0 40px 36px" }}>
            <Hr style={{ border: "none", borderTop: `1px solid ${BORDER}`, margin: "0 0 28px" }} />
            <Button
              href="https://estateelevate.mx/agent/subscriptions"
              style={{
                background: GOLD,
                color: WHITE,
                fontSize: "14px",
                fontWeight: 700,
                padding: "13px 28px",
                borderRadius: "8px",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Ver mi Plan →
            </Button>
          </Section>

          {/* ── Footer ────────────────────────────────────────────────────── */}
          <Section style={{ background: SURFACE, borderTop: `1px solid ${BORDER}`, padding: "20px 40px" }}>
            <Text style={{ margin: 0, fontSize: "12px", color: SLATE_400 }}>
              © {new Date().getFullYear()} EstateElevate &middot;{" "}
              <Link href="mailto:soporte@estateelevate.mx" style={{ color: SLATE_400, textDecoration: "underline" }}>
                soporte@estateelevate.mx
              </Link>
            </Text>
            <Text style={{ margin: "4px 0 0", fontSize: "11px", color: SLATE_400 }}>
              Guarda este email como comprobante de tu pago. Orden #{shortOrderId}
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

export default PaymentReceiptEmail;
