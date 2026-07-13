import { randomBytes } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { requirePlanFeature } from "../../../../lib/server/apiAuth";
import { apiRateLimit } from "../../../../lib/server/rateLimit";
import { buildAuthorizeUrl, isMicrosoftConfigured } from "../../../../lib/server/microsoftGraph";
import { getOutlookRedirectUri } from "../../../../lib/server/outlookRedirect";
import { getStableOAuthOrigin } from "../../../../lib/server/publicAppOrigin";

/** Étape 1 du flux OAuth : redirige l'utilisateur vers la page de connexion Microsoft. */
export async function GET(request: NextRequest) {
  const limited = apiRateLimit(request, "api/outlook/connect", 30);
  if (limited) return limited;

  const { origin } = new URL(request.url);
  const oauthOrigin = getStableOAuthOrigin(request.url);

  // Sur une preview Vercel, forcer le flux OAuth via le domaine de production
  // (cookie d'état + redirect_uri Azure doivent être sur la même origine stable).
  if (oauthOrigin && oauthOrigin !== origin.replace(/\/+$/, "")) {
    return NextResponse.redirect(new URL("/api/outlook/connect", oauthOrigin));
  }

  if (!isMicrosoftConfigured()) {
    return NextResponse.redirect(new URL("/settings?outlook=not_configured", origin));
  }

  const planCheck = await requirePlanFeature("outlook_sync");
  if (planCheck instanceof NextResponse) {
    return NextResponse.redirect(new URL("/settings?upgrade=pro", origin));
  }

  const state = randomBytes(16).toString("hex");
  const redirectUri = getOutlookRedirectUri(request.url);
  const authorizeUrl = buildAuthorizeUrl(redirectUri, state);

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set("ms_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return response;
}
