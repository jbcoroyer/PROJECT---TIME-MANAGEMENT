import type { NextConfig } from "next";

/**
 * CSP mode switch — change ONE line to revert safely:
 * - true  → Content-Security-Policy (enforcing, blocks violations)
 * - false → Content-Security-Policy-Report-Only (observe only)
 *
 * Test in Vercel Preview before Production.
 */
const CSP_ENFORCE = true;

/** Sur Vercel, utilise le domaine de production stable (pas l'URL de preview éphémère). */
const publicAppUrl =
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/^https?:\/\//, "")}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`
      : "");

/** Hostname Supabase Storage de production (NEXT_PUBLIC_SUPABASE_URL). */
const supabaseHostname = (() => {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return null;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  env: {
    ...(publicAppUrl ? { NEXT_PUBLIC_APP_URL: publicAppUrl } : {}),
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Buckets publics Supabase Storage — autoriser /storage/v1/object/public/...
      ...(supabaseHostname
        ? ([
            {
              protocol: "https" as const,
              hostname: supabaseHostname,
              pathname: "/storage/v1/object/public/**",
            },
          ])
        : []),
      // Fallback large (au cas où NEXT_PUBLIC_SUPABASE_URL ne soit pas défini au build)
      {
        protocol: "https" as const,
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "recharts",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
      "framer-motion",
    ],
  },
  async redirects() {
    return [
      { source: "/v2", destination: "/dashboard/kanban", permanent: true },
      { source: "/v2/:path*", destination: "/:path*", permanent: true },
      // Protège la marque en redirigeant les anciens domaines .fr vers le domaine principal .com
      {
        source: "/:path*",
        has: [{ type: "host", value: "regiepilot.fr" }],
        destination: "https://regiepilot.com/:path*",
        statusCode: 301,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.regiepilot.fr" }],
        destination: "https://regiepilot.com/:path*",
        statusCode: 301,
      },
    ];
  },
  async headers() {
    const supabaseConnect = supabaseHostname
      ? `https://${supabaseHostname} wss://${supabaseHostname}`
      : "https://*.supabase.co wss://*.supabase.co";

    // Domaines réellement utilisés : Supabase (+ realtime), OpenRouter, Microsoft Graph/login,
    // Vercel Analytics/Insights, Sentry, self, data:/blob: pour images uploadées.
    const contentSecurityPolicy = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co https:",
      "font-src 'self' data:",
      "media-src 'self' blob: data:",
      "worker-src 'self' blob:",
      [
        "connect-src 'self'",
        supabaseConnect,
        "https://openrouter.ai",
        "https://graph.microsoft.com",
        "https://login.microsoftonline.com",
        "https://vitals.vercel-insights.com",
        "https://va.vercel-scripts.com",
        "https://*.sentry.io",
        "https://*.ingest.sentry.io",
        "https://*.ingest.de.sentry.io",
      ].join(" "),
      "frame-ancestors 'none'",
      "frame-src 'self' https://login.microsoftonline.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://login.microsoftonline.com",
    ].join("; ");

    const cspHeaderKey = CSP_ENFORCE
      ? "Content-Security-Policy"
      : "Content-Security-Policy-Report-Only";

    const securityHeaders = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      {
        key: cspHeaderKey,
        value: contentSecurityPolicy,
      },
    ];

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
