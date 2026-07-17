"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardList,
  Copy,
  ExternalLink,
  Inbox,
  Link2,
  Pencil,
  Sparkles,
} from "lucide-react";
import {
  updateIntakeFormPublicPath,
  type IntakeFormWithStats,
} from "../../../app/actions/intakeForm";
import { useBranding } from "../../../lib/brandingContext";
import { INTAKE_PUBLIC_PREFIX, intakePublicSegment } from "../../../lib/intake/intakeFormPaths";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { toastError, toastSuccess } from "../../../lib/toast";

type IntakeFormHubWorkspaceProps = {
  form: IntakeFormWithStats;
};

export default function IntakeFormHubWorkspace({ form: initialForm }: IntakeFormHubWorkspaceProps) {
  const router = useRouter();
  const { branding } = useBranding();
  const { t } = useTranslation();
  const [form, setForm] = useState(initialForm);
  const [copied, setCopied] = useState(false);
  const [slug, setSlug] = useState(() => intakePublicSegment(initialForm.publicPath));
  const [savingSlug, setSavingSlug] = useState(false);

  useEffect(() => {
    setForm(initialForm);
    setSlug(intakePublicSegment(initialForm.publicPath));
  }, [initialForm]);

  const publicUrl =
    typeof window !== "undefined" && form
      ? `${window.location.origin}${form.publicPath}`
      : form.publicPath;

  const handleCopy = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toastSuccess(t("asks.hub.toast.linkCopied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toastError(t("asks.hub.toast.copyFailed"));
    }
  };

  const handleSaveSlug = async () => {
    if (savingSlug) return;
    setSavingSlug(true);
    const result = await updateIntakeFormPublicPath(form.id, slug);
    setSavingSlug(false);
    if (!result.ok) {
      toastError(result.error);
      return;
    }
    toastSuccess(t("asks.hub.toast.urlUpdated"));
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/asks"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t("asks.hub.backToList")}
      </Link>

      <header className="ui-surface rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)]">
            <ClipboardList className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">{form.title}</h1>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              {form.welcomeMessage || t("asks.hub.noWelcomeMessage")}
            </p>
            <Link
              href={`/asks/${form.id}/edit`}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:underline"
            >
              <Pencil className="h-3.5 w-3.5" />
              {t("asks.hub.editForm")}
            </Link>
          </div>
        </div>
      </header>

      <section className="ui-surface rounded-2xl p-6">
        <div className="flex items-center gap-2 text-[var(--accent)]">
          <Link2 className="h-4 w-4" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.1em]">
            {t("asks.hub.publicLink.title")}
          </h2>
        </div>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          {t("asks.hub.publicLink.description", { appName: branding.appName })}
        </p>

        <label className="mt-4 flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--ink-muted)]">
          {t("asks.hub.publicLink.slugLabel")}
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex min-w-0 flex-1 items-center gap-0 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-soft)]">
              <span className="shrink-0 px-3 py-2 font-mono text-xs text-[var(--ink-muted)]">
                {INTAKE_PUBLIC_PREFIX}
              </span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                className="min-w-0 flex-1 border-0 bg-transparent px-0 py-2 font-mono text-xs normal-case text-[var(--foreground)] outline-none"
                aria-label={t("asks.hub.publicLink.slugAriaLabel")}
              />
            </div>
            <button
              type="button"
              onClick={() => void handleSaveSlug()}
              disabled={savingSlug || slug === intakePublicSegment(form.publicPath)}
              className="ui-btn ui-btn-secondary shrink-0"
            >
              {savingSlug ? t("asks.hub.publicLink.saving") : t("asks.hub.publicLink.saveSlug")}
            </button>
          </div>
        </label>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            readOnly
            value={publicUrl}
            className="ui-input flex-1 font-[family-name:var(--font-mono)] text-xs"
            aria-label={t("asks.hub.publicLink.urlAriaLabel")}
          />
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="ui-btn ui-btn-secondary inline-flex shrink-0 items-center justify-center gap-2"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? t("asks.hub.publicLink.copied") : t("asks.hub.publicLink.copy")}
          </button>
          <a
            href={form.publicPath}
            target="_blank"
            rel="noopener noreferrer"
            className="ui-btn ui-btn-primary inline-flex shrink-0 items-center justify-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            {t("asks.hub.publicLink.preview")}
          </a>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href={`/asks/${form.id}/edit`}
          className="ui-surface ui-transition group rounded-2xl p-5 hover:border-[var(--accent)]"
        >
          <Pencil className="h-6 w-6 text-[var(--accent)]" />
          <h3 className="mt-3 font-semibold text-[var(--foreground)]">
            {t("asks.hub.cards.editFields.title")}
          </h3>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            {t("asks.hub.cards.editFields.description")}
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] group-hover:underline">
            {t("asks.hub.cards.editFields.cta")}
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>

        <Link
          href={`/asks/${form.id}/triage`}
          className="ui-surface ui-transition group rounded-2xl p-5 hover:border-[var(--accent)]"
        >
          <Inbox className="h-6 w-6 text-[var(--accent)]" />
          <h3 className="mt-3 font-semibold text-[var(--foreground)]">
            {t("asks.hub.cards.triage.title")}
          </h3>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            {form.requestCount > 0
              ? form.requestCount === 1
                ? t("asks.hub.cards.triage.countOne", { count: form.requestCount })
                : t("asks.hub.cards.triage.countMany", { count: form.requestCount })
              : t("asks.hub.cards.triage.empty")}
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] group-hover:underline">
            {t("asks.hub.cards.triage.cta")}
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      </div>

      <div className="ui-surface rounded-2xl p-5">
        <Sparkles className="h-6 w-6 text-[var(--accent)]" />
        <h3 className="mt-3 font-semibold text-[var(--foreground)]">
          {t("asks.hub.externalAccess.title")}
        </h3>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          {t("asks.hub.externalAccess.description")}
        </p>
      </div>
    </div>
  );
}
