import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ClarityAnalytics from "@/components/ClarityAnalytics";
import HotTopicsMarquee from "@/components/HotTopicsMarquee";
import LgpdBanner from "@/components/LgpdBanner";
import MobileNav from "@/components/MobileNav";
import SiteHeader from "@/components/SiteHeader";
import AccessibilityFAB from "@/components/AccessibilityFAB";
import type { Viewport } from "next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://852.egos.ia.br"),
  applicationName: "Tira-Voz",
  title: "Tira-Voz: o radar da base",
  description: "Canal seguro e anônimo para policiais civis de Minas Gerais. Sua voz já existe, e aqui ela chega onde precisa chegar.",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/brand/logo-852.png",
    shortcut: "/brand/logo-852.png",
    apple: "/brand/logo-852.png",
  },
  openGraph: {
    title: "Tira-Voz: o radar da base",
    description: "Canal seguro e anônimo para policiais civis de Minas Gerais. Sua voz já existe, e aqui ela chega onde precisa chegar.",
    url: "https://852.egos.ia.br",
    siteName: "Tira-Voz",
    images: [
      {
        url: "/brand/og-banner.png",
        width: 1200,
        height: 630,
        alt: "Tira-Voz: o radar da base",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tira-Voz: o radar da base",
    description: "Canal seguro e anônimo para policiais civis de Minas Gerais. Sua voz já existe.",
    images: ["/brand/og-banner.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col antialiased`}
      >
        <ClarityAnalytics />
        <SiteHeader />
        <HotTopicsMarquee />
        <div className="flex flex-1 flex-col min-h-0">
          {children}
        </div>
        <LgpdBanner />
        <AccessibilityFAB />
        <MobileNav />
      </body>
    </html>
  );
}
