import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "EstateElevate — Propiedades de Lujo en México y LATAM",
    template: "%s | EstateElevate",
  },
  description:
    "Descubre las propiedades más exclusivas de México y Latinoamérica. Casas, departamentos, condominios y terrenos de lujo.",
  keywords: [
    "propiedades de lujo",
    "bienes raíces México",
    "casas en venta CDMX",
    "departamentos Monterrey",
    "inmuebles premium",
  ],
  openGraph: {
    siteName: "EstateElevate",
    locale: "es_MX",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${playfair.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans">{children}</body>
    </html>
  );
}
