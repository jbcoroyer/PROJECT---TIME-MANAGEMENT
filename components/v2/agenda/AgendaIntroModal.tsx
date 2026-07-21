"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  CalendarRange,
  CheckCircle2,
  Inbox,
  Link2,
  Share2,
} from "lucide-react";
import { completeAgendaIntro } from "../../../app/actions/agenda";
import { useBranding } from "../../../lib/brandingContext";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { toastError } from "../../../lib/toast";

type AgendaIntroModalProps = {
  onComplete: () => void;
};

type IntroStep = "welcome" | "link" | "flow";

const STEPS: IntroStep[] = ["welcome", "link", "flow"];

export default function AgendaIntroModal({ onComplete }: AgendaIntroModalProps) {
  const { t } = useTranslation();
  const { patchBranding } = useBranding();
  const [step, setStep] = useState<IntroStep>("welcome");
  const [submitting, setSubmitting] = useState(false);

  const stepIndex = STEPS.indexOf(step);

  const finish = async () => {
    setSubmitting(true);
    try {
      const result = await completeAgendaIntro();
      if (!result.ok) {
        toastError(result.error);
        return;
      }
      patchBranding({ agendaIntroCompleted: true });
      onComplete();
    } finally {
      setSubmitting(false);
    }
  };

  const stepContent =
    step === "welcome"
      ? {
          icon: CalendarRange,
          title: t("agenda.intro.welcome.title"),
          body: t("agenda.intro.welcome.body"),
          bullets: [
            t("agenda.intro.welcome.bullet1"),
            t("agenda.intro.welcome.bullet2"),
            t("agenda.intro.welcome.bullet3"),
          ],
          cta: t("agenda.intro.next"),
          onCta: () => setStep("link"),
        }
      : step === "link"
        ? {
            icon: Link2,
            title: t("agenda.intro.link.title"),
            body: t("agenda.intro.link.body"),
            bullets: [
              t("agenda.intro.link.bullet1"),
              t("agenda.intro.link.bullet2"),
              t("agenda.intro.link.bullet3"),
            ],
            cta: t("agenda.intro.next"),
            onCta: () => setStep("flow"),
          }
        : {
            icon: Share2,
            title: t("agenda.intro.flow.title"),
            body: t("agenda.intro.flow.body"),
            bullets: [
              t("agenda.intro.flow.bullet1"),
              t("agenda.intro.flow.bullet2"),
              t("agenda.intro.flow.bullet3"),
            ],
            cta: t("agenda.intro.finish"),
            onCta: () => void finish(),
          };

  const Icon = stepContent.icon;

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[calc(var(--z-overlay)+20)] flex items-center justify-center bg-[var(--foreground)]/45 p-4 backdrop-blur-[2px]"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="agenda-intro-title"
        className="ui-surface w-full max-w-lg rounded-2xl border border-[var(--line)] p-6 shadow-2xl sm:p-8"
      >
        <div className="mb-5 flex items-center justify-center gap-2">
          {STEPS.map((id, index) => (
            <span
              key={id}
              className={[
                "h-1.5 rounded-full transition-all",
                index <= stepIndex ? "w-8 bg-[var(--accent)]" : "w-4 bg-[var(--line)]",
              ].join(" ")}
            />
          ))}
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
          <Icon className="h-6 w-6" />
        </div>

        <h2 id="agenda-intro-title" className="mt-4 text-xl font-semibold text-[var(--foreground)]">
          {stepContent.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">{stepContent.body}</p>

        <ul className="mt-4 space-y-2">
          {stepContent.bullets.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {step === "flow" ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--ink-muted)]">
            <Inbox className="h-4 w-4 shrink-0 text-[var(--accent)]" />
            {t("agenda.intro.flow.hint")}
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-between gap-3">
          {stepIndex > 0 ? (
            <button
              type="button"
              disabled={submitting}
              onClick={() => setStep(STEPS[stepIndex - 1]!)}
              className="ui-btn ui-btn-ghost text-sm"
            >
              {t("common.back")}
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            disabled={submitting}
            onClick={stepContent.onCta}
            className="ui-btn ui-btn-primary gap-2"
          >
            {submitting ? t("common.saving") : stepContent.cta}
            {!submitting ? <ArrowRight className="h-4 w-4" /> : null}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
