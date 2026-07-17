"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ChevronRight,
  ClipboardList,
  Copy,
  ExternalLink,
  Inbox,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  createIntakeForm,
  deleteIntakeForm,
  duplicateIntakeForm,
  listIntakeForms,
  type IntakeFormWithStats,
} from "../../../app/actions/intakeForm";
import { useBranding } from "../../../lib/brandingContext";
import {
  defaultTitleForTemplate,
  defaultWelcomeForTemplate,
  type IntakeFormTemplateId,
} from "../../../lib/intake/intakeFormTemplates";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { getDateFnsLocale } from "../../../lib/i18n/dateFnsLocale";
import { toastError, toastSuccess } from "../../../lib/toast";
import EmptyState from "../../ui/EmptyState";
import IntakeFormTemplatePicker from "./IntakeFormTemplatePicker";

function IntakeFormCard({
  form,
  formatDate,
  onDuplicate,
  onDelete,
  t,
}: {
  form: IntakeFormWithStats;
  formatDate: (iso: string) => string;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  return (
    <div className="ui-surface ui-transition group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--line)] border-l-4 border-l-[var(--accent)] p-5 hover:border-[color-mix(in_srgb,var(--accent)_25%,var(--line))]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)]">
          <ClipboardList className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <span
          className={[
            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            form.status === "active"
              ? "ui-pill ui-pill-success"
              : "bg-[var(--surface-soft)] text-[color:var(--foreground)]/55",
          ].join(" ")}
        >
          {form.status === "active" ? t("asks.list.active") : t("asks.list.draft")}
        </span>
      </div>

      <Link href={`/asks/${form.id}`} className="min-w-0 flex-1">
        <h2 className="text-lg font-semibold leading-snug text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)]">
          {form.title}
        </h2>
        <p className="mt-1 line-clamp-2 text-sm text-[var(--ink-muted)]">
          {form.welcomeMessage || t("asks.hub.noWelcomeMessage")}
        </p>
      </Link>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--surface-soft)] px-2 py-1 text-[11px] font-semibold text-[color:var(--foreground)]/60">
          <Inbox className="h-3 w-3" />
          {form.requestCount === 1
            ? t("asks.hub.cards.triage.countOne", { count: form.requestCount })
            : t("asks.hub.cards.triage.countMany", { count: form.requestCount })}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-[var(--line)] pt-3">
        <p className="min-w-0 truncate text-[11px] text-[color:var(--foreground)]/45">
          {t("asks.list.createdOn", { date: formatDate(form.createdAt) })}
        </p>
        <span className="inline-flex max-w-[140px] items-center gap-1 truncate font-mono text-[11px] text-[color:var(--foreground)]/50">
          <ExternalLink className="h-3 w-3 shrink-0" />
          {form.publicPath}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/asks/${form.id}`}
          className="ui-btn ui-btn-secondary inline-flex flex-1 items-center justify-center gap-1 text-xs"
        >
          {t("asks.list.open")}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
        <button
          type="button"
          onClick={() => onDuplicate(form.id)}
          className="ui-btn ui-btn-secondary inline-flex items-center gap-1 px-3 text-xs"
          title={t("asks.list.duplicate")}
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(form.id)}
          className="ui-btn ui-btn-secondary inline-flex items-center gap-1 px-3 text-xs text-[var(--danger)]"
          title={t("asks.list.delete")}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function IntakeFormListWorkspace({
  initialForms,
}: {
  initialForms: IntakeFormWithStats[];
}) {
  const router = useRouter();
  const { branding } = useBranding();
  const { t, locale } = useTranslation();
  const dateFnsLocale = getDateFnsLocale(locale);
  const [forms, setForms] = useState(initialForms);
  const [creatingOpen, setCreatingOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [templateId, setTemplateId] = useState<IntakeFormTemplateId>("blank");
  const [title, setTitle] = useState(() =>
    defaultTitleForTemplate("blank", locale, branding.appName),
  );
  const [welcomeMessage, setWelcomeMessage] = useState(() =>
    defaultWelcomeForTemplate("blank", locale),
  );

  useEffect(() => {
    setForms(initialForms);
  }, [initialForms]);

  useEffect(() => {
    setTitle(defaultTitleForTemplate(templateId, locale, branding.appName));
    setWelcomeMessage(defaultWelcomeForTemplate(templateId, locale));
  }, [templateId, locale, branding.appName]);

  const formatDate = useCallback(
    (iso: string): string => {
      if (!iso) return "—";
      try {
        return format(new Date(iso), "d MMM yyyy", { locale: dateFnsLocale });
      } catch {
        return iso;
      }
    },
    [dateFnsLocale],
  );

  const reload = useCallback(async () => {
    const data = await listIntakeForms();
    setForms(data);
  }, []);

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
    setCreatingOpen(false);
    router.push(`/asks/${result.formId}`);
    router.refresh();
  };

  const handleDuplicate = async (formId: string) => {
    const result = await duplicateIntakeForm(formId);
    if (!result.ok) {
      toastError(result.error);
      return;
    }
    toastSuccess(t("asks.list.toast.duplicated"));
    await reload();
    router.refresh();
  };

  const handleDelete = async (formId: string) => {
    if (!window.confirm(t("asks.list.deleteConfirm"))) return;
    const result = await deleteIntakeForm(formId);
    if (!result.ok) {
      toastError(result.error);
      return;
    }
    toastSuccess(t("asks.list.toast.deleted"));
    await reload();
    router.refresh();
  };

  return (
    <div className="space-y-5">
      <header className="ui-surface flex flex-wrap items-start justify-between gap-4 rounded-2xl p-5">
        <div>
          <p className="ui-kicker mb-1">{branding.appName}</p>
          <h1 className="ui-display text-2xl text-[var(--foreground)]">{t("asks.list.title")}</h1>
          <p className="mt-1 text-sm text-[color:var(--foreground)]/60">{t("asks.list.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => setCreatingOpen((v) => !v)}
          className="ui-btn ui-btn-primary gap-2"
        >
          {creatingOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {creatingOpen ? t("asks.list.cancel") : t("asks.list.newForm")}
        </button>
      </header>

      {creatingOpen ? (
        <div className="ui-surface space-y-4 rounded-2xl p-5">
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
            className="ui-btn ui-btn-primary"
          >
            {creating ? t("asks.hub.create.submitting") : t("asks.list.createSubmit")}
          </button>
        </div>
      ) : null}

      {forms.length === 0 && !creatingOpen ? (
        <EmptyState
          title={t("asks.list.emptyTitle")}
          description={t("asks.list.emptyBody")}
          action={
            <button
              type="button"
              onClick={() => setCreatingOpen(true)}
              className="ui-btn ui-btn-primary gap-2"
            >
              <Plus className="h-4 w-4" />
              {t("asks.list.newForm")}
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <IntakeFormCard
              key={form.id}
              form={form}
              formatDate={formatDate}
              onDuplicate={(id) => void handleDuplicate(id)}
              onDelete={(id) => void handleDelete(id)}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}
