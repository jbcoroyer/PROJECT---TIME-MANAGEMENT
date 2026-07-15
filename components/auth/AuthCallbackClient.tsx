"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { completeAuthSession } from "../../app/actions/completeAuthSession";
import { clearOAuthNextPath, readOAuthNextPath } from "../../lib/auth/oauthNextCookie";
import { getSupabaseBrowser } from "../../lib/supabaseBrowser";

const EMAIL_OTP_TYPES: EmailOtpType[] = [
  "recovery",
  "signup",
  "invite",
  "magiclink",
  "email_change",
  "email",
];

function loginErrorUrl(code: string, description: string) {
  const u = new URL("/login", window.location.origin);
  u.searchParams.set("error", "access_denied");
  u.searchParams.set("error_code", code);
  u.searchParams.set("error_description", description);
  return u.pathname + u.search;
}

function resolveNextPath(type: string | null): string {
  const fromQuery = new URLSearchParams(window.location.search).get("next");
  if (fromQuery?.startsWith("/")) return fromQuery;
  if (type === "invite") return "/invite/accept";
  if (type === "recovery") return "/login/reset-password";
  return readOAuthNextPath("/dashboard");
}

export default function AuthCallbackClient() {
  const router = useRouter();
  const [message, setMessage] = useState("Connexion en cours…");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const supabase = getSupabaseBrowser();
      const search = new URLSearchParams(window.location.search);
      const type = search.get("type");

      const oauthError = search.get("error");
      const oauthErrorDescription = search.get("error_description");
      if (oauthError) {
        router.replace(
          loginErrorUrl(
            oauthError,
            oauthErrorDescription?.replace(/\+/g, " ") ?? "Connexion Google refusée ou annulée.",
          ),
        );
        return;
      }

      const nextPath = resolveNextPath(type);

      const hash = window.location.hash.replace(/^#/, "");
      if (hash) {
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const hashType = hashParams.get("type") ?? type;

        if (accessToken && refreshToken) {
          setMessage("Finalisation de la session…");
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (cancelled) return;
          if (error) {
            router.replace(loginErrorUrl("hash_session_failed", error.message));
            return;
          }
          window.history.replaceState(null, "", window.location.pathname);
          clearOAuthNextPath();
          await completeAuthSession(hashType);
          router.replace(resolveNextPath(hashType));
          router.refresh();
          return;
        }
      }

      const code = search.get("code");
      if (code) {
        setMessage("Échange du code de connexion…");
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (error) {
          const expired = /expired|invalid|otp|already been used|consume|pkce/i.test(error.message);
          router.replace(
            loginErrorUrl(
              expired ? "otp_expired" : "exchange_failed",
              expired
                ? "Ce lien a expiré ou a déjà été utilisé. Relancez la connexion Google."
                : error.message,
            ),
          );
          return;
        }
        clearOAuthNextPath();
        await completeAuthSession(type);
        router.replace(nextPath);
        router.refresh();
        return;
      }

      const tokenHash = search.get("token_hash");
      if (tokenHash && type && EMAIL_OTP_TYPES.includes(type as EmailOtpType)) {
        setMessage("Validation du lien…");
        const { error } = await supabase.auth.verifyOtp({
          type: type as EmailOtpType,
          token_hash: tokenHash,
        });
        if (cancelled) return;
        if (error) {
          const expired = /expired|invalid|otp/i.test(error.message);
          router.replace(
            loginErrorUrl(
              expired ? "otp_expired" : "verify_failed",
              expired
                ? "Ce lien a expiré ou a déjà été utilisé. Demandez un nouvel email."
                : error.message,
            ),
          );
          return;
        }
        clearOAuthNextPath();
        await completeAuthSession(type);
        router.replace(nextPath);
        router.refresh();
        return;
      }

      router.replace(
        loginErrorUrl(
          "missing_code",
          "Lien invalide ou incomplet (code manquant). Vérifiez l'URL de redirection dans Supabase (wildcard /**).",
        ),
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--background)] px-6 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--brand-primary)]" />
      <p className="text-sm text-[color:var(--foreground)]/65">{message}</p>
    </div>
  );
}
