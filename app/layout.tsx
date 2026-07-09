import type { Metadata } from "next";
import { Inter, Schibsted_Grotesk } from "next/font/google";
import "./globals.css";
import AppProviders from "../components/AppProviders";
import SonnerToaster from "../components/SonnerToaster";
import { brandingToMetadata, htmlLangFromBranding } from "../lib/branding";
import { getBrandingServer } from "../lib/server/getBrandingServer";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const schibsted = Schibsted_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
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
        className={`${inter.variable} ${schibsted.variable} antialiased`}
        style={{ ["--brand-primary" as string]: branding.primaryColor }}
      >
        <AppProviders>
          <SonnerToaster />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
