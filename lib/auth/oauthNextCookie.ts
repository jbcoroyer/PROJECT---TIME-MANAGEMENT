export const OAUTH_NEXT_COOKIE = "auth_oauth_next";
const COOKIE_NAME = OAUTH_NEXT_COOKIE;
const MAX_AGE_SECONDS = 600;

/** Stocke la destination post-login avant OAuth (évite ?next= dans redirectTo Supabase). */
export function setOAuthNextPath(path: string) {
  if (typeof document === "undefined") return;
  const safe = path.startsWith("/") ? path : `/${path}`;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(safe)}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

function decodeOAuthNextPath(raw: string | undefined, fallback: string): string {
  if (!raw) return fallback;
  try {
    const decoded = decodeURIComponent(raw);
    return decoded.startsWith("/") ? decoded : fallback;
  } catch {
    return fallback;
  }
}

type CookieReader = { get: (name: string) => { value: string } | undefined };

export function readOAuthNextPathFromCookieStore(
  cookieStore: CookieReader,
  fallback = "/setup",
): string {
  return decodeOAuthNextPath(cookieStore.get(COOKIE_NAME)?.value, fallback);
}

export function readOAuthNextPathFromCookies(fallback = "/dashboard"): string {
  if (typeof document !== "undefined") {
    const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
    return decodeOAuthNextPath(match?.[1], fallback);
  }
  return fallback;
}

/** Lecture côté serveur (Route Handler / middleware). */
export function readOAuthNextPathFromRequest(
  request: { cookies: CookieReader },
  fallback = "/setup",
): string {
  return readOAuthNextPathFromCookieStore(request.cookies, fallback);
}

export function readOAuthNextPath(fallback = "/dashboard"): string {
  return readOAuthNextPathFromCookies(fallback);
}

export function clearOAuthNextPath() {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function clearOAuthNextPathOnResponse(response: { cookies: { set: (name: string, value: string, options?: { path?: string; maxAge?: number }) => void } }) {
  response.cookies.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

