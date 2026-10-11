import type { Metadata, Viewport } from "next";
import "./globals.css";
import ClientLayout from "@/app/components/ClientLayout";

export const viewport: Viewport = {
  themeColor: "#0d0d12",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://gta6hub.vercel.app"),
  title: {
    default: "GTA6HUB | La Crew y Punto de Encuentro de GTA VI",
    template: "%s | GTA6HUB",
  },
  description:
    "Comunidad hispanohablante de fans de Grand Theft Auto VI. Cuenta regresiva al lanzamiento, novedades y tráilers oficiales, muro social de la crew y sorteo de PS5 + GTA VI.",
  keywords: [
    "GTA 6",
    "GTA VI",
    "Grand Theft Auto VI",
    "Vice City",
    "Leonida",
    "Rockstar Games",
    "Jason y Lucia",
    "PS5",
    "Sorteo GTA 6",
    "Comunidad GTA VI",
    "Tráiler GTA VI",
  ],
  authors: [{ name: "GTA6HUB Crew" }],
  creator: "GTA6HUB",
  publisher: "GTA6HUB",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "GTA6HUB — La espera de GTA VI también se juega",
    description:
      "Únete a la crew de GTA VI: comparte teorías, sigue las novedades oficiales de Rockstar Games y participa por una PS5 + GTA VI.",
    url: "https://gta6hub.vercel.app",
    siteName: "GTA6HUB",
    images: [
      {
        url: "/gta6-cover.jpg",
        width: 1200,
        height: 675,
        alt: "Arte oficial de GTA VI con Jason y Lucia en Vice City",
      },
    ],
    locale: "es_LA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GTA6HUB — La Crew de GTA VI",
    description:
      "Muro comunitario, novedades oficiales de Rockstar Games, cuenta regresiva y sorteo de PS5 para los fans de GTA VI.",
    images: ["/gta6-cover.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="antialiased bg-[#0d0d12] text-white min-h-screen pb-20 md:pb-0 relative"
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
