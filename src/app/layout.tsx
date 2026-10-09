import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import { SITE_URL } from "@/lib/env";
import { brand } from "@/lib/site";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${brand.name} — Photographe automobile & moto à Madagascar`,
    template: `%s · ${brand.name}`,
  },
  description:
    "Faniry Raoilison, photographe Auto-Moto à Antananarivo : shooting automobile et moto, compétitions, événements, sorties et contenus pour les marques et concessions.",
  applicationName: brand.name,
  authors: [{ name: brand.owner }],
  keywords: [
    "photographe automobile Madagascar",
    "photographe moto Antananarivo",
    "photographie événementielle",
    "FR Signature Auto",
    "Faniry Raoilison",
    "shooting voiture",
    "contenu réseaux sociaux concession",
  ],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: brand.name,
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={archivo.variable} suppressHydrationWarning>
      <head>
        {/* Active les animations d'apparition uniquement si JavaScript est disponible */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
