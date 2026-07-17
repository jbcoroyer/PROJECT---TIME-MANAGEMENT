import { type NextRequest, NextResponse } from "next/server";
import { requirePlanFeature } from "../../../../lib/server/apiAuth";
import { apiRateLimit } from "../../../../lib/server/rateLimit";
import { createSupabaseAdmin } from "../../../../lib/server/supabaseAdmin";
import { exchangeCodeForTokens, fetchGraphUser } from "../../../../lib/server/microsoftGraph";
import { getOutlookRedirectUri } from "../../../../lib/server/outlookRedirect";
import { encryptToken } from "../../../../lib/server/tokenCrypto";

/** Étape 2 du flux OAuth : Microsoft renvoie un code, on l'échange contre des jetons. */
export async function GET(request: NextRequest) {
  const limited = apiRateLimit(request, "api/outlook/callback", 30);
  if (limited) return limited;

  const { searchParams, origin } = new URL(request.url);
  const settings = (status: string) => new URL(`/settings?outlook=${status}`, origin);

  const error = searchParams.get("error");
  if (error) {
    return NextResponse.redirect(settings("error"));
  }

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const expectedState = request.cookies.get("ms_oauth_state")?.value;
  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(settings("state_mismatch"));
  }

  const planCheck = await requirePlanFeature("outlook_sync");
  if (planCheck instanceof NextResponse) {
    return NextResponse.redirect(new URL("/settings?upgrade=pro", origin));
  }

  const { ctx } = planCheck;

  try {
    const redirectUri = getOutlookRedirectUri(request.url);
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    const graphUser = await fetchGraphUser(tokens.access_token);

    let encryptedAccess: string;
    let encryptedRefresh: string;
    try {
      encryptedAccess = encryptToken(tokens.access_token);
      encryptedRefresh = encryptToken(tokens.refresh_token ?? "");
    } catch (e) {
      console.error(
        "[Outlook] OAuth callback : impossible de chiffrer les jetons — OUTLOOK_TOKEN_ENCRYPTION_KEY manquante ou invalide.",
        e,
      );
      return NextResponse.redirect(settings("error"));
    }

    const admin = createSupabaseAdmin();
    await admin.from("outlook_connections").upsert(
      {
        user_id: ctx.userId,
        ms_user_id: graphUser.id,
        account_email: graphUser.mail ?? graphUser.userPrincipalName ?? null,
        access_token: encryptedAccess,
        refresh_token: encryptedRefresh,
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        scope: tokens.scope ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    const response = NextResponse.redirect(settings("connected"));
    response.cookies.delete("ms_oauth_state");
    return response;
  } catch (e) {
    console.error("Outlook OAuth callback error", e);
    return NextResponse.redirect(settings("error"));
  }
}
