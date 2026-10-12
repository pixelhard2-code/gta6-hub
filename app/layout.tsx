import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/app/components/ClientLayout";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  themeColor: "#0d0d12",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://gta6hub.vercel.app"),
  title: {
    default: "LeonidaCrew | La Crew y Punto de Encuentro de GTA VI",
    template: "%s | LeonidaCrew",
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
  authors: [{ name: "LeonidaCrew" }],
  creator: "LeonidaCrew",
  publisher: "LeonidaCrew",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "LeonidaCrew — La espera de GTA VI también se juega",
    description:
      "Únete a la crew de GTA VI: comparte teorías, sigue las novedades oficiales de Rockstar Games y participa por una PS5 + GTA VI.",
    url: "https://gta6hub.vercel.app",
    siteName: "LeonidaCrew",
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
    title: "LeonidaCrew — La Crew de GTA VI",
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
    <html lang="es" className={fontSans.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body
        suppressHydrationWarning
        className={`${fontSans.className} antialiased bg-[#0c0d14] text-[#f8fafc] min-h-screen relative selection:bg-pink-500 selection:text-white`}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
