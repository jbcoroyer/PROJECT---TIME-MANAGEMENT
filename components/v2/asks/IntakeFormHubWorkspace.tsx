"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
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
  createIntakeForm,
  type IntakeFormWithStats,
} from "../../../app/actions/intakeForm";
import { useBranding } from "../../../lib/brandingContext";
import {
  defaultTitleForTemplate,
  defaultWelcomeForTemplate,
  type IntakeFormTemplateId,
} from "../../../lib/intake/intakeFormTemplates";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { toastError, toastSuccess } from "../../../lib/toast";
import IntakeFormTemplatePicker from "./IntakeFormTemplatePicker";

type IntakeFormHubWorkspaceProps = {
  initialForm: IntakeFormWithStats | null;
};

export default function IntakeFormHubWorkspace({ initialForm }: IntakeFormHubWorkspaceProps) {
  const router = useRouter();
  const { branding } = useBranding();
  const { t, locale } = useTranslation();
  const [form, setForm] = useState(initialForm);
  const [creating, setCreating] = useState(false);
  const [templateId, setTemplateId] = useState<IntakeFormTemplateId>("blank");
  const [title, setTitle] = useState(() =>
    defaultTitleForTemplate("blank", "fr", branding.appName),
  );
  const [welcomeMessage, setWelcomeMessage] = useState(() =>
    defaultWelcomeForTemplate("blank", "fr"),
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setTitle(defaultTitleForTemplate(templateId, locale, branding.appName));
    setWelcomeMessage(defaultWelcomeForTemplate(templateId, locale));
  }, [templateId, locale, branding.appName]);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  const publicUrl =
    typeof window !== "undefined" && form
      ? `${window.location.origin}${form.publicPath}`
      : form?.publicPath ?? "";

  const handleCreate = async () => {
    const cleanTitle = title.trim();
    if (!cleanTitle || creating) return;
    setCreating(true);
    const result = await createIntakeForm(cleanTitle, welcomeMessage, {
      templateId,
      locale,
    });
    setCreating(false);
    if (!result.ok) {
      toastError(result.error);
      return;
    }
    toastSuccess(t("asks.hub.toast.ready"));
    router.push("/asks/edit");
    router.refresh();
  };

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

  if (!form) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="ui-surface overflow-hidden rounded-2xl">
          <div className="border-b border-[var(--line)] bg-[var(--surface-soft)] px-6 py-8 sm:px-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)]">
              <Inbox className="h-7 w-7" />
            </div>
            <h1 className="ui-display mt-5 text-[2rem] leading-tight text-[var(--foreground)]">
              {t("asks.hub.create.title")}
            </h1>
            <p className="mt-3 max-w-lg text-[15px] text-[var(--ink-muted)]">
              {t("asks.hub.create.description", { appName: branding.appName })}
            </p>
          </div>

          <div className="space-y-5 px-6 py-8 sm:px-8">
            <div className="flex items-start gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-4">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />
              <div className="text-sm text-[var(--ink-muted)]">
                <p className="font-semibold text-[var(--foreground)]">
                  {t("asks.hub.create.howItWorks.title")}
                </p>
                <ol className="mt-2 list-decimal space-y-1 pl-4">
                  <li>{t("asks.hub.create.howItWorks.step1")}</li>
                  <li>{t("asks.hub.create.howItWorks.step2")}</li>
                  <li>{t("asks.hub.create.howItWorks.step3")}</li>
                </ol>
              </div>
            </div>

            <IntakeFormTemplatePicker
              value={templateId}
              onChange={setTemplateId}
              disabled={creating}
            />

            <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--ink-muted)]">
              {t("asks.hub.create.formTitleLabel")}
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="ui-input normal-case"
                placeholder={t("asks.hub.create.formTitlePlaceholder")}
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--ink-muted)]">
              {t("asks.hub.create.welcomeMessageLabel")}
              <textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                rows={3}
                className="ui-input normal-case"
              />
            </label>

            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={creating || !title.trim()}
              className="ui-btn ui-btn-primary inline-flex w-full items-center justify-center gap-2 sm:w-auto"
            >
              {creating ? t("asks.hub.create.submitting") : t("asks.hub.create.submit")}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
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
              href="/asks/edit"
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
          href="/asks/edit"
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
          href="/asks/triage"
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
