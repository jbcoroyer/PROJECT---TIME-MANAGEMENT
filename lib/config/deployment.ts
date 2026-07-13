/** URLs et identifiants de déploiement — source unique pour la doc et les fallbacks UI. */
export const PRODUCTION_APP_URL = "https://project-time-management.vercel.app";

export const SUPABASE_PROJECT_REF = "tjzagxyvjnkbwfpsppqw";

export const SUPABASE_AUTH_CALLBACK_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co/auth/v1/callback`;

export const GITHUB_REPO_URL = "https://github.com/jbcoroyer/PROJECT---TIME-MANAGEMENT";

export const VERCEL_PROJECT_URL = PRODUCTION_APP_URL;

export function appAuthCallbackUrl(baseUrl: string = PRODUCTION_APP_URL): string {
  return `${baseUrl.replace(/\/+$/, "")}/auth/callback`;
}

export function outlookCallbackUrl(baseUrl: string = PRODUCTION_APP_URL): string {
  return `${baseUrl.replace(/\/+$/, "")}/api/outlook/callback`;
}

export function stripeWebhookUrl(baseUrl: string = PRODUCTION_APP_URL): string {
  return `${baseUrl.replace(/\/+$/, "")}/api/webhooks/stripe`;
}
