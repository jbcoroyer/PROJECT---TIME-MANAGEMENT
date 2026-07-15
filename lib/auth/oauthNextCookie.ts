const COOKIE_NAME = "auth_oauth_next";
const MAX_AGE_SECONDS = 600;

/** Stocke la destination post-login avant OAuth (évite ?next= dans redirectTo Supabase). */
export function setOAuthNextPath(path: string) {
  if (typeof document === "undefined") return;
  const safe = path.startsWith("/") ? path : `/${path}`;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(safe)}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

export function readOAuthNextPath(fallback = "/dashboard"): string {
  if (typeof document === "undefined") return fallback;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  if (!match?.[1]) return fallback;
  try {
    const decoded = decodeURIComponent(match[1]);
    return decoded.startsWith("/") ? decoded : fallback;
  } catch {
    return fallback;
  }
}

export function clearOAuthNextPath() {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}
