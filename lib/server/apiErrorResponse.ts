import { NextResponse } from "next/server";

/** Message générique renvoyé au client pour les erreurs serveur internes. */
export const GENERIC_SERVER_ERROR_MESSAGE =
  "Une erreur interne est survenue. Veuillez réessayer plus tard.";

export function logApiError(scope: string, error: unknown): void {
  if (error instanceof Error) {
    console.error(`[${scope}]`, error.message, error.stack);
    return;
  }
  console.error(`[${scope}]`, error);
}

export function jsonServerError(scope: string, error: unknown, status = 500): NextResponse {
  logApiError(scope, error);
  return NextResponse.json({ error: GENERIC_SERVER_ERROR_MESSAGE }, { status });
}
