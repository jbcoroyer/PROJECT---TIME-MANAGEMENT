"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  BarChart3,
  Check,
  ClipboardList,
  ExternalLink,
  Pencil,
  X,
} from "lucide-react";
import { renameSurvey, type SurveyMeta } from "../../../app/actions/survey";
import { toastError, toastSuccess } from "../../../lib/toast";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { getDateFnsLocale } from "../../../lib/i18n/dateFnsLocale";

type SurveyHubWorkspaceProps = {
  meta: SurveyMeta;
  responseCount: number;
};

export default function SurveyHubWorkspace({ meta, responseCount }: SurveyHubWorkspaceProps) {
  const { t, locale } = useTranslation();
  const dateFnsLocale = getDateFnsLocale(locale);
  const router = useRouter();
  const [editingName, setEditingName] = useState(false);
  const [title, setTitle] = useState(meta.title);
  const [saving, setSaving] = useState(false);

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${meta.publicPath}`
      : meta.publicPath;

  const formatDate = (iso: string): string => {
    if (!iso) return "—";
    try {
      return format(new Date(iso), "d MMM yyyy", { locale: dateFnsLocale });
    } catch {
      return iso;
    }
  };

  const handleRename = async () => {
    const clean = title.trim();
    if (!clean) {
      toastError(t("survey.hub.titleEmpty"));
      return;
    }
    if (clean === meta.title) {
      setEditingName(false);
      return;
    }
    setSaving(true);
    const result = await renameSurvey(meta.id, clean);
    setSaving(false);
    if (!result.ok) {
      toastError(result.error);
      return;
    }
    toastSuccess(t("survey.hub.renamed"));
    setEditingName(false);
    router.refresh();
  };

  const actions = [
    {
      title: t("survey.hub.openForm"),
      description: t("survey.hub.openFormDescription"),
      href: meta.publicPath,
      external: true,
      icon: ExternalLink,
      className: "ui-btn-secondary",
    },
    {
      title: t("survey.hub.cards.edit.title"),
      description: t("survey.hub.cards.edit.description"),
      href: `/questionnaire/reponses/${meta.id}/edit`,
      external: false,
      icon: Pencil,
      className: "ui-btn-secondary",
    },
    {
      title: t("survey.hub.cards.responses.title"),
      description: t("survey.hub.cards.responses.description"),
      href: `/questionnaire/reponses/${meta.id}/reponses`,
      external: false,
      icon: BarChart3,
      className: "ui-btn-primary",
    },
  ] as const;

  return (
    <div className="space-y-5">
      <header className="ui-surface rounded-2xl p-5">
        <Link
          href="/questionnaire/reponses"
          className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--foreground)]/50 hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("survey.hub.backToList")}
        </Link>
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)]">
            <ClipboardList className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            {editingName ? (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleRename();
                    if (e.key === "Escape") {
                      setTitle(meta.title);
                      setEditingName(false);
                    }
                  }}
                  className="ui-focus-ring min-w-0 flex-1 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-lg font-semibold text-[var(--foreground)]"
                />
                <button
                  type="button"
                  onClick={() => void handleRename()}
                  disabled={saving}
                  className="ui-btn ui-btn-primary h-9 gap-1.5 px-3 text-xs"
                >
                  <Check className="h-4 w-4" />
                  {saving ? "…" : t("survey.common.save")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTitle(meta.title);
                    setEditingName(false);
                  }}
                  className="ui-btn ui-btn-ghost h-9 w-9 p-0"
                  aria-label={t("survey.common.cancel")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="ui-display text-2xl text-[var(--foreground)]">{meta.title}</h1>
                <span
                  className={[
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                    meta.status === "active"
                      ? "ui-pill ui-pill-success"
                      : "bg-[var(--surface-soft)] text-[color:var(--foreground)]/55",
                  ].join(" ")}
                >
                  {meta.status === "active" ? t("survey.list.active") : t("survey.list.draft")}
                </span>
                <button
                  type="button"
                  onClick={() => setEditingName(true)}
                  className="ui-btn ui-btn-ghost h-8 gap-1.5 px-2.5 text-xs"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {t("survey.hub.rename")}
                </button>
              </div>
            )}
            {meta.description ? (
              <p className="mt-1 text-sm text-[color:var(--foreground)]/60">{meta.description}</p>
            ) : null}
            <p className="mt-2 text-xs text-[color:var(--foreground)]/45">
              {t("survey.hub.createdMeta", { date: formatDate(meta.createdAt), count: responseCount })}
            </p>
            <p className="mt-1 text-xs text-[color:var(--foreground)]/45">
              {t("survey.hub.publicLink")}{" "}
              <span className="font-mono text-[color:var(--foreground)]/70">{publicUrl}</span>
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          const content = (
            <div className="ui-surface ui-transition flex h-full flex-col gap-3 rounded-2xl p-5 hover:border-[var(--line-strong)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-soft)] text-[var(--accent)]">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-[var(--foreground)]">{action.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-[color:var(--foreground)]/60">
                  {action.description}
                </p>
              </div>
              <span className={`ui-btn w-full justify-center gap-2 text-xs ${action.className}`}>
                {t("survey.hub.choose")}
                <Icon className="h-3.5 w-3.5" />
              </span>
            </div>
          );

          if (action.external) {
            return (
              <a
                key={action.title}
                href={action.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full"
              >
                {content}
              </a>
            );
          }

          return (
            <Link key={action.title} href={action.href} className="block h-full">
              {content}
            </Link>
          );
        })}
      </section>
    </div>
  );
}
