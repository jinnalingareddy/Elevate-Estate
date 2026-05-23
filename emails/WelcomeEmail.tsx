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
const DARK = "#0f172a";
const SLATE_800 = "#1e293b";
const SLATE_600 = "#475569";
const SLATE_400 = "#94a3b8";
const BORDER = "#e2e8f0";
const BG = "#f1f5f9";
const WHITE = "#ffffff";
const SURFACE = "#f8fafc";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WelcomeEmailProps {
  agentName: string;
  dashboardUrl: string;
}

// ─── Steps data ───────────────────────────────────────────────────────────────

const STEPS = [
  {
    icon: "👤",
    title: "Completa tu perfil",
    body: "Agrega tu foto, agencia y número de WhatsApp para generar confianza con los compradores.",
  },
  {
    icon: "🏠",
    title: "Publica tu primera propiedad",
    body: "Sube fotos de alta calidad, agrega descripción y amenidades para destacar en búsquedas.",
  },
  {
    icon: "🔔",
    title: "Configura tus notificaciones",
    body: "Recibe alertas inmediatas por email o WhatsApp cuando lleguen nuevos prospectos.",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function WelcomeEmail({ agentName, dashboardUrl }: WelcomeEmailProps) {
  return (
    <Html lang="es" dir="ltr">
      <Head />
      <Preview>Bienvenido a EstateElevate, {agentName} — Tu portal ya está listo</Preview>

      <Body style={{ background: BG, margin: 0, padding: "32px 0", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", background: WHITE, borderRadius: "12px", overflow: "hidden", border: `1px solid ${BORDER}` }}>

          {/* ── Dark header ───────────────────────────────────────────────── */}
          <Section style={{ background: DARK, padding: "28px 40px 24px" }}>
            <Text style={{ margin: "0 0 4px", fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "24px", fontWeight: 700, color: WHITE, lineHeight: "1" }}>
              Estate<span style={{ color: GOLD }}>Elevate</span>
            </Text>
            <Text style={{ margin: 0, fontSize: "11px", color: SLATE_400, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              El marketplace inmobiliario de lujo
            </Text>
          </Section>

          {/* ── Hero / greeting ───────────────────────────────────────────── */}
          <Section style={{ padding: "40px 40px 28px" }}>
            <Text style={{ margin: "0 0 6px", fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "28px", fontWeight: 700, color: DARK, lineHeight: "1.2" }}>
              Bienvenido a EstateElevate,<br />{agentName} 👋
            </Text>
            <Text style={{ margin: "16px 0 28px", fontSize: "15px", color: SLATE_600, lineHeight: "1.65" }}>
              Tu cuenta de agente está activa. Ya puedes publicar propiedades, gestionar prospectos y conectar con compradores de alto perfil en México y LATAM.
            </Text>

            <Button
              href={dashboardUrl}
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
              Ir a mi Portal →
            </Button>
          </Section>

          {/* ── Divider ───────────────────────────────────────────────────── */}
          <Section style={{ padding: "0 40px" }}>
            <Hr style={{ border: "none", borderTop: `1px solid ${BORDER}`, margin: 0 }} />
          </Section>

          {/* ── Next steps ────────────────────────────────────────────────── */}
          <Section style={{ padding: "28px 40px 36px" }}>
            <Text style={{ margin: "0 0 20px", fontSize: "11px", fontWeight: 700, color: SLATE_400, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Próximos pasos
            </Text>

            {STEPS.map((step) => (
              <Section
                key={step.title}
                style={{ marginBottom: "16px", background: SURFACE, borderRadius: "8px", padding: "16px 20px", border: `1px solid ${BORDER}` }}
              >
                <Text style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 700, color: SLATE_800 }}>
                  {step.icon}&nbsp;&nbsp;{step.title}
                </Text>
                <Text style={{ margin: 0, fontSize: "13px", color: SLATE_600, lineHeight: "1.55" }}>
                  {step.body}
                </Text>
              </Section>
            ))}
          </Section>

          {/* ── Footer ────────────────────────────────────────────────────── */}
          <Section style={{ background: SURFACE, borderTop: `1px solid ${BORDER}`, padding: "20px 40px" }}>
            <Text style={{ margin: "0 0 4px", fontSize: "12px", color: SLATE_400, lineHeight: "1.5" }}>
              © {new Date().getFullYear()} EstateElevate &middot; Ciudad de México, México
            </Text>
            <Text style={{ margin: 0, fontSize: "12px", color: SLATE_400 }}>
              <Link
                href="mailto:soporte@estateelevate.mx"
                style={{ color: SLATE_400, textDecoration: "underline" }}
              >
                soporte@estateelevate.mx
              </Link>
              {" · "}
              <Link
                href={`${dashboardUrl.split("/agent")[0]}/unsubscribe`}
                style={{ color: SLATE_400, textDecoration: "underline" }}
              >
                Cancelar suscripción
              </Link>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

export default WelcomeEmail;
