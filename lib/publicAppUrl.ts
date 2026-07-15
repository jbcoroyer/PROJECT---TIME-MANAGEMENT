/**
 * URL publique stable (emails, liens serveur).
 * Sur Vercel, next.config.ts utilise le domaine de production stable.
 */
export function getPublicAppOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") {
    return window.location.origin.replace(/\/+$/, "");
  }
  return "";
}

/** Origine pour OAuth navigateur — doit correspondre aux cookies PKCE (même domaine). */
export function getOAuthCallbackOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin.replace(/\/+$/, "");
  }
  return getPublicAppOrigin();
}
