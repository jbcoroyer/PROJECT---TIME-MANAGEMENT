import { NextResponse } from "next/server";

/** Vérifie le secret pour les appels internes (cron Vercel, webhooks maison). */
export function verifyInternalApiSecret(request: Request): boolean {
  const secret =
    process.env.INTERNAL_API_SECRET?.trim() || process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const header =
    request.headers.get("x-internal-secret")?.trim() ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();

  return header === secret;
}

export function internalApiUnauthorized(): NextResponse {
  return NextResponse.json({ error: "Secret interne invalide." }, { status: 401 });
}
