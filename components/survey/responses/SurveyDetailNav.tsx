"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, Check, ClipboardList, Copy, ExternalLink, Pencil } from "lucide-react";
import { toastError, toastSuccess } from "../../../lib/toast";
import { useTranslation } from "../../../lib/i18n/useTranslation";

export type SurveyDetailTab = "overview" | "edit" | "responses";

type SurveyDetailNavProps = {
  surveyId: string;
  active: SurveyDetailTab;
  title?: string;
};

export function SurveyCopyLinkButton({
  publicPath,
  className = "",
}: {
  publicPath: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const url =
      typeof window !== "undefined" ? `${window.location.origin}${publicPath}` : publicPath;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toastSuccess(t("survey.nav.linkCopied"));
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toastError(t("survey.nav.linkCopyFailed"));
    }
  };

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className={["ui-btn ui-btn-secondary gap-2 text-xs", className].filter(Boolean).join(" ")}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? t("survey.nav.copied") : t("survey.nav.copyLink")}
    </button>
  );
}

export default function SurveyDetailNav({ surveyId, active, title }: SurveyDetailNavProps) {
  const { t } = useTranslation();

  const tabs: { id: SurveyDetailTab; href: string; label: string; icon: typeof ClipboardList }[] = [
    {
      id: "overview",
      href: `/questionnaire/reponses/${surveyId}`,
      label: t("survey.nav.overview"),
      icon: ClipboardList,
    },
    {
      id: "edit",
      href: `/questionnaire/reponses/${surveyId}/edit`,
      label: t("survey.nav.edit"),
      icon: Pencil,
    },
    {
      id: "responses",
      href: `/questionnaire/reponses/${surveyId}/reponses`,
      label: t("survey.nav.responses"),
      icon: BarChart3,
    },
  ];

  return (
    <div className="space-y-3">
      <Link
        href="/questionnaire/reponses"
        className="inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--foreground)]/50 hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t("survey.nav.backToList")}
      </Link>

      {title ? (
        <h1 className="ui-display text-2xl text-[var(--foreground)]">{title}</h1>
      ) : null}

      <div className="flex gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === active;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={[
                "ui-transition flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold sm:text-sm",
                isActive
                  ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                  : "text-[color:var(--foreground)]/55 hover:text-[var(--foreground)]",
              ].join(" ")}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function SurveyPreviewLink({
  publicPath,
  className = "",
}: {
  publicPath: string;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <a
      href={publicPath}
      target="_blank"
      rel="noopener noreferrer"
      className={["ui-btn ui-btn-ghost gap-2 text-xs", className].filter(Boolean).join(" ")}
    >
      <ExternalLink className="h-3.5 w-3.5" />
      {t("survey.nav.preview")}
    </a>
  );
}
