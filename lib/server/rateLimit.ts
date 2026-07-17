import { NextResponse } from "next/server";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Fenêtre glissante en mémoire — efficace par instance, complémentaire à un WAF/CDN. */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now >= entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (entry.count >= limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
  }

  entry.count += 1;
  return { ok: true };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function rateLimitResponse(retryAfterSec: number): NextResponse {
  return NextResponse.json(
    { error: "Trop de requêtes. Réessayez plus tard." },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
  );
}

export const RATE_LIMIT_WINDOW_MS = 60_000;

/** Fenêtre pour les dépôts publics anonymes (~10 soumissions / heure / IP). */
export const PUBLIC_SUBMISSION_WINDOW_MS = 3_600_000;

export const PUBLIC_SUBMISSIONS_PER_HOUR = 10;

export function enforceRateLimit(
  request: Request,
  routeKey: string,
  limit: number,
  windowMs: number,
): NextResponse | null {
  const ip = getClientIp(request);
  const result = checkRateLimit(`${routeKey}:${ip}`, limit, windowMs);
  if (!result.ok) return rateLimitResponse(result.retryAfterSec);
  return null;
}

/** Limite standard par route API (60 req/min par IP). */
export function apiRateLimit(
  request: Request,
  routeKey: string,
  limit = 60,
): NextResponse | null {
  return enforceRateLimit(request, routeKey, limit, RATE_LIMIT_WINDOW_MS);
}

/**
 * Limite par utilisateur authentifié (fenêtre glissante en mémoire).
 * Même limite que `checkRateLimit` : compteur par instance serverless — sous charge
 * multi-instances le plafond effectif peut être plus élevé ; suffisant en best-effort.
 */
export function enforceUserRateLimit(
  userId: string,
  routeKey: string,
  limit: number,
  windowMs: number,
): NextResponse | null {
  const result = checkRateLimit(`${routeKey}:user:${userId}`, limit, windowMs);
  if (!result.ok) return rateLimitResponse(result.retryAfterSec);
  return null;
}

/** Limite standard par utilisateur sur une route API (20 req/min par défaut). */
export function apiUserRateLimit(
  userId: string,
  routeKey: string,
  limit = 20,
): NextResponse | null {
  return enforceUserRateLimit(userId, routeKey, limit, RATE_LIMIT_WINDOW_MS);
}

/**
 * Limite les dépôts publics par IP (fenêtre 1 h, compteur en mémoire par instance).
 * En serverless multi-instances le plafond effectif peut être plus élevé — best-effort.
 */
export function enforcePublicSubmissionRateLimit(
  ip: string,
  routeKey: string,
  limit = PUBLIC_SUBMISSIONS_PER_HOUR,
): NextResponse | null {
  const result = checkRateLimit(
    `${routeKey}:public:${ip}`,
    limit,
    PUBLIC_SUBMISSION_WINDOW_MS,
  );
  if (!result.ok) return rateLimitResponse(result.retryAfterSec);
  return null;
}

export function apiPublicSubmissionRateLimit(
  request: Request,
  routeKey: string,
  limit = PUBLIC_SUBMISSIONS_PER_HOUR,
): NextResponse | null {
  return enforcePublicSubmissionRateLimit(getClientIp(request), routeKey, limit);
}
