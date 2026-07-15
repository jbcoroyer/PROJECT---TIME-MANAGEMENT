import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { completeAuthSession, resolvePostAuthRedirect } from "../../../app/actions/completeAuthSession";
import {
  clearOAuthNextPathOnResponse,
  readOAuthNextPathFromCookieStore,
} from "../../../lib/auth/oauthNextCookie";

const EMAIL_OTP_TYPES: EmailOtpType[] = [
  "recovery",
  "signup",
  "invite",
  "magiclink",
  "email_change",
  "email",
];

function loginErrorRedirect(origin: string, code: string, description: string) {
  const url = new URL("/login", origin);
  url.searchParams.set("error", "access_denied");
  url.searchParams.set("error_code", code);
  url.searchParams.set("error_description", description);
  return NextResponse.redirect(url);
}

function resolveFallbackPath(
  request: NextRequest,
  type: string | null,
  cookieStore: Awaited<ReturnType<typeof cookies>>,
): string {
  const fromQuery = request.nextUrl.searchParams.get("next");
  if (fromQuery?.startsWith("/")) return fromQuery;
  if (type === "invite") return "/invite/accept";
  if (type === "recovery") return "/login/reset-password";
  return readOAuthNextPathFromCookieStore(cookieStore, "/setup");
}

function isExpiredExchangeError(message: string): boolean {
  return /expired|invalid|otp|already been used|consume|pkce/i.test(message);
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const type = searchParams.get("type");

  const oauthError = searchParams.get("error");
  const oauthErrorDescription = searchParams.get("error_description");
  if (oauthError) {
    return loginErrorRedirect(
      origin,
      oauthError,
      oauthErrorDescription?.replace(/\+/g, " ") ?? "Connexion Google refusée ou annulée.",
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );

  const fallbackPath = resolveFallbackPath(request, type, cookieStore);

  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await completeAuthSession(type);
        const redirectPath =
          type === "recovery"
            ? "/login/reset-password"
            : await resolvePostAuthRedirect(fallbackPath);
        const response = NextResponse.redirect(`${origin}${redirectPath}`);
        clearOAuthNextPathOnResponse(response);
        return response;
      }

      return loginErrorRedirect(
        origin,
        isExpiredExchangeError(error.message) ? "otp_expired" : "exchange_failed",
        isExpiredExchangeError(error.message)
          ? "Ce lien a expiré ou a déjà été utilisé. Relancez la connexion Google."
          : error.message,
      );
    }

    await completeAuthSession(type);
    const redirectPath =
      type === "recovery" ? "/login/reset-password" : await resolvePostAuthRedirect(fallbackPath);
    const response = NextResponse.redirect(`${origin}${redirectPath}`);
    clearOAuthNextPathOnResponse(response);
    return response;
  }

  const tokenHash = searchParams.get("token_hash");
  if (tokenHash && type && EMAIL_OTP_TYPES.includes(type as EmailOtpType)) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    });
    if (error) {
      return loginErrorRedirect(
        origin,
        isExpiredExchangeError(error.message) ? "otp_expired" : "verify_failed",
        isExpiredExchangeError(error.message)
          ? "Ce lien a expiré ou a déjà été utilisé. Demandez un nouvel email."
          : error.message,
      );
    }

    await completeAuthSession(type);
    const redirectPath =
      type === "recovery" ? "/login/reset-password" : await resolvePostAuthRedirect(fallbackPath);
    const response = NextResponse.redirect(`${origin}${redirectPath}`);
    clearOAuthNextPathOnResponse(response);
    return response;
  }

  return loginErrorRedirect(
    origin,
    "missing_code",
    "Lien invalide ou incomplet (code manquant). Relancez la connexion Google depuis la page de connexion.",
  );
}
