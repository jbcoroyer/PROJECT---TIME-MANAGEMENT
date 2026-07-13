import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { IBM_Plex_Mono, IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import AppProviders from "../components/AppProviders";
import SonnerToaster from "../components/SonnerToaster";
import { brandingToMetadata, brandingStyleVars, htmlLangFromBranding } from "../lib/branding";
import { getBrandingServer } from "../lib/server/getBrandingServer";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["500"],
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
        className={`${ibmPlexSans.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable} antialiased`}
        style={brandingStyleVars(branding.primaryColor)}
      >
        <AppProviders>
          <SonnerToaster />
          {children}
        </AppProviders>
        <Analytics />
      </body>
    </html>
  );
}
