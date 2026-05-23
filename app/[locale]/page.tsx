import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Accordion } from "@/components/ui/Accordion";
import { HeroContent } from "@/components/home/HeroContent";
import { FeaturedSection } from "@/components/home/FeaturedSection";
import { StatesGrid } from "@/components/home/StatesGrid";
import { CitiesGrid } from "@/components/home/CitiesGrid";
import { CTABanner } from "@/components/home/CTABanner";
import { getFeaturedListings } from "@/lib/supabase/queries/listings";
import { Link } from "@/lib/navigation";
import type { Listing } from "@/lib/supabase/types";

export const revalidate = 300;

// ─── Cities data ──────────────────────────────────────────────────────────────

const CITIES = [
  {
    name: "Ciudad de México",
    query: "Ciudad de México",
    photo:
      "https://res.cloudinary.com/do892kbiw/image/upload/v1779510612/static/ciudad-de-mexico.jpg",
    alt: "Vista aérea de la Ciudad de México",
  },
  {
    name: "Monterrey",
    query: "Monterrey",
    photo:
      "https://res.cloudinary.com/do892kbiw/image/upload/v1779510613/static/monterrey.jpg",
    alt: "Skyline de Monterrey al atardecer",
  },
  {
    name: "Guadalajara",
    query: "Guadalajara",
    photo:
      "https://res.cloudinary.com/do892kbiw/image/upload/v1779510614/static/guadalajara.jpg",
    alt: "Centro histórico de Guadalajara",
  },
  {
    name: "Cancún",
    query: "Cancún",
    photo:
      "https://res.cloudinary.com/do892kbiw/image/upload/v1779510615/static/cancun.jpg",
    alt: "Playa turquesa de Cancún",
  },
];

// ─── FAQ items ────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    value: "1",
    question: "¿Cómo publico mi propiedad en EstateElevate?",
    answer:
      "Registra una cuenta de agente en /agent/auth, completa tu perfil y selecciona el plan que mejor se adapte a tus necesidades. Con el Plan Gratuito puedes publicar hasta 1 propiedad. Una vez dentro de tu portal, usa el botón \"+ Nueva Propiedad\" para agregar fotos, descripción, precio y ubicación. Tu publicación quedará visible al público en minutos.",
  },
  {
    value: "2",
    question: "¿Qué métodos de pago aceptan?",
    answer:
      "Aceptamos tarjetas de crédito y débito Visa, Mastercard y American Express a través de Conekta, la pasarela de pago líder en México. También puedes pagar en efectivo mediante OXXO Pay o mediante transferencia bancaria (SPEI) desde cualquier banco mexicano. Para suscripciones mensuales, se realiza un cargo automático a tu tarjeta registrada.",
  },
  {
    value: "3",
    question: "¿Cuáles son los límites del Plan Gratuito?",
    answer:
      "El Plan Gratuito te permite tener 1 propiedad activa en todo momento, sin propiedades destacadas y con acceso básico a estadísticas. Es ideal si estás comenzando o tienes pocas propiedades. Si necesitas publicar más propiedades o acceder a funciones avanzadas, puedes actualizar al Plan Pro (10 propiedades, 2 destacadas) o al Plan Elite (50 propiedades, 10 destacadas, estadísticas avanzadas y soporte prioritario).",
  },
  {
    value: "4",
    question: "¿Cómo funcionan los prospectos (leads)?",
    answer:
      "Cuando un comprador interesado llena el formulario de contacto o te escribe por WhatsApp desde tu propiedad, recibes un lead en tu Panel de Agente → Prospectos. Desde ahí puedes ver el nombre, correo, teléfono y mensaje del prospecto, marcar su estado (Nuevo, Contactado, Calificado, Negociando, Cerrado) y llevar un seguimiento completo de tu pipeline de ventas.",
  },
  {
    value: "5",
    question: "¿Cómo contacto a soporte si tengo un problema?",
    answer:
      "Puedes contactarnos por WhatsApp al número que aparece en el pie de página, o enviarnos un correo a soporte@estateelevate.mx. Nuestro equipo responde en un plazo máximo de 24 horas hábiles. Los usuarios del Plan Elite cuentan con soporte prioritario y tiempo de respuesta de 4 horas hábiles.",
  },
  {
    value: "6",
    question: "¿Qué incluye el Plan Elite?",
    answer:
      "El Plan Elite es nuestra oferta más completa: hasta 50 propiedades activas simultáneas, 10 publicaciones destacadas (que aparecen primero en los resultados de búsqueda), estadísticas avanzadas con tendencias de vistas y prospectos, tour virtual 3D incluido, soporte prioritario con tiempo de respuesta de 4 horas, y una insignia de \"Agente Elite\" en tu perfil público que genera mayor confianza en los compradores.",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const [t, featured] = await Promise.all([
    getTranslations("home"),
    getFeaturedListings(5).catch(() => [] as Listing[]),
  ]);

  return (
    <>
      <Navbar />

      <main>
        {/* ── Hero ────────────────────────────────────────────────────── */}
        <section className="relative min-h-screen flex items-center justify-center">
          {/* Background — own overflow-hidden so the image is clipped without clipping the search dropdown */}
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src="https://res.cloudinary.com/do892kbiw/image/upload/v1779510610/static/hero-background.jpg"
              alt="Lujosa propiedad residencial"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/45" />
          </div>

          {/* Centered content */}
          <div className="relative z-10 w-full max-w-4xl mx-auto px-4 py-24">
            <HeroContent />
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
            <ChevronDown
              className="h-8 w-8 text-white/70 animate-bounce"
              aria-hidden
            />
          </div>
        </section>

        {/* ── Featured Collections ─────────────────────────────────────── */}
        <section className="py-12 sm:py-16 md:py-20 bg-white dark:bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-10">
              <div>
                <p className="text-sm font-semibold text-gold-600 dark:text-gold-400 uppercase tracking-wider mb-2">
                  {t("premiumSelection")}
                </p>
                <h2 className="text-3xl md:text-4xl font-bold font-serif text-slate-900 dark:text-slate-100">
                  {t("featuredTitle")}
                </h2>
              </div>
              <Link
                href="/search?featured=true"
                className="text-sm font-medium text-gold-600 dark:text-gold-400 hover:text-gold-700 dark:hover:text-gold-300 transition-colors whitespace-nowrap"
              >
                {t("viewAll")}
              </Link>
            </div>

            <FeaturedSection listings={featured} />
          </div>
        </section>

        {/* ── Cities ───────────────────────────────────────────────────── */}
        <section className="py-12 sm:py-16 md:py-20 bg-slate-50 dark:bg-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <p className="text-sm font-semibold text-gold-600 dark:text-gold-400 uppercase tracking-wider mb-2">
                {t("luxuryDestinations")}
              </p>
              <h2 className="text-3xl md:text-4xl font-bold font-serif text-slate-900 dark:text-slate-100">
                {t("citiesTitle")}
              </h2>
            </div>

            {/* Top featured cities with photos */}
            <CitiesGrid cities={CITIES} />

            {/* All 32 states expandable grid */}
            <StatesGrid />
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <section className="py-12 sm:py-16 md:py-20 bg-white dark:bg-slate-950">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <p className="text-sm font-semibold text-gold-600 dark:text-gold-400 uppercase tracking-wider mb-2">
                {t("faqSubtitle")}
              </p>
              <h2 className="text-3xl md:text-4xl font-bold font-serif text-slate-900 dark:text-slate-100">
                {t("faqTitle")}
              </h2>
            </div>
            <Accordion items={FAQ_ITEMS} />
          </div>
        </section>

        {/* ── CTA Banner ───────────────────────────────────────────────── */}
        <CTABanner />
      </main>

      <Footer />
    </>
  );
}
