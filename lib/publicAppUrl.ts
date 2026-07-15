/** Origine pour liens auth navigateur (OAuth, reset, confirmation email). */
export function getOAuthCallbackOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin.replace(/\/+$/, "");
  }
  return getPublicAppOrigin();
}

/**
 * URL publique stable (emails serveur, webhooks).
 * En navigateur, préfère l'origine courante pour que le PKCE reste sur le même port.
 */
export function getPublicAppOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin.replace(/\/+$/, "");
  }
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");
  if (fromEnv) return fromEnv;
  return "";
}
