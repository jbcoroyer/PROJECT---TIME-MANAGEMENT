"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Camera,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  User,
  UserRound,
} from "lucide-react";
import { uploadOrgAsset } from "../../app/actions/storage";
import AuthAtelierShell, { AuthMobileBrand, AuthTabLink } from "./AuthAtelierShell";
import OAuthButtons from "./OAuthButtons";
import { useTranslation } from "../../lib/i18n/useTranslation";
import { getOAuthCallbackOrigin } from "../../lib/publicAppUrl";
import { getSupabaseBrowser } from "../../lib/supabaseBrowser";

type SignupStep = 1 | 2;

export default function SignUpScreen() {
  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const { t } = useTranslation();

  const [step, setStep] = useState<SignupStep>(1);
  const [organizationName, setOrganizationName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const subtitle = step === 1 ? t("auth.signUpStep1") : t("auth.signUpStep2");

  function translateAuthError(message: string): string {
    if (message.includes("Invalid login credentials")) return t("auth.invalidCredentials");
    if (message.includes("Email not confirmed")) return t("auth.emailNotConfirmed");
    if (message.includes("User already registered") || message.includes("already been registered")) {
      return t("auth.userExists");
    }
    if (message.includes("Password should be at least")) return t("auth.passwordTooShort");
    if (message.includes("PKCE code verifier not found")) {
      return "La connexion a expiré ou a été lancée sur un autre onglet ou port. Réessayez depuis la même fenêtre (ex. localhost:3000).";
    }
    return message;
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const goToStep2 = () => {
    if (!organizationName.trim()) {
      setError(t("auth.organizationNameRequired"));
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setError(t("auth.nameRequired"));
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError(t("auth.fieldsRequired"));
      return;
    }
    if (!acceptedTerms) {
      setError("Vous devez accepter les conditions générales et la politique de confidentialité.");
      return;
    }

    setError(null);
    setLoading(true);

    const displayName = `${firstName.trim()} ${lastName.trim()}`;

    try {
      const callbackOrigin = getOAuthCallbackOrigin();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: displayName,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            job_title: jobTitle.trim() || null,
            organization_name: organizationName.trim(),
          },
          emailRedirectTo: `${callbackOrigin}/auth/callback?next=${encodeURIComponent("/setup")}`,
        },
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      if (!data.user) {
        throw new Error("Création du compte impossible.");
      }

      const needsEmailConfirmation = !data.session;

      if (needsEmailConfirmation) {
        router.push("/login?signup=confirm");
        router.refresh();
        return;
      }

      if (photoFile) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const ext = photoFile.name.split(".").pop() ?? "jpg";
          const { data: profileRow } = await supabase
            .from("profiles")
            .select("team_member_id, organization_id")
            .eq("id", user.id)
            .maybeSingle();

          if (profileRow?.team_member_id && profileRow.organization_id) {
            const relativePath = `${String(profileRow.team_member_id)}.${ext}`;
            const formData = new FormData();
            formData.set("file", photoFile);
            const upload = await uploadOrgAsset(formData, "member-avatars", relativePath);
            if (upload.ok) {
              await supabase
                .from("team_members")
                .update({ avatar_url: upload.path })
                .eq("id", String(profileRow.team_member_id));
            }
          }
        }
      }

      router.push("/setup");
      router.refresh();
    } catch (err: unknown) {
      setError(translateAuthError(err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthAtelierShell
      heading={
        <>
          Créer un espace<em className="text-[var(--accent)] italic">.</em>
        </>
      }
      subtitle={subtitle}
    >
      <AuthMobileBrand />

      <div className="auth-atelier__tabs mt-8">
        <AuthTabLink href="/login">{t("auth.signInTab")}</AuthTabLink>
        <AuthTabLink href="/signup" active>
          {t("auth.signUpTab")}
        </AuthTabLink>
      </div>

        <div className="mt-7">
          {step === 1 && (
            <div className="space-y-4">
              <Field
                id="organizationName"
                label={t("auth.organizationName")}
                icon={<Building2 className="h-4 w-4" />}
                type="text"
                value={organizationName}
                onChange={setOrganizationName}
                placeholder={t("auth.organizationNamePlaceholder")}
              />

              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="group relative h-20 w-20 overflow-hidden rounded-full border border-dashed border-[var(--line)] bg-[var(--surface-soft)] transition hover:border-[var(--brand-primary)]/40"
                  title={t("auth.photo")}
                >
                  {photoPreview ? (
                    <Image src={photoPreview} alt="" fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-1">
                      <Camera className="h-5 w-5 text-[color:var(--foreground)]/30 group-hover:text-[color:var(--foreground)]/45" />
                    </div>
                  )}
                </button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handlePhotoChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field
                  id="firstName"
                  label={t("auth.firstName")}
                  icon={<User className="h-4 w-4" />}
                  type="text"
                  value={firstName}
                  onChange={setFirstName}
                  autoComplete="given-name"
                />
                <Field
                  id="lastName"
                  label={t("auth.lastName")}
                  icon={<UserRound className="h-4 w-4" />}
                  type="text"
                  value={lastName}
                  onChange={setLastName}
                  autoComplete="family-name"
                />
              </div>

              <Field
                id="jobTitle"
                label={t("auth.jobTitle")}
                icon={<Briefcase className="h-4 w-4" />}
                type="text"
                value={jobTitle}
                onChange={setJobTitle}
                autoComplete="organization-title"
              />

              <AlertBox error={error} />

              <button
                type="button"
                onClick={goToStep2}
                className="ui-btn ui-btn-primary w-full py-3"
              >
                {t("common.continue")}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={(e) => void handleSignUp(e)} className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2.5">
                {photoPreview ? (
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full">
                    <Image src={photoPreview} alt="" fill className="object-cover" unoptimized />
                  </div>
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface)]">
                    <Building2 className="h-4 w-4 text-[color:var(--foreground)]/60" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--foreground)]">
                    {organizationName}
                  </p>
                  <p className="truncate text-xs text-[color:var(--foreground)]/50">
                    {firstName} {lastName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError(null);
                  }}
                  aria-label={t("common.back")}
                  className="shrink-0 rounded-lg p-1.5 text-[color:var(--foreground)]/45 transition hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </div>

              <Field
                id="signup-email"
                label={t("auth.email")}
                icon={<Mail className="h-4 w-4" />}
                type="email"
                value={email}
                onChange={setEmail}
                autoComplete="email"
                placeholder="vous@example.com"
              />
              <PasswordField
                id="signup-password"
                label={t("auth.password")}
                value={password}
                onChange={setPassword}
                show={showPassword}
                onToggleShow={() => setShowPassword((v) => !v)}
                autoComplete="new-password"
              />

              <AlertBox error={error} />

              <label className="flex items-start gap-2.5 text-sm text-[color:var(--foreground)]/70">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[var(--line)] accent-[var(--brand-primary)]"
                />
                <span>
                  J&apos;accepte les{" "}
                  <Link href="/terms" target="_blank" className="font-medium text-[var(--brand-primary)] hover:underline">
                    conditions générales
                  </Link>{" "}
                  et la{" "}
                  <Link href="/privacy" target="_blank" className="font-medium text-[var(--brand-primary)] hover:underline">
                    politique de confidentialité
                  </Link>
                  .
                </span>
              </label>

              <SubmitBtn
                loading={loading}
                loadingLabel={t("common.saving")}
                label={t("auth.createAccount")}
              />
              <OAuthButtons
                nextPath="/setup"
                signUpMetadata={{
                  display_name: `${firstName.trim()} ${lastName.trim()}`,
                  first_name: firstName.trim(),
                  last_name: lastName.trim(),
                  job_title: jobTitle.trim() || undefined,
                  organization_name: organizationName.trim(),
                }}
              />
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-[var(--ink-muted)]">
          {t("auth.signInTab")} ?{" "}
          <Link href="/login" className="font-semibold text-[var(--ink)] border-b border-[var(--accent)] hover:text-[var(--accent)]">
            {t("auth.signInButton")}
          </Link>
        </p>
    </AuthAtelierShell>
  );
}

function Field(props: {
  id: string;
  label: string;
  icon: React.ReactNode;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={props.id} className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
        {props.label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--foreground)]/35">
          {props.icon}
        </span>
        <input
          id={props.id}
          type={props.type}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          autoComplete={props.autoComplete}
          placeholder={props.placeholder}
          className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface-soft)]/80 py-2.5 pl-10 pr-4 text-sm text-[var(--foreground)] placeholder:text-[color:var(--foreground)]/30 focus:border-[var(--brand-primary)]/30 focus:outline-none"
        />
      </div>
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
      <label htmlFor={props.id} className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
        {props.label}
      </label>
      <div className="relative">
        <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--foreground)]/35" />
        <input
          id={props.id}
          type={props.show ? "text" : "password"}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          autoComplete={props.autoComplete}
          placeholder="••••••••"
          className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface-soft)]/80 py-2.5 pl-10 pr-10 text-sm text-[var(--foreground)] placeholder:text-[color:var(--foreground)]/30 focus:border-[var(--brand-primary)]/30 focus:outline-none"
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

function AlertBox(props: { error?: string | null }) {
  if (!props.error) return null;
  return (
    <div className="ui-alert ui-alert-danger rounded-xl px-3 py-2 text-sm">
      {props.error}
    </div>
  );
}

function SubmitBtn(props: { loading: boolean; label: string; loadingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={props.loading}
      className="ui-btn ui-btn-primary w-full py-3 disabled:opacity-60"
    >
      {props.loading ? props.loadingLabel : props.label}
    </button>
  );
}
