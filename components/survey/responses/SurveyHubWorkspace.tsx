"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { BarChart3, MessageSquare, Pencil, Users } from "lucide-react";
import { renameSurvey, type SurveyMeta } from "../../../app/actions/survey";
import { toastError, toastSuccess } from "../../../lib/toast";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { getDateFnsLocale } from "../../../lib/i18n/dateFnsLocale";
import SurveyDetailNav, { SurveyCopyLinkButton, SurveyPreviewLink } from "./SurveyDetailNav";

type SurveyHubWorkspaceProps = {
  meta: SurveyMeta;
  responseCount: number;
};

export default function SurveyHubWorkspace({ meta, responseCount }: SurveyHubWorkspaceProps) {
  const { t, locale } = useTranslation();
  const dateFnsLocale = getDateFnsLocale(locale);
  const [title, setTitle] = useState(meta.title);
  const [editingName, setEditingName] = useState(false);
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
  };

  return (
    <div className="space-y-5">
      <header className="ui-surface rounded-2xl p-5">
        <SurveyDetailNav surveyId={meta.id} active="overview" />

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
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
                  className="ui-focus-ring min-w-0 flex-1 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-lg font-semibold"
                />
                <button
                  type="button"
                  onClick={() => void handleRename()}
                  disabled={saving}
                  className="ui-btn ui-btn-primary text-xs"
                >
                  {saving ? "…" : t("survey.common.save")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTitle(meta.title);
                    setEditingName(false);
                  }}
                  className="ui-btn ui-btn-ghost text-xs"
                >
                  {t("survey.common.cancel")}
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold text-[var(--foreground)]">{meta.title}</h2>
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
          </div>

          <div className="flex flex-wrap gap-2">
            <SurveyCopyLinkButton publicPath={meta.publicPath} />
            <SurveyPreviewLink publicPath={meta.publicPath} />
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href={`/questionnaire/reponses/${meta.id}/reponses`}
          className="ui-surface ui-transition rounded-2xl p-5 hover:border-[var(--line-strong)]"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
            <BarChart3 className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold tabular-nums text-[var(--foreground)]">{responseCount}</p>
          <p className="mt-1 text-sm font-medium text-[color:var(--foreground)]/70">
            {t("survey.hub.statsResponses")}
          </p>
          <p className="mt-2 text-xs text-[var(--accent)]">{t("survey.hub.viewResponses")} →</p>
        </Link>

        <Link
          href={`/questionnaire/reponses/${meta.id}/edit`}
          className="ui-surface ui-transition rounded-2xl p-5 hover:border-[var(--line-strong)]"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-soft)] text-[color:var(--foreground)]/70">
            <MessageSquare className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-[var(--foreground)]">{t("survey.hub.cards.edit.title")}</p>
          <p className="mt-1 text-xs leading-relaxed text-[color:var(--foreground)]/55">
            {t("survey.hub.cards.edit.description")}
          </p>
          <p className="mt-3 text-xs text-[var(--accent)]">{t("survey.nav.edit")} →</p>
        </Link>

        <div className="ui-surface rounded-2xl p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-soft)] text-[color:var(--foreground)]/70">
            <Users className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-[var(--foreground)]">{t("survey.hub.shareTitle")}</p>
          <p className="mt-1 break-all font-mono text-[11px] text-[color:var(--foreground)]/55">{publicUrl}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <SurveyCopyLinkButton publicPath={meta.publicPath} />
            <SurveyPreviewLink publicPath={meta.publicPath} />
          </div>
        </div>
      </div>
    </div>
  );
}
