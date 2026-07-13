"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Briefcase, Camera, User, UserRound } from "lucide-react";
import { completeInviteProfile, type InviteWelcomeContext } from "../../app/actions/invites";
import { uploadOrgAsset } from "../../app/actions/storage";
import { AppMark } from "../AppBrand";
import { useBranding } from "../../lib/brandingContext";
import { useTranslation } from "../../lib/i18n/useTranslation";
import { getSupabaseBrowser } from "../../lib/supabaseBrowser";
import { toastError, toastSuccess } from "../../lib/toast";

type InviteAcceptScreenProps = {
  context: Extract<InviteWelcomeContext, { needsOnboarding: true }>;
};

export default function InviteAcceptScreen({ context }: InviteAcceptScreenProps) {
  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const { branding } = useBranding();
  const { t } = useTranslation({ preferBrowser: true });

  const [firstName, setFirstName] = useState(context.suggestedFirstName);
  const [lastName, setLastName] = useState(context.suggestedLastName);
  const [jobTitle, setJobTitle] = useState(context.suggestedJobTitle);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError(t("invite.nameRequired"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let avatarStoragePath: string | null = null;

      if (photoFile && context.teamMemberId) {
        const ext = photoFile.name.split(".").pop() ?? "jpg";
        const formData = new FormData();
        formData.set("file", photoFile);
        const upload = await uploadOrgAsset(
          formData,
          "member-avatars",
          `${context.teamMemberId}.${ext}`,
        );
        if (!upload.ok) {
          throw new Error(upload.error);
        }
        avatarStoragePath = upload.path;
      }

      const result = await completeInviteProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        jobTitle: jobTitle.trim() || undefined,
        avatarStoragePath,
      });

      if (!result.ok) {
        throw new Error(result.error);
      }

      await supabase.auth.refreshSession();
      toastSuccess(t("invite.success"));
      router.replace("/dashboard/kanban?tour=1");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("invite.errorGeneric");
      setError(message);
      toastError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--background)] px-5 py-12">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="ui-hero-halo ui-hero-halo--orange left-1/2 top-[-10rem] h-[32.5rem] w-[40rem] -translate-x-1/2" />
        <div className="ui-hero-dots" />
      </div>

      <div className="relative z-10 w-full max-w-[440px]">
        <header className="mb-8 text-center">
          <div className="mb-5 flex justify-center">
            <AppMark className="h-11 w-11 rounded-xl" />
          </div>
          <p className="ui-kicker">{t("invite.kicker")}</p>
          <h1 className="ui-display mt-3 text-[1.65rem] font-bold leading-tight text-[var(--foreground)]">
            {t("invite.headline", { inviter: context.inviterName })}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[color:var(--foreground)]/65">
            {t("invite.body", { workspace: context.workspaceName })}
          </p>
        </header>

        <div className="mb-5 rounded-[18px] border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-4 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[color:var(--foreground)]/45">
            {t("invite.workspaceLabel")}
          </p>
          <p className="ui-display mt-1 text-xl font-semibold text-[var(--foreground)]">
            {context.workspaceName}
          </p>
          {context.workspaceTagline ? (
            <p className="mt-1 text-sm text-[color:var(--foreground)]/60">{context.workspaceTagline}</p>
          ) : branding.tagline.trim() ? (
            <p className="mt-1 text-sm text-[color:var(--foreground)]/60">{branding.tagline}</p>
          ) : null}
          <p className="mt-3 text-xs text-[color:var(--foreground)]/50">
            {t("invite.connectedAs", { email: context.email })}
          </p>
        </div>

        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="rounded-[20px] border border-[var(--line)] bg-[var(--surface)] p-[26px] shadow-[0_12px_32px_rgba(23,20,15,0.06)]"
        >
          <p className="mb-4 text-sm font-semibold text-[var(--foreground)]">{t("invite.profileTitle")}</p>

          <div className="mb-5 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-[var(--line-strong)] bg-[var(--surface-soft)] transition hover:border-[var(--accent)]"
            >
              {photoPreview ? (
                <Image src={photoPreview} alt="" fill className="object-cover" />
              ) : (
                <Camera className="h-6 w-6 text-[color:var(--foreground)]/40 group-hover:text-[var(--accent)]" />
              )}
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/png,image/webp,image/jpeg,image/gif"
              className="sr-only"
              onChange={handlePhotoChange}
            />
            <p className="text-xs text-[color:var(--foreground)]/55">{t("invite.avatarHint")}</p>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <InviteField
              id="invite-first-name"
              label={t("invite.firstName")}
              value={firstName}
              onChange={setFirstName}
              icon={<User className="h-4 w-4" />}
              autoComplete="given-name"
            />
            <InviteField
              id="invite-last-name"
              label={t("invite.lastName")}
              value={lastName}
              onChange={setLastName}
              icon={<UserRound className="h-4 w-4" />}
              autoComplete="family-name"
            />
          </div>

          <div className="mt-3.5">
            <InviteField
              id="invite-job-title"
              label={t("invite.jobTitle")}
              value={jobTitle}
              onChange={setJobTitle}
              icon={<Briefcase className="h-4 w-4" />}
              autoComplete="organization-title"
              optional
            />
          </div>

          {error ? (
            <div className="ui-alert ui-alert-danger mt-4 rounded-xl px-3 py-2 text-sm">{error}</div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="ui-btn ui-btn-primary mt-5 w-full py-3 text-sm"
          >
            {loading ? t("invite.submitting") : t("invite.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}

function InviteField({
  id,
  label,
  value,
  onChange,
  icon,
  autoComplete,
  optional,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
  autoComplete?: string;
  optional?: boolean;
}) {
  const { t } = useTranslation({ preferBrowser: true });

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold text-[var(--ink)]">
        {label}
        {optional ? (
          <span className="ml-1 font-normal text-[var(--ink-muted)]">({t("common.optional")})</span>
        ) : null}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--foreground)]/35">
          {icon}
        </span>
        <input
          id={id}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          className="ui-focus-ring w-full rounded-[11px] border border-[var(--line)] bg-[#faf8f4] py-2.5 pl-10 pr-3 text-[13.5px] text-[var(--ink)] placeholder:text-[color-mix(in_srgb,var(--ink)_32%,transparent)] focus:border-[var(--line-strong)] focus:outline-none"
        />
      </div>
    </div>
  );
}
