"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import OAuthButtons from "./OAuthButtons";
import AuthAtelierShell, { AuthMobileBrand, AuthTabLink } from "./AuthAtelierShell";
import { getOAuthCallbackOrigin } from "../../lib/publicAppUrl";
import { needsInviteProfileCompletion } from "../../lib/inviteOnboarding";
import { getSupabaseBrowser } from "../../lib/supabaseBrowser";
import { useBranding } from "../../lib/brandingContext";
import { useTranslation } from "../../lib/i18n/useTranslation";
import { TRIAL_DAYS } from "../../lib/billing/plans";

type AuthScreenProps = {
  cleanPath?: string;
};

export default function AuthScreen({ cleanPath = "/" }: AuthScreenProps) {
  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const { branding } = useBranding();
  const { t } = useTranslation();

  function translateAuthError(message: string): string {
    if (message.includes("Invalid login credentials")) return t("auth.invalidCredentials");
    if (message.includes("Email not confirmed")) return t("auth.emailNotConfirmed");
    if (message.includes("User already registered")) return t("auth.userExists");
    if (message.includes("Database error saving new user")) {
      return "Impossible de créer le compte (erreur base de données). Réessayez ou contactez le support si le problème persiste.";
    }
    if (message.includes("PKCE code verifier not found")) {
      return "La connexion a expiré ou a été lancée sur un autre onglet ou port. Réessayez depuis la même fenêtre (ex. localhost:3000).";
    }
    return message;
  }

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [urlAuthError, setUrlAuthError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("signup") === "confirm") {
      setSuccess(t("auth.accountCreated"));
      params.delete("signup");
      const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState(null, "", next);
      return;
    }
    const errorCode = params.get("error_code");
    const accessDenied = params.get("error");
    let desc = params.get("error_description");
    if (!errorCode && !accessDenied) return;
    if (desc) {
      try {
        desc = decodeURIComponent(desc);
      } catch {
        desc = desc.replace(/\+/g, " ");
      }
    }
    if (errorCode === "otp_expired" || accessDenied === "access_denied") {
      setUrlAuthError(desc || t("auth.linkExpired"));
    } else {
      setUrlAuthError(desc || t("auth.linkInvalid"));
    }
    window.history.replaceState(null, "", cleanPath);
  }, [cleanPath, t]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw signInError;
      if (needsInviteProfileCompletion(signInData.user)) {
        router.push("/invite/accept");
      } else {
        router.push("/");
      }
      router.refresh();
    } catch (err: unknown) {
      setError(translateAuthError(err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const targetEmail = email.trim();
    if (!targetEmail) {
      setError(t("auth.emailForReset"));
      return;
    }
    setError(null);
    setSuccess(null);
    setSendingReset(true);
    try {
      const configuredBaseUrl = getOAuthCallbackOrigin();
      if (!configuredBaseUrl) {
        setError(t("auth.appUrlMissing"));
        return;
      }
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: `${configuredBaseUrl}/auth/callback`,
      });
      if (resetError) throw resetError;
      setSuccess(t("auth.resetSent"));
    } catch (err: unknown) {
      setError(translateAuthError(err instanceof Error ? err.message : String(err)));
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <AuthAtelierShell
      heading={
        <>
          Bon retour<em className="text-[var(--accent)] italic">.</em>
        </>
      }
      subtitle={t("auth.signInToWorkspace", { app: branding.appName })}
    >
      <AuthMobileBrand />

      {urlAuthError ? (
        <div className="ui-alert ui-alert-warning mt-6 rounded-xl px-3 py-2.5 text-sm">
          {urlAuthError}
        </div>
      ) : null}

      <div className="auth-atelier__tabs mt-8">
        <AuthTabLink href="/login" active>
          {t("auth.signInTab")}
        </AuthTabLink>
        <AuthTabLink href="/signup">{t("auth.signUpTab")}</AuthTabLink>
      </div>

      <form onSubmit={(e) => void handleSignIn(e)} className="mt-7 flex flex-col gap-5">
        <Field
          id="email"
          label={t("auth.email")}
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          placeholder="vous@example.com"
        />
        <PasswordField
          id="signin-password"
          label={t("auth.password")}
          value={password}
          onChange={setPassword}
          show={showPassword}
          onToggleShow={() => setShowPassword((v) => !v)}
          autoComplete="current-password"
          onForgot={() => void handleForgotPassword()}
          forgotLabel={sendingReset ? t("auth.sendingReset") : t("auth.forgotPassword")}
          forgotDisabled={sendingReset || loading}
        />
        <AlertBox error={error} success={success} />
        <SubmitBtn
          loading={loading}
          loadingLabel={t("auth.signingIn")}
          label={t("auth.signInButton")}
        />
      </form>

      <OAuthButtons nextPath="/setup" />

      <p className="mt-3 text-center text-[12px] leading-relaxed text-[var(--ink-muted)]">
        Pas encore de compte ? Google créera automatiquement votre espace et vous mènera à
        l&apos;installation.
      </p>

      <p className="mt-5 text-center text-[13.5px] text-[var(--ink-muted)]">
        Préférez le formulaire ?{" "}
        <Link href="/signup" className="font-semibold text-[var(--ink)] border-b border-[var(--accent)] hover:text-[var(--accent)]">
          Essai gratuit {TRIAL_DAYS} jours
        </Link>
      </p>
    </AuthAtelierShell>
  );
}

export function AuthLoadingShell() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <div className="h-12 w-12 animate-pulse rounded-2xl bg-[var(--line)]/60" />
    </div>
  );
}

function Field(props: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={props.id} className="auth-atelier__field-label">
        {props.label}
      </label>
      <input
        id={props.id}
        type={props.type}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        autoComplete={props.autoComplete}
        placeholder={props.placeholder}
        className="auth-atelier__input"
      />
    </div>
  );
}

function PasswordField(props: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  autoComplete?: string;
  onForgot: () => void;
  forgotLabel: string;
  forgotDisabled?: boolean;
}) {
  return (
    <div>
      <label htmlFor={props.id} className="auth-atelier__field-label">
        {props.label}
      </label>
      <div className="relative">
        <input
          id={props.id}
          type={props.show ? "text" : "password"}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          autoComplete={props.autoComplete}
          placeholder="••••••••"
          className="auth-atelier__input pr-11"
        />
        <button
          type="button"
          onClick={props.onToggleShow}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[rgba(26,22,17,0.35)] hover:text-[rgba(26,22,17,0.6)]"
          aria-label={props.show ? "Masquer" : "Afficher"}
        >
          {props.show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={props.onForgot}
          disabled={props.forgotDisabled}
          className="text-[13px] font-medium text-[var(--ink-muted)] border-b border-[rgba(26,22,17,0.2)] hover:text-[var(--accent)] hover:border-[var(--accent)] disabled:opacity-50"
        >
          {props.forgotLabel}
        </button>
      </div>
    </div>
  );
}

function AlertBox(props: { error?: string | null; success?: string | null }) {
  if (props.error) {
    return <div className="ui-alert ui-alert-danger rounded-xl px-3 py-2 text-sm">{props.error}</div>;
  }
  if (props.success) {
    return <div className="ui-alert ui-alert-success rounded-xl px-3 py-2 text-sm">{props.success}</div>;
  }
  return null;
}

function SubmitBtn(props: { loading: boolean; label: string; loadingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={props.loading}
      className="mkt-cta-primary w-full py-[15px] text-[15.5px] disabled:opacity-60"
    >
      {props.loading ? props.loadingLabel : props.label}{" "}
      {!props.loading ? <span className="font-[family-name:var(--font-mono)]">→</span> : null}
    </button>
  );
}
