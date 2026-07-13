"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { AppMark, AppWordmark } from "../AppBrand";
import OAuthButtons from "./OAuthButtons";
import { getPublicAppOrigin } from "../../lib/publicAppUrl";
import { getSupabaseBrowser } from "../../lib/supabaseBrowser";
import { useBranding } from "../../lib/brandingContext";
import { useTranslation } from "../../lib/i18n/useTranslation";

type AuthScreenProps = {
  /** Chemin nettoyé après erreur OAuth dans l'URL (ex. `/` ou `/login`). */
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
    if (message.includes("Password should be at least")) return t("auth.passwordTooShort");
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
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw signInError;
      router.push("/");
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
      const configuredBaseUrl = getPublicAppOrigin();
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--background)] px-5 py-12">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="ui-hero-halo ui-hero-halo--orange left-1/2 top-[-10rem] h-[32.5rem] w-[40rem] -translate-x-1/2" />
        <div className="ui-hero-dots" />
      </div>

      <div className="relative z-10 w-full max-w-[392px]">
        <header className="mb-8 text-center">
          <div className="mb-5 flex justify-center">
            <AppMark className="h-11 w-11 rounded-xl" />
          </div>
          <AppWordmark size="compact" />
          {branding.tagline.trim() ? (
            <p className="mt-2 text-[13.5px] text-[var(--ink-muted)]">{branding.tagline}</p>
          ) : null}
          <p className="mt-4 text-[13.5px] text-[var(--ink-muted)]">
            {t("auth.signInToWorkspace", { app: branding.appName })}
          </p>
        </header>

        <div className="rounded-[20px] border border-[var(--line)] bg-[var(--surface)] p-[26px] shadow-[0_12px_32px_rgba(23,20,15,0.06)]">
          {urlAuthError ? (
            <div className="ui-alert ui-alert-warning mb-4 rounded-xl px-3 py-2.5 text-sm">
              {urlAuthError}
            </div>
          ) : null}

          <div className="mb-[22px] flex rounded-xl bg-[var(--surface-soft)] p-1">
            <button
              type="button"
              className="flex-1 rounded-[9px] bg-[var(--surface)] py-2.5 text-[13.5px] font-semibold text-[var(--ink)] shadow-[0_1px_3px_rgba(23,20,15,0.08)]"
            >
              {t("auth.signInTab")}
            </button>
            <Link
              href="/signup"
              className="flex flex-1 items-center justify-center rounded-[9px] py-2.5 text-[13.5px] font-medium text-[var(--ink-muted)] transition hover:text-[var(--ink)]"
            >
              {t("auth.signUpTab")}
            </Link>
          </div>

          <form onSubmit={(e) => void handleSignIn(e)} className="space-y-3.5">
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
            />
            <div className="-mt-1 flex justify-end">
              <button
                type="button"
                onClick={() => void handleForgotPassword()}
                disabled={sendingReset || loading}
                className="text-xs font-medium text-[var(--ink-muted)] transition hover:text-[var(--ink)] disabled:opacity-50"
              >
                {sendingReset ? t("auth.sendingReset") : t("auth.forgotPassword")}
              </button>
            </div>
            <AlertBox error={error} success={success} />
            <SubmitBtn
              loading={loading}
              loadingLabel={t("auth.signingIn")}
              label={t("auth.signInButton")}
            />
          </form>
          <OAuthButtons nextPath="/dashboard" />
        </div>

        <p className="mt-6 text-center text-[12.5px] text-[var(--ink-muted)]">
          <Link href="/signup" className="font-semibold text-[var(--ink)] hover:underline">
            {t("auth.signUp")}
          </Link>
          <span className="mx-2">·</span>
          <Link href="/pricing" className="font-semibold text-[var(--ink)] hover:underline">
            Tarifs
          </Link>
        </p>
      </div>
    </div>
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
      <label htmlFor={props.id} className="mb-1.5 block text-[13px] font-semibold text-[var(--ink)]">
        {props.label}
      </label>
      <input
        id={props.id}
        type={props.type}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        autoComplete={props.autoComplete}
        placeholder={props.placeholder}
        className="ui-focus-ring w-full rounded-[11px] border border-[var(--line)] bg-[#faf8f4] px-3 py-2.5 text-[13.5px] text-[var(--ink)] placeholder:text-[color-mix(in_srgb,var(--ink)_32%,transparent)] focus:border-[var(--line-strong)] focus:outline-none"
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
}) {
  return (
    <div>
      <label htmlFor={props.id} className="mb-1.5 block text-[13px] font-semibold text-[var(--ink)]">
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
          className="ui-focus-ring w-full rounded-[11px] border border-[var(--line)] bg-[#faf8f4] px-3 py-2.5 pr-10 text-[13.5px] text-[var(--ink)] placeholder:text-[color-mix(in_srgb,var(--ink)_32%,transparent)] focus:border-[var(--line-strong)] focus:outline-none"
        />
        <button
          type="button"
          onClick={props.onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--foreground)]/35 hover:text-[color:var(--foreground)]/60"
          aria-label={props.show ? "Masquer" : "Afficher"}
        >
          {props.show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function AlertBox(props: { error?: string | null; success?: string | null }) {
  if (props.error) {
    return (
      <div className="ui-alert ui-alert-danger rounded-xl px-3 py-2 text-sm">
        {props.error}
      </div>
    );
  }
  if (props.success) {
    return (
      <div className="ui-alert ui-alert-success rounded-xl px-3 py-2 text-sm">
        {props.success}
      </div>
    );
  }
  return null;
}

function SubmitBtn(props: { loading: boolean; label: string; loadingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={props.loading}
      className="ui-transition mt-0.5 w-full rounded-[11px] bg-[var(--ink)] py-3 text-sm font-semibold text-[var(--background)] hover:bg-[color-mix(in_srgb,var(--ink)_88%,var(--accent))] disabled:opacity-60"
    >
      {props.loading ? props.loadingLabel : props.label}
    </button>
  );
}
