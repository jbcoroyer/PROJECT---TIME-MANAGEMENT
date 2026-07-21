"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  BarChart3,
  Building2,
  Layers,
  MessageSquare,
  Pencil,
  Plus,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import {
  createSurvey,
  listSurveys,
  type SurveyAudience,
  type SurveyListItem,
} from "../../../app/actions/survey";
import { useBranding } from "../../../lib/brandingContext";
import { toastError, toastSuccess } from "../../../lib/toast";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { getDateFnsLocale } from "../../../lib/i18n/dateFnsLocale";
import EmptyState from "../../ui/EmptyState";
import { SurveyCopyLinkButton, SurveyPreviewLink } from "./SurveyDetailNav";

type TranslateFn = ReturnType<typeof useTranslation>["t"];

function getAudienceThemes(t: TranslateFn) {
  return {
    externe: {
      label: t("survey.list.groupCollaborators"),
      subtitle: t("survey.list.companyWide"),
      icon: Users,
      border: "border-l-[var(--brand-primary)]",
      iconBg: "bg-[var(--accent-soft)]",
      iconColor: "text-[var(--accent-strong)]",
      badge: "ui-pill ui-pill-brand",
      accent: "group-hover:text-[var(--accent-strong)]",
      cardHover:
        "hover:border-[color-mix(in_srgb,var(--brand-primary)_25%,var(--line))] hover:shadow-[0_8px_30px_-12px_rgba(20,17,13,0.12)]",
    },
    interne: {
      label: t("survey.list.commTeam"),
      subtitle: t("survey.list.commTeamSubtitle"),
      icon: Building2,
      border: "border-l-[var(--line-strong)]",
      iconBg: "bg-[var(--surface-soft)]",
      iconColor: "text-[color:var(--foreground)]/75",
      badge: "ui-pill ui-pill-neutral",
      accent: "group-hover:text-[color:var(--foreground)]/85",
      cardHover: "hover:border-[var(--line-strong)] hover:shadow-[0_8px_30px_-12px_rgba(20,17,13,0.1)]",
    },
    general: {
      label: t("survey.list.custom"),
      subtitle: t("survey.list.customSubtitle"),
      icon: Sparkles,
      border: "border-l-[color-mix(in_srgb,var(--warning)_50%,var(--line))]",
      iconBg: "bg-[color-mix(in_srgb,var(--warning)_8%,var(--surface))]",
      iconColor: "text-[var(--warning)]",
      badge: "ui-pill ui-pill-neutral",
      accent: "group-hover:text-[var(--warning)]",
      cardHover:
        "hover:border-[color-mix(in_srgb,var(--warning)_25%,var(--line))] hover:shadow-[0_8px_30px_-12px_rgba(20,17,13,0.1)]",
    },
  } satisfies Record<
    SurveyAudience,
    {
      label: string;
      subtitle: string;
      icon: typeof Users;
      border: string;
      iconBg: string;
      iconColor: string;
      badge: string;
      accent: string;
      cardHover: string;
    }
  >;
}

function SurveyCard({
  survey,
  formatDate,
  t,
}: {
  survey: SurveyListItem;
  formatDate: (iso: string) => string;
  t: TranslateFn;
}) {
  const themes = getAudienceThemes(t);
  const theme = themes[survey.audience];
  const Icon = theme.icon;

  return (
    <article
      className={[
        "ui-surface ui-transition group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--line)] border-l-4 p-5",
        theme.border,
        theme.cardHover,
      ].join(" ")}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div
          className={[
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ring-black/5",
            theme.iconBg,
            theme.iconColor,
          ].join(" ")}
        >
          <Icon className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <span
            className={[
              "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
              theme.badge,
            ].join(" ")}
          >
            {theme.label}
          </span>
          <span
            className={[
              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              survey.status === "active"
                ? "ui-pill ui-pill-success"
                : "bg-[var(--surface-soft)] text-[color:var(--foreground)]/55",
            ].join(" ")}
          >
            {survey.status === "active" ? t("survey.list.active") : t("survey.list.draft")}
          </span>
        </div>
      </div>

      <Link href={`/questionnaire/reponses/${survey.id}/reponses`} className="block min-w-0 flex-1">
        <h2
          className={[
            "text-lg font-semibold leading-snug text-[var(--foreground)] transition-colors",
            theme.accent,
          ].join(" ")}
        >
          {survey.title}
        </h2>
        <p className="mt-1 text-xs font-medium text-[color:var(--foreground)]/45">{theme.subtitle}</p>

        {survey.description ? (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[color:var(--foreground)]/60">
            {survey.description}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--surface-soft)] px-2 py-1 text-[11px] font-semibold text-[color:var(--foreground)]/60">
            <MessageSquare className="h-3 w-3" />
            {t("survey.list.questionCount", { count: survey.questionCount })}
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--surface-soft)] px-2 py-1 text-[11px] font-semibold text-[color:var(--foreground)]/60">
            <Layers className="h-3 w-3" />
            {t("survey.list.screens", { count: survey.stepCount })}
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--surface-soft)] px-2 py-1 text-[11px] font-semibold text-[color:var(--foreground)]/60">
            <Users className="h-3 w-3" />
            {t("survey.list.responses", { count: survey.responseCount })}
          </span>
        </div>
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] pt-3">
        <p className="min-w-0 truncate text-[11px] text-[color:var(--foreground)]/45">
          {t("survey.list.createdOn", { date: formatDate(survey.createdAt) })}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <Link
            href={`/questionnaire/reponses/${survey.id}/reponses`}
            className="ui-btn ui-btn-primary h-8 gap-1.5 px-2.5 text-[11px]"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            {t("survey.list.actionResponses")}
          </Link>
          <Link
            href={`/questionnaire/reponses/${survey.id}/edit`}
            className="ui-btn ui-btn-secondary h-8 gap-1.5 px-2.5 text-[11px]"
          >
            <Pencil className="h-3.5 w-3.5" />
            {t("survey.list.actionEdit")}
          </Link>
          <SurveyCopyLinkButton publicPath={survey.publicPath} className="h-8 px-2.5" />
          <SurveyPreviewLink publicPath={survey.publicPath} className="h-8 px-2.5" />
        </div>
      </div>
    </article>
  );
}

export default function SurveyListWorkspace() {
  const { t, locale } = useTranslation();
  const dateFnsLocale = getDateFnsLocale(locale);
  const router = useRouter();
  const { branding } = useBranding();
  const [surveys, setSurveys] = useState<SurveyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingOpen, setCreatingOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const load = useCallback(async () => {
    try {
      const data = await listSurveys();
      setSurveys(data);
    } catch {
      setSurveys([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async () => {
    const title = newTitle.trim();
    if (!title) {
      toastError(t("survey.hub.titleEmpty"));
      return;
    }
    setSubmitting(true);
    const result = await createSurvey(title);
    setSubmitting(false);
    if (!result.ok) {
      toastError(result.error);
      return;
    }
    toastSuccess(t("survey.list.toast.created"));
    router.push(`/questionnaire/reponses/${result.surveyId}/edit`);
  };

  const audienceThemes = getAudienceThemes(t);

  return (
    <div className="space-y-5">
      <header className="ui-surface relative overflow-hidden rounded-[28px] p-8">
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="ui-kicker mb-1">{branding.appName}</p>
            <h1 className="ui-display text-2xl text-[var(--foreground)]">{t("survey.list.title")}</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[color:var(--foreground)]/60">
              {t("survey.list.subtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreatingOpen((v) => !v)}
            className="ui-btn ui-btn-primary gap-2"
          >
            {creatingOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {creatingOpen ? t("survey.common.cancel") : t("survey.list.newSurvey")}
          </button>
        </div>
      </header>

      {creatingOpen ? (
        <div className="ui-surface space-y-3 rounded-2xl p-5">
          <label className="flex flex-col gap-1 text-xs font-semibold text-[color:var(--foreground)]/55">
            {t("survey.list.newTitleLabel")}
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleCreate();
              }}
              placeholder={t("survey.list.placeholder")}
              className="ui-focus-ring rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm font-normal text-[var(--foreground)]"
            />
          </label>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={submitting}
              className="ui-btn ui-btn-primary gap-2"
            >
              <Plus className="h-4 w-4" />
              {submitting ? t("survey.list.creating") : t("survey.list.createAndConfigure")}
            </button>
          </div>
        </div>
      ) : null}

      {!loading && surveys.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {(["externe", "interne", "general"] as const).map((audience) => {
            const theme = audienceThemes[audience];
            if (!surveys.some((s) => s.audience === audience)) return null;
            return (
              <span
                key={audience}
                className={[
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
                  theme.badge,
                ].join(" ")}
              >
                <theme.icon className="h-3 w-3" />
                {theme.label}
              </span>
            );
          })}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-[color:var(--foreground)]/55">{t("survey.list.loading")}</p>
      ) : surveys.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title={t("emptyStates.survey.title")}
          description={t("emptyStates.survey.body")}
          actionLabel={t("emptyStates.survey.cta")}
          onAction={() => setCreatingOpen(true)}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {surveys.map((survey) => (
            <SurveyCard key={survey.id} survey={survey} formatDate={formatDate} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}
