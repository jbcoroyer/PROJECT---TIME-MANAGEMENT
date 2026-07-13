import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { sendTransactionalEmail } from "../../../lib/server/email";

const EMAIL_OTP_TYPES: EmailOtpType[] = [
  "recovery",
  "signup",
  "invite",
  "magiclink",
  "email_change",
  "email",
];

async function sendWelcomeIfNeeded(
  supabase: ReturnType<typeof createServerClient>,
  type: string | null,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return;

  const isInvite = type === "invite" || user.user_metadata?.invited === true;
  if (!isInvite) return;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") || "http://localhost:3000";
  await sendTransactionalEmail({
    to: user.email,
    subject: "Bienvenue dans votre espace Workspace",
    html: `<p>Votre compte est prêt. <a href="${baseUrl}/setup">Accéder à l'espace</a></p>`,
  });
}

/**
 * Échange PKCE du lien email (recovery, etc.) côté serveur pour que les cookies
 * de session soient bien posés (évite les échecs silencieux côté client).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const nextRaw = searchParams.get("next") ?? "/login/reset-password";

  const nextPath = nextRaw.startsWith("/") ? nextRaw : `/${nextRaw}`;
  const loginWithError = (errorCode: string, description: string) => {
    const u = new URL("/login", origin);
    u.searchParams.set("error", "access_denied");
    u.searchParams.set("error_code", errorCode);
    u.searchParams.set("error_description", description);
    return NextResponse.redirect(u);
  };

  if (!code && !(tokenHash && type)) {
    return loginWithError("missing_code", "Lien invalide ou incomplet (code manquant).");
  }

  const response = NextResponse.redirect(new URL(nextPath, origin));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const expired =
        /expired|invalid|otp|already been used|consume/i.test(error.message);
      return loginWithError(
        expired ? "otp_expired" : "exchange_failed",
        expired
          ? "Ce lien a expiré ou a déjà été utilisé (parfois à cause d’un anti-virus ou de la prévisualisation du mail). Demandez un nouvel email ci-dessous."
          : error.message,
      );
    }
    await sendWelcomeIfNeeded(supabase, type);
    return response;
  }

  if (tokenHash && type) {
    if (!EMAIL_OTP_TYPES.includes(type as EmailOtpType)) {
      return loginWithError("invalid_type", "Type de lien non reconnu.");
    }
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    });
    if (error) {
      const expired = /expired|invalid|otp/i.test(error.message);
      return loginWithError(
        expired ? "otp_expired" : "verify_failed",
        expired
          ? "Ce lien a expiré ou a déjà été utilisé. Demandez un nouvel email de réinitialisation."
          : error.message,
      );
    }
    await sendWelcomeIfNeeded(supabase, type);
    return response;
  }

  return loginWithError("unknown", "Impossible de valider le lien.");
}
