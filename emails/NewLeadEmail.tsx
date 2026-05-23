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
const TEAL = "#0d9488";
const DARK = "#0f172a";
const SLATE_800 = "#1e293b";
const SLATE_700 = "#334155";
const SLATE_600 = "#475569";
const SLATE_500 = "#64748b";
const SLATE_400 = "#94a3b8";
const BORDER = "#e2e8f0";
const BG = "#f1f5f9";
const WHITE = "#ffffff";
const SURFACE = "#f8fafc";
const GOLD_LIGHT = "#fffbeb";
const GOLD_BORDER = "#fde68a";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NewLeadEmailProps {
  agentName: string;
  lead: {
    name: string;
    email: string;
    phone: string;
    message: string;
  };
  listing: {
    title: string;
    price: number;
    slug: string;
  };
  appUrl: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function buildWhatsAppUrl(phone: string, leadName: string, listingTitle: string): string {
  const digits = phone.replace(/\D/g, "");
  const msg = `Hola ${leadName}, soy tu agente en EstateElevate. Vi tu interés en la propiedad "${listingTitle}". ¿Cuándo podemos hablar?`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NewLeadEmail({
  agentName,
  lead,
  listing,
  appUrl,
}: NewLeadEmailProps) {
  const listingUrl = `${appUrl}/propiedades/${listing.slug}`;
  const portalUrl = `${appUrl}/agent/leads`;
  const whatsappUrl = buildWhatsAppUrl(lead.phone, lead.name, listing.title);

  return (
    <Html lang="es" dir="ltr">
      <Head />
      <Preview>🏠 Nuevo prospecto: {lead.name} está interesado en {listing.title}</Preview>

      <Body style={{ background: BG, margin: 0, padding: "32px 0", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", background: WHITE, borderRadius: "12px", overflow: "hidden", border: `1px solid ${BORDER}` }}>

          {/* ── Dark header ───────────────────────────────────────────────── */}
          <Section style={{ background: DARK, padding: "20px 40px" }}>
            <Text style={{ margin: 0, fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "20px", fontWeight: 700, color: WHITE }}>
              Estate<span style={{ color: GOLD }}>Elevate</span>
            </Text>
          </Section>

          {/* ── Subject indicator ─────────────────────────────────────────── */}
          <Section style={{ background: GOLD_LIGHT, borderBottom: `1px solid ${GOLD_BORDER}`, padding: "12px 40px" }}>
            <Text style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#92400e", letterSpacing: "0.04em" }}>
              🏠&nbsp;&nbsp;NUEVO PROSPECTO
            </Text>
          </Section>

          {/* ── Greeting ──────────────────────────────────────────────────── */}
          <Section style={{ padding: "32px 40px 20px" }}>
            <Text style={{ margin: "0 0 4px", fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "22px", fontWeight: 700, color: DARK }}>
              ¡Tienes un nuevo interesado!
            </Text>
            <Text style={{ margin: 0, fontSize: "14px", color: SLATE_500 }}>
              Hola {agentName}, <strong>{lead.name}</strong> quiere conocer más sobre tu propiedad.
            </Text>
          </Section>

          {/* ── Lead info card ────────────────────────────────────────────── */}
          <Section style={{ padding: "0 40px 24px" }}>
            <Section
              style={{
                background: SURFACE,
                border: `1px solid ${BORDER}`,
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              {/* Header row */}
              <Section style={{ background: DARK, padding: "10px 16px" }}>
                <Text style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: SLATE_400, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Información del prospecto
                </Text>
              </Section>

              {/* Data rows */}
              <Section style={{ padding: "4px 0" }}>
                <Row style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <Column style={{ padding: "10px 16px", width: "120px" }}>
                    <Text style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: SLATE_500 }}>Nombre</Text>
                  </Column>
                  <Column style={{ padding: "10px 16px" }}>
                    <Text style={{ margin: 0, fontSize: "13px", color: SLATE_800, fontWeight: 600 }}>{lead.name}</Text>
                  </Column>
                </Row>
                <Row style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <Column style={{ padding: "10px 16px", width: "120px" }}>
                    <Text style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: SLATE_500 }}>Email</Text>
                  </Column>
                  <Column style={{ padding: "10px 16px" }}>
                    <Text style={{ margin: 0, fontSize: "13px", color: SLATE_800 }}>
                      <Link href={`mailto:${lead.email}`} style={{ color: GOLD, textDecoration: "none" }}>
                        {lead.email}
                      </Link>
                    </Text>
                  </Column>
                </Row>
                <Row style={{ borderBottom: lead.message ? `1px solid ${BORDER}` : "none" }}>
                  <Column style={{ padding: "10px 16px", width: "120px" }}>
                    <Text style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: SLATE_500 }}>Teléfono</Text>
                  </Column>
                  <Column style={{ padding: "10px 16px" }}>
                    <Text style={{ margin: 0, fontSize: "13px", color: SLATE_800 }}>{lead.phone}</Text>
                  </Column>
                </Row>
                {lead.message ? (
                  <Row>
                    <Column style={{ padding: "10px 16px", width: "120px", verticalAlign: "top" }}>
                      <Text style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: SLATE_500 }}>Mensaje</Text>
                    </Column>
                    <Column style={{ padding: "10px 16px" }}>
                      <Text style={{ margin: 0, fontSize: "13px", color: SLATE_700, lineHeight: "1.55", whiteSpace: "pre-wrap" }}>
                        {lead.message}
                      </Text>
                    </Column>
                  </Row>
                ) : null}
              </Section>
            </Section>
          </Section>

          {/* ── Property section ──────────────────────────────────────────── */}
          <Section style={{ padding: "0 40px 28px" }}>
            <Section
              style={{
                background: SURFACE,
                border: `1px solid ${BORDER}`,
                borderRadius: "10px",
                padding: "16px 20px",
              }}
            >
              <Text style={{ margin: "0 0 2px", fontSize: "11px", fontWeight: 700, color: SLATE_400, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Propiedad de interés
              </Text>
              <Text style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 700, color: DARK }}>
                <Link href={listingUrl} style={{ color: DARK, textDecoration: "none" }}>
                  {listing.title}
                </Link>
              </Text>
              <Text style={{ margin: "0 0 12px", fontSize: "18px", fontWeight: 700, color: GOLD }}>
                {formatCurrency(listing.price)}
              </Text>
              <Link
                href={listingUrl}
                style={{ fontSize: "13px", color: GOLD, textDecoration: "underline", fontWeight: 600 }}
              >
                Ver publicación →
              </Link>
            </Section>
          </Section>

          {/* ── CTA buttons ───────────────────────────────────────────────── */}
          <Section style={{ padding: "0 40px 8px" }}>
            <Row>
              <Column style={{ paddingRight: "8px" }}>
                <Button
                  href={portalUrl}
                  style={{
                    background: GOLD,
                    color: WHITE,
                    fontSize: "14px",
                    fontWeight: 700,
                    padding: "13px 24px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    display: "block",
                    textAlign: "center",
                  }}
                >
                  Ver en Portal →
                </Button>
              </Column>
              <Column style={{ paddingLeft: "8px" }}>
                <Button
                  href={whatsappUrl}
                  style={{
                    background: TEAL,
                    color: WHITE,
                    fontSize: "14px",
                    fontWeight: 700,
                    padding: "13px 24px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    display: "block",
                    textAlign: "center",
                  }}
                >
                  WhatsApp →
                </Button>
              </Column>
            </Row>
          </Section>

          {/* ── Motivational text ─────────────────────────────────────────── */}
          <Section style={{ padding: "20px 40px 32px" }}>
            <Section style={{ background: GOLD_LIGHT, border: `1px solid ${GOLD_BORDER}`, borderRadius: "8px", padding: "14px 18px" }}>
              <Text style={{ margin: 0, fontSize: "13px", color: "#92400e", lineHeight: "1.55", textAlign: "center" }}>
                💡 <strong>Responde rápido</strong> — los agentes que contactan en los primeros 5 minutos tienen <strong>8× más probabilidades</strong> de cerrar la venta.
              </Text>
            </Section>
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

export default NewLeadEmail;
