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
const ORANGE = "#ea580c";
const ORANGE_DARK = "#9a3412";
const ORANGE_LIGHT = "#fff7ed";
const ORANGE_BORDER = "#fed7aa";
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

export type DraftReason =
  | "downgrade"
  | "cancellation"
  | "grace_expired"
  | "slot_expired";

export interface ListingsDraftedEmailProps {
  agentName: string;
  reason: DraftReason;
  affectedListings: Array<{ title: string; slug: string }>;
  upgradeUrl: string;
}

// ─── Reason copy ──────────────────────────────────────────────────────────────

const REASON_COPY: Record<
  DraftReason,
  { subject: string; heading: string; body: string; cta: string }
> = {
  downgrade: {
    subject: "Propiedades movidas a borrador — Cambio de plan",
    heading: "Tu plan fue reducido",
    body: "Al cambiar a un plan con menor límite de publicaciones, las siguientes propiedades fueron movidas a modo borrador. Tus otras propiedades siguen activas.",
    cta: "Actualiza tu plan para volver a publicarlas y no perder visibilidad.",
  },
  cancellation: {
    subject: "Propiedades movidas a borrador — Suscripción cancelada",
    heading: "Tu suscripción fue cancelada",
    body: "Al cancelar tu suscripción, tu cuenta regresó al plan gratuito. Las siguientes propiedades superan el límite de ese plan y fueron movidas a borrador.",
    cta: "Reactiva tu plan para publicar todas tus propiedades nuevamente.",
  },
  grace_expired: {
    subject: "Propiedades movidas a borrador — Período de gracia vencido",
    heading: "Tu período de gracia venció",
    body: "El tiempo para actualizar tu método de pago expiró y tu cuenta fue reducida al plan gratuito. Las siguientes propiedades fueron movidas a borrador automáticamente.",
    cta: "Actualiza tu suscripción para volver a publicarlas de inmediato.",
  },
  slot_expired: {
    subject: "Propiedades movidas a borrador — Espacio adicional vencido",
    heading: "Tu espacio adicional expiró",
    body: "El espacio de publicación adicional que habías adquirido ha vencido. Las siguientes propiedades fueron movidas a borrador.",
    cta: "Adquiere un nuevo espacio o suscríbete a un plan para seguir publicando.",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ListingsDraftedEmail({
  agentName,
  reason,
  affectedListings,
  upgradeUrl,
}: ListingsDraftedEmailProps) {
  const copy = REASON_COPY[reason];
  const count = affectedListings.length;
  const previewText = `📦 ${count} ${count === 1 ? "propiedad movida" : "propiedades movidas"} a borrador — ${copy.heading}`;

  return (
    <Html lang="es" dir="ltr">
      <Head />
      <Preview>{previewText}</Preview>

      <Body style={{ background: BG, margin: 0, padding: "32px 0", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", background: WHITE, borderRadius: "12px", overflow: "hidden", border: `1px solid ${BORDER}` }}>

          {/* ── Orange warning header ─────────────────────────────────────── */}
          <Section style={{ background: ORANGE, padding: "24px 40px" }}>
            <Text style={{ margin: "0 0 2px", fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "20px", fontWeight: 700, color: WHITE }}>
              Estate<span style={{ color: "#fde68a" }}>Elevate</span>
            </Text>
            <Text style={{ margin: "10px 0 0", fontSize: "18px", fontWeight: 700, color: WHITE }}>
              📦&nbsp;&nbsp;Propiedades Movidas a Borrador
            </Text>
          </Section>

          {/* ── Greeting ──────────────────────────────────────────────────── */}
          <Section style={{ padding: "32px 40px 20px" }}>
            <Text style={{ margin: "0 0 8px", fontSize: "22px", fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700, color: DARK }}>
              {copy.heading}
            </Text>
            <Text style={{ margin: "0 0 6px", fontSize: "14px", color: SLATE_500 }}>
              Hola {agentName},
            </Text>
            <Text style={{ margin: 0, fontSize: "14px", color: SLATE_600, lineHeight: "1.65" }}>
              {copy.body}
            </Text>
          </Section>

          {/* ── Count badge ───────────────────────────────────────────────── */}
          <Section style={{ padding: "0 40px 20px" }}>
            <Section
              style={{
                background: ORANGE_LIGHT,
                border: `1px solid ${ORANGE_BORDER}`,
                borderRadius: "8px",
                padding: "12px 18px",
                display: "inline-block",
              }}
            >
              <Text style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: ORANGE_DARK }}>
                {count} {count === 1 ? "propiedad afectada" : "propiedades afectadas"}
              </Text>
            </Section>
          </Section>

          {/* ── Affected listings ─────────────────────────────────────────── */}
          <Section style={{ padding: "0 40px 28px" }}>
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
                  Propiedades en borrador
                </Text>
              </Section>

              <Section style={{ padding: "8px 0" }}>
                {affectedListings.map((listing, i) => (
                  <Section
                    key={listing.slug}
                    style={{
                      padding: "10px 16px",
                      borderTop: i > 0 ? `1px solid ${BORDER}` : "none",
                    }}
                  >
                    <Text style={{ margin: 0, fontSize: "13px", color: SLATE_800 }}>
                      <span style={{ color: ORANGE, fontWeight: 700, marginRight: "8px" }}>
                        📦
                      </span>
                      <Link
                        href={`https://estateelevate.mx/propiedades/${listing.slug}`}
                        style={{ color: SLATE_800, textDecoration: "none" }}
                      >
                        {listing.title}
                      </Link>
                    </Text>
                  </Section>
                ))}
              </Section>
            </Section>
          </Section>

          {/* ── Upgrade prompt ────────────────────────────────────────────── */}
          <Section style={{ padding: "0 40px 28px" }}>
            <Section
              style={{
                background: ORANGE_LIGHT,
                border: `1px solid ${ORANGE_BORDER}`,
                borderRadius: "8px",
                padding: "14px 18px",
              }}
            >
              <Text style={{ margin: 0, fontSize: "13px", color: ORANGE_DARK, lineHeight: "1.6" }}>
                💡 <strong>{copy.cta}</strong>
              </Text>
            </Section>
          </Section>

          {/* ── CTA ───────────────────────────────────────────────────────── */}
          <Section style={{ padding: "0 40px 36px" }}>
            <Hr style={{ border: "none", borderTop: `1px solid ${BORDER}`, margin: "0 0 28px" }} />

            <Button
              href={upgradeUrl}
              style={{
                background: GOLD,
                color: WHITE,
                fontSize: "15px",
                fontWeight: 700,
                padding: "14px 32px",
                borderRadius: "8px",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Reactiva tus Propiedades →
            </Button>

            <Text style={{ margin: "20px 0 0", fontSize: "13px", color: SLATE_600, lineHeight: "1.6" }}>
              Tus borradores están guardados y no se pierden. Simplemente actualiza tu plan y vuelve a publicarlos con un clic.
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
            <Text style={{ margin: "4px 0 0", fontSize: "11px", color: SLATE_400 }}>
              ¿Tienes dudas?{" "}
              <Link href="mailto:soporte@estateelevate.mx" style={{ color: SLATE_400, textDecoration: "underline" }}>
                Nuestro equipo está disponible para ayudarte.
              </Link>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

export default ListingsDraftedEmail;
