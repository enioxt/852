import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ClarityAnalytics from "@/components/ClarityAnalytics";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://852.egos.ia.br"),
  applicationName: "852 Inteligência",
  title: "852 Inteligência",
  description: "Canal de inteligência institucional para os 852 municípios de Minas Gerais",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/brand/logo-852.png",
    shortcut: "/brand/logo-852.png",
    apple: "/brand/logo-852.png",
  },
  openGraph: {
    title: "852 Inteligência",
    description: "Canal seguro e anônimo para mapear problemas estruturais nas delegacias de Minas Gerais.",
    url: "https://852.egos.ia.br",
    siteName: "852 Inteligência",
    images: [
      {
        url: "/brand/og-banner.png",
        width: 512,
        height: 512,
        alt: "852 Inteligência",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "852 Inteligência",
    description: "Canal seguro e anônimo para inteligência institucional da Polícia Civil.",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClarityAnalytics />
        {children}
      </body>
    </html>
  );
}
