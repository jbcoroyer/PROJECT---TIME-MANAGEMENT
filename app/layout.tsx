import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { Instrument_Sans, Instrument_Serif, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";
import AppProviders from "../components/AppProviders";
import GrainOverlay from "../components/GrainOverlay";
import SonnerToaster from "../components/SonnerToaster";
import { brandingToMetadata, brandingStyleVars, htmlLangFromBranding } from "../lib/branding";
import { getBrandingServer } from "../lib/server/getBrandingServer";

const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const splineSansMono = Spline_Sans_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getBrandingServer();
  return brandingToMetadata(branding);
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const branding = await getBrandingServer();

  return (
    <html lang={htmlLangFromBranding(branding.locale)}>
      <body
        className={`${instrumentSans.variable} ${instrumentSerif.variable} ${splineSansMono.variable} antialiased`}
        style={brandingStyleVars(branding.primaryColor)}
      >
        <GrainOverlay />
        <AppProviders>
          <SonnerToaster />
          {children}
        </AppProviders>
        <Analytics />
      </body>
    </html>
  );
}
