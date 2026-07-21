"use client";

import { useState } from "react";
import {
  ArrowDownUp,
  ArrowRight,
  BarChart3,
  ClipboardList,
  Lightbulb,
  Package,
  Sparkles,
} from "lucide-react";
import { completeStockOnboarding } from "../../../app/actions/stockSettings";
import { useBranding } from "../../../lib/brandingContext";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import type { StockCategoryOption } from "../../../lib/stockCategories";
import { toastError } from "../../../lib/toast";
import StockCategoriesEditor from "./StockCategoriesEditor";

type StockOnboardingWizardProps = {
  onComplete: () => void;
};

type WizardStep = "welcome" | "categories" | "tour";

const TOUR_FEATURE_IDS = ["inventory", "movements", "alerts", "history", "events", "ideas"] as const;

export default function StockOnboardingWizard({ onComplete }: StockOnboardingWizardProps) {
  const { t } = useTranslation();
  const { patchBranding } = useBranding();
  const [step, setStep] = useState<WizardStep>("welcome");
  const [selected, setSelected] = useState<StockCategoryOption[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleFinish = async () => {
    if (selected.length === 0) {
      toastError(t("stock.onboarding.categories.minOne"));
      return;
    }
    setSubmitting(true);
    try {
      const result = await completeStockOnboarding(selected);
      if (!result.ok) {
        toastError(result.error);
        return;
      }
      patchBranding({
        inventoryCategories: selected,
        stockOnboardingCompleted: true,
      });
      onComplete();
    } finally {
      setSubmitting(false);
    }
  };

  const stepIndex = step === "welcome" ? 0 : step === "categories" ? 1 : 2;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center px-4 py-10">
      <div className="mb-8 flex items-center justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={[
              "h-1.5 rounded-full transition-all",
              i <= stepIndex ? "w-8 bg-[var(--accent)]" : "w-4 bg-[var(--line)]",
            ].join(" ")}
          />
        ))}
      </div>

      {step === "welcome" ? (
        <div className="ui-surface rounded-3xl p-8 sm:p-10">
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <Package className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
            {t("stock.onboarding.welcome.title")}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-[var(--ink-muted)]">
            {t("stock.onboarding.welcome.body")}
          </p>
          <ul className="mt-6 space-y-3">
            {(["step1", "step2", "step3"] as const).map((key) => (
              <li key={key} className="flex items-start gap-3 text-sm text-[color:var(--foreground)]/80">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-bold text-[var(--accent)]">
                  {key === "step1" ? "1" : key === "step2" ? "2" : "3"}
                </span>
                {t(`stock.onboarding.welcome.${key}`)}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setStep("categories")}
            className="ui-btn ui-btn-primary mt-8 gap-2"
          >
            {t("stock.onboarding.welcome.cta")}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {step === "categories" ? (
        <div className="ui-surface rounded-3xl p-8 sm:p-10">
          <h2 className="text-xl font-bold text-[var(--foreground)] sm:text-2xl">
            {t("stock.onboarding.categories.title")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-muted)]">
            {t("stock.onboarding.categories.description")}
          </p>

          <div className="mt-6">
            <StockCategoriesEditor categories={selected} onChange={setSelected} />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={() => setStep("welcome")} className="ui-btn ui-btn-secondary">
              {t("common.back")}
            </button>
            <button
              type="button"
              disabled={selected.length === 0}
              onClick={() => setStep("tour")}
              className="ui-btn ui-btn-primary gap-2"
            >
              {t("common.continue")}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      {step === "tour" ? (
        <div className="ui-surface rounded-3xl p-8 sm:p-10">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
            <Sparkles className="h-3.5 w-3.5" />
            {t("stock.onboarding.tour.badge")}
          </div>
          <h2 className="text-xl font-bold text-[var(--foreground)] sm:text-2xl">
            {t("stock.onboarding.tour.title")}
          </h2>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">{t("stock.onboarding.tour.description")}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {TOUR_FEATURE_IDS.map((id) => {
              const icons = {
                inventory: Package,
                movements: ArrowDownUp,
                alerts: BarChart3,
                history: ClipboardList,
                events: Sparkles,
                ideas: Lightbulb,
              } as const;
              const Icon = icons[id];
              return (
                <div
                  key={id}
                  className="rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-4"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--surface)] text-[var(--accent)]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-[var(--foreground)]">
                    {t(`stock.onboarding.tour.features.${id}.title`)}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--ink-muted)]">
                    {t(`stock.onboarding.tour.features.${id}.body`)}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={() => setStep("categories")} className="ui-btn ui-btn-secondary">
              {t("common.back")}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleFinish()}
              className="ui-btn ui-btn-primary gap-2"
            >
              {submitting ? t("stock.onboarding.tour.launching") : t("stock.onboarding.tour.cta")}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
