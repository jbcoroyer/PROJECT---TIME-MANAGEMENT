"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { Check, Circle, Rocket, Sparkles, Target } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { completeFirstTaskTutorial } from "../../app/actions/onboarding";
import { useTranslation } from "../../lib/i18n/useTranslation";
import { useCurrentUser } from "../../lib/useCurrentUser";
import {
  useFirstTaskTutorial,
  type FirstTaskTutorialStep,
} from "../../lib/onboarding/firstTaskTutorialContext";
import TutorialRewardCelebration from "./TutorialRewardCelebration";
import TutorialSpotlight from "./TutorialSpotlight";
import { markProductTourPending } from "./ProductTour";
import "./first-task-tutorial.css";

const QUEST_STEPS: FirstTaskTutorialStep[] = ["clickNewTask", "fillForm"];

function stepProgress(step: FirstTaskTutorialStep): number {
  if (step === "welcome") return 0;
  if (step === "clickNewTask") return 33;
  if (step === "fillForm") return 66;
  if (step === "celebrate") return 100;
  return 100;
}

export default function FirstTaskTutorial() {
  const { t } = useTranslation({ preferBrowser: true });
  const { user, loading, reload } = useCurrentUser();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const {
    active,
    step,
    startTutorial,
    beginQuest,
    finishCelebration,
    dismissTutorial,
  } = useFirstTaskTutorial();

  const startedRef = useRef(false);

  const needsTutorial = useMemo(() => {
    if (loading || !user) return false;
    return !user.firstTaskTutorialCompleted;
  }, [loading, user]);

  const onDashboard = pathname.startsWith("/dashboard");

  useEffect(() => {
    if (!needsTutorial || !onDashboard) return;
    if (searchParams.get("tour") !== "1") return;
    if (startedRef.current) return;
    startedRef.current = true;
    startTutorial();
  }, [needsTutorial, onDashboard, searchParams, startTutorial]);

  const handleCelebrationComplete = useCallback(async () => {
    const result = await completeFirstTaskTutorial();
    if (result.ok) {
      reload();
      markProductTourPending();
    }
    finishCelebration();
    dismissTutorial();

    if (searchParams.get("tour") === "1") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("tour");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    }
  }, [
    dismissTutorial,
    finishCelebration,
    pathname,
    reload,
    router,
    searchParams,
  ]);

  if (!needsTutorial || !onDashboard) return null;

  const progress = stepProgress(step);

  const questItems = QUEST_STEPS.map((questStep) => {
    const index = QUEST_STEPS.indexOf(questStep);
    const currentIndex = QUEST_STEPS.indexOf(step as (typeof QUEST_STEPS)[number]);
    const done =
      step === "celebrate" ||
      step === "done" ||
      (currentIndex > index && currentIndex !== -1);
    const current = step === questStep;
    return { questStep, done, current };
  });

  if (step === "welcome") {
    return createPortal(
      <div className="first-task-tutorial__welcome" role="dialog" aria-modal="true">
        <div className="first-task-tutorial__welcome-card">
          <span className="first-task-tutorial__badge">
            <Sparkles className="h-3 w-3" aria-hidden />
            {t("firstTaskTutorial.welcome.badge")}
          </span>
          <h2 className="mt-3 text-2xl font-bold text-[var(--foreground)]">
            {t("firstTaskTutorial.welcome.title")}
          </h2>
          <p className="mt-2 text-sm text-[color:var(--foreground)]/65">
            {t("firstTaskTutorial.welcome.body")}
          </p>
          <ul className="first-task-tutorial__steps mt-4 text-left">
            {QUEST_STEPS.map((questStep) => (
              <li key={questStep} className="first-task-tutorial__step-item first-task-tutorial__step-item--current">
                <Target className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" aria-hidden />
                {t(`firstTaskTutorial.quest.${questStep}`)}
              </li>
            ))}
          </ul>
          <div className="first-task-tutorial__xp-bar">
            <div className="first-task-tutorial__xp-fill" style={{ width: "8%" }} />
          </div>
          <p className="mt-2 text-[11px] font-semibold text-[color:var(--foreground)]/45">
            {t("firstTaskTutorial.welcome.xpHint")}
          </p>
          <button
            type="button"
            onClick={beginQuest}
            className="ui-btn ui-btn-primary mt-5 inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold"
          >
            <Rocket className="h-4 w-4" aria-hidden />
            {t("firstTaskTutorial.welcome.cta")}
          </button>
        </div>
      </div>,
      document.body,
    );
  }

  if (step === "celebrate") {
    return <TutorialRewardCelebration open onComplete={() => void handleCelebrationComplete()} />;
  }

  if (step === "done" || !active) return null;

  return (
    <>
      {step === "clickNewTask" ? (
        <TutorialSpotlight targetSelector='[data-tutorial="new-task-button"]' visible cardPosition="bottom">
          <span className="first-task-tutorial__badge">
            <Sparkles className="h-3 w-3" aria-hidden />
            {t("firstTaskTutorial.spotlight.quest", { current: "1", total: "2" })}
          </span>
          <h3 className="mt-2 text-base font-semibold text-[var(--foreground)]">
            {t("firstTaskTutorial.spotlight.clickTitle")}
          </h3>
          <p className="mt-1.5 text-sm text-[color:var(--foreground)]/65">
            {t("firstTaskTutorial.spotlight.clickBody")}
          </p>
          <ul className="first-task-tutorial__steps">
            {questItems.map(({ questStep, done, current }) => (
              <li
                key={questStep}
                className={[
                  "first-task-tutorial__step-item",
                  done ? "first-task-tutorial__step-item--done" : "",
                  current ? "first-task-tutorial__step-item--current" : "",
                ].join(" ")}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" aria-hidden />
                ) : (
                  <Circle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                )}
                {t(`firstTaskTutorial.quest.${questStep}`)}
              </li>
            ))}
          </ul>
          <div className="first-task-tutorial__xp-bar">
            <div className="first-task-tutorial__xp-fill" style={{ width: `${progress}%` }} />
          </div>
        </TutorialSpotlight>
      ) : null}

      {step === "fillForm" ? (
        <TutorialSpotlight
          targetSelector='[data-tutorial="new-task-modal"]'
          visible
          padding={12}
          cardPosition="top"
        >
          <span className="first-task-tutorial__badge">
            <Sparkles className="h-3 w-3" aria-hidden />
            {t("firstTaskTutorial.spotlight.quest", { current: "2", total: "2" })}
          </span>
          <h3 className="mt-2 text-base font-semibold text-[var(--foreground)]">
            {t("firstTaskTutorial.spotlight.fillTitle")}
          </h3>
          <p className="mt-1.5 text-sm text-[color:var(--foreground)]/65">
            {t("firstTaskTutorial.spotlight.fillBody")}
          </p>
          <ul className="first-task-tutorial__steps">
            {questItems.map(({ questStep, done, current }) => (
              <li
                key={questStep}
                className={[
                  "first-task-tutorial__step-item",
                  done ? "first-task-tutorial__step-item--done" : "",
                  current ? "first-task-tutorial__step-item--current" : "",
                ].join(" ")}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" aria-hidden />
                ) : (
                  <Circle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                )}
                {t(`firstTaskTutorial.quest.${questStep}`)}
              </li>
            ))}
          </ul>
          <div className="first-task-tutorial__xp-bar">
            <div className="first-task-tutorial__xp-fill" style={{ width: `${progress}%` }} />
          </div>
        </TutorialSpotlight>
      ) : null}
    </>
  );
}
