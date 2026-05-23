import type { Listing } from "./supabase/types";

/**
 * Normalises a Mexican phone number and returns a wa.me deep link.
 * Always ensures the number starts with country code 52.
 */
export function getWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  const number = digits.startsWith("52") ? digits : `52${digits}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/**
 * Builds a pre-filled Spanish WhatsApp message with key listing details.
 */
export function getPropertyWhatsAppMessage(
  listing: Listing,
  appUrl: string
): string {
  const price = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: listing.currency ?? "MXN",
    maximumFractionDigits: 0,
  }).format(listing.price);

  const typeLabels: Record<string, string> = {
    house: "Casa",
    apartment: "Departamento",
    condo: "Condominio",
    land: "Terreno",
    commercial: "Local comercial",
  };
  const typeLabel = typeLabels[listing.property_type] ?? listing.property_type;

  const details: string[] = [];
  if (listing.bedrooms) details.push(`${listing.bedrooms} recámaras`);
  if (listing.bathrooms) details.push(`${listing.bathrooms} baños`);
  if (listing.total_area) details.push(`${listing.total_area} m²`);

  const detailLine = details.length > 0 ? `\n📐 ${details.join(" · ")}` : "";
  const listingUrl = `${appUrl}/propiedades/${listing.slug}`;

  return (
    `Hola, vi tu propiedad en EstateElevate y me interesa obtener más información:\n\n` +
    `🏠 *${listing.title}*\n` +
    `📍 ${listing.neighborhood ? `${listing.neighborhood}, ` : ""}${listing.city}, ${listing.state}\n` +
    `🏷️ ${typeLabel}${detailLine}\n` +
    `💰 ${price}\n\n` +
    `🔗 ${listingUrl}\n\n` +
    `¿Podría darme más detalles o agendar una visita?`
  );
}
