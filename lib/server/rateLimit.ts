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
