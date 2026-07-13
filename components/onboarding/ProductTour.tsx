"use client";

import { useState } from "react";
import { X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  TOUR_EXAMPLE_KEYS,
  TOUR_STEPS,
  buildFirstTaskHref,
} from "../../lib/onboarding/tourConfig";
import { useTranslation } from "../../lib/i18n/useTranslation";
import "./product-tour.css";

const TOUR_STORAGE_KEY = "workspace_product_tour_done";

export default function ProductTour() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useTranslation({ preferBrowser: true });
  const fromSetup = searchParams.get("tour") === "1";
  const [tourDone, setTourDone] = useState(() => {
    if (typeof window === "undefined") return false;
    return Boolean(window.localStorage.getItem(TOUR_STORAGE_KEY));
  });
  const [dismissed, setDismissed] = useState(false);
  const open = !dismissed && (!tourDone || fromSetup);
  const [step, setStep] = useState(0);
  const [taskDraft, setTaskDraft] = useState("");

  function closeTour() {
    window.localStorage.setItem(TOUR_STORAGE_KEY, "1");
    setTourDone(true);
    setDismissed(true);
    if (searchParams.get("tour") === "1") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("tour");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    }
  }

  if (!open) return null;

  const current = TOUR_STEPS[step];
  const isLast = step >= TOUR_STEPS.length - 1;
  const isFirstTaskStep = current.id === "firstTask";
  const trimmedDraft = taskDraft.trim();
  const goHref =
    current.id === "firstTask"
      ? buildFirstTaskHref({ taskDraft: trimmedDraft || undefined })
      : current.href;

  return (
    <div
      className={[
        "product-tour relative rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-2)]",
        isFirstTaskStep ? "product-tour--task" : "",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={closeTour}
        className="absolute right-3 top-3 rounded-lg p-1 text-[color:var(--foreground)]/40 hover:bg-[var(--surface-soft)]"
        aria-label={t("tour.close")}
      >
        <X className="h-4 w-4" />
      </button>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--foreground)]/45">
        {t("tour.stepOf", { current: String(step + 1), total: String(TOUR_STEPS.length) })}
      </p>
      <h3 className="mt-1 text-base font-semibold text-[var(--foreground)]">
        {t(`tour.steps.${current.id}.title`)}
      </h3>
      <p className="mt-2 text-sm text-[color:var(--foreground)]/65">{t(`tour.steps.${current.id}.body`)}</p>

      <p className="product-tour__examples-label">{t("tour.examplesLabel")}</p>
      <ul className="product-tour__examples" aria-label={t("tour.examplesLabel")}>
        {TOUR_EXAMPLE_KEYS.map((key) => {
          const example = t(`tour.steps.${current.id}.examples.${key}`);
          const active = isFirstTaskStep && trimmedDraft === example;
          return (
            <li key={key}>
              {isFirstTaskStep ? (
                <button
                  type="button"
                  className={[
                    "product-tour__example",
                    active ? "product-tour__example--active" : "",
                  ].join(" ")}
                  onClick={() => setTaskDraft(example)}
                >
                  {example}
                </button>
              ) : (
                <span className="product-tour__example product-tour__example--static">{example}</span>
              )}
            </li>
          );
        })}
      </ul>

      {isFirstTaskStep ? (
        <div className="product-tour__task-form">
          <label htmlFor="tour-task-draft" className="sr-only">
            {t("tour.taskInputLabel")}
          </label>
          <input
            id="tour-task-draft"
            type="text"
            value={taskDraft}
            onChange={(event) => setTaskDraft(event.target.value)}
            placeholder={t("tour.taskInputPlaceholder")}
            className="product-tour__task-input"
          />
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={closeTour}
          className="text-sm font-medium text-[color:var(--foreground)]/50 hover:text-[var(--foreground)]"
        >
          {t("tour.skip")}
        </button>
        <div className="flex flex-wrap justify-end gap-2">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((value) => value - 1)}
              className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm font-semibold"
            >
              {t("tour.back")}
            </button>
          ) : null}
          {isFirstTaskStep && trimmedDraft ? (
            <Link
              href={buildFirstTaskHref({ taskDraft: trimmedDraft, createTask: true })}
              onClick={closeTour}
              className="ui-btn ui-btn-primary px-3 py-2 text-sm"
            >
              {t("tour.createTask")}
            </Link>
          ) : null}
          <Link
            href={goHref}
            onClick={closeTour}
            className="ui-btn ui-btn-secondary px-3 py-2 text-sm"
          >
            {t("tour.goThere")}
          </Link>
          {isLast ? (
            <button type="button" onClick={closeTour} className="ui-btn ui-btn-primary px-3 py-2 text-sm">
              {t("tour.finish")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep((value) => value + 1)}
              className="ui-btn ui-btn-primary px-3 py-2 text-sm"
            >
              {t("tour.next")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function markProductTourPending() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOUR_STORAGE_KEY);
}
