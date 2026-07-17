"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Check, Circle, Rocket, Sparkles, Target, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "../../lib/i18n/useTranslation";
import { useGamification } from "../../lib/gamification/gamificationContext";
import { useCurrentUser } from "../../lib/useCurrentUser";
import {
  useFirstTaskTutorial,
  type FirstTaskTutorialStep,
} from "../../lib/onboarding/firstTaskTutorialContext";
import { useExplorationTutorialOptional } from "../../lib/onboarding/explorationTutorialContext";
import TutorialRewardCelebration from "./TutorialRewardCelebration";
import TutorialSpotlight from "./TutorialSpotlight";
import { getSupabaseBrowser } from "../../lib/supabaseBrowser";
import "./first-task-tutorial.css";

const QUEST_STEPS: FirstTaskTutorialStep[] = [
  "clickNewTask",
  "fillForm",
  "visitList",
  "editInList",
  "visitCalendar",
  "createEvent",
  "visitTodo",
];

function stepProgress(step: FirstTaskTutorialStep): number {
  if (step === "welcome") return 0;
  if (step === "clickNewTask") return 12;
  if (step === "fillForm") return 24;
  if (step === "celebrate") return 36;
  if (step === "visitList") return 48;
  if (step === "editInList") return 58;
  if (step === "visitCalendar") return 68;
  if (step === "exploreCalendar") return 74;
  if (step === "createEvent") return 82;
  if (step === "visitTodo") return 90;
  if (step === "exploreTodo") return 96;
  return 100;
}

function mapSavedStep(step?: string): FirstTaskTutorialStep {
  if (step === "welcome") return "welcome";
  if (step === "clickNewTask") return "clickNewTask";
  if (step === "fillForm") return "fillForm";
  if (step === "celebrate") return "celebrate";
  if (step === "visitList") return "visitList";
  if (step === "editInList") return "editInList";
  if (step === "visitCalendar") return "visitCalendar";
  if (step === "exploreCalendar") return "exploreCalendar";
  if (step === "createEvent") return "createEvent";
  if (step === "visitTodo") return "visitTodo";
  if (step === "exploreTodo") return "exploreTodo";
  return "clickNewTask";
}

export default function FirstTaskTutorial() {
  const { t } = useTranslation({ preferBrowser: true });
  const { user, loading, reload } = useCurrentUser();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const {
    profile: gamification,
    loading: gamificationLoading,
    setTutorialRuntime,
    completeTutorial,
    requestTutorialResume,
    clearTutorialResume,
    calendarEventModalOpen,
  } = useGamification();

  const {
    active,
    step,
    startTutorial,
    beginQuest,
    finishCelebration,
    notifyListTabOpened,
    continueToCalendar,
    notifyCalendarTabOpened,
    beginCreateEvent,
    notifyTodoTabOpened,
    finishFirstTaskTutorial,
    dismissTutorial,
  } = useFirstTaskTutorial();
  const exploration = useExplorationTutorialOptional();

  const initializedRef = useRef(false);
  const existingTasksCheckedRef = useRef(false);

  const needsTutorial = useMemo(() => {
    if (loading || gamificationLoading || !user || !gamification) return false;
    if (user.firstTaskTutorialCompleted || gamification.firstTaskTutorialCompleted) return false;
    const status = gamification.tutorials.first_task?.status;
    return status !== "completed" && status !== "skipped";
  }, [loading, gamificationLoading, user, gamification]);

  const onDashboard = pathname.startsWith("/dashboard");
  const activeTab = pathname.match(/^\/dashboard\/([^/?#]+)/)?.[1] ?? "kanban";

  const stripTourParam = useCallback(() => {
    if (searchParams.get("tour") !== "1") return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("tour");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (!needsTutorial || !onDashboard || !gamification || existingTasksCheckedRef.current) return;

    void (async () => {
      existingTasksCheckedRef.current = true;
      const supabase = getSupabaseBrowser();
      const { count, error } = await supabase
        .from("tasks")
        .select("id", { count: "exact", head: true });

      if (error || !count || count <= 0) return;

      initializedRef.current = true;
      setTutorialRuntime(false, "done");
      await completeTutorial("first_task");
      reload();
    })();
  }, [needsTutorial, onDashboard, gamification, setTutorialRuntime, completeTutorial, reload]);

  useEffect(() => {
    if (!needsTutorial || !onDashboard || !gamification) return;

    const saved = gamification.tutorials.first_task;

    if (requestTutorialResume) {
      clearTutorialResume();
      initializedRef.current = true;
      return;
    }

    if (initializedRef.current) return;

    if (saved?.status === "in_progress" && saved.step && saved.step !== "welcome") {
      initializedRef.current = true;
      const restored = mapSavedStep(saved.step);
      const resumeStep =
        restored === "celebrate"
          ? "visitList"
          : restored;
      setTutorialRuntime(true, resumeStep);
      stripTourParam();
      return;
    }

    if (searchParams.get("tour") === "1") {
      initializedRef.current = true;
      if (!saved || saved.status === "pending" || !saved.status) {
        startTutorial();
      } else if (saved.status === "in_progress") {
        setTutorialRuntime(true, mapSavedStep(saved.step));
      }
      stripTourParam();
    }
  }, [
    needsTutorial,
    onDashboard,
    gamification,
    searchParams,
    startTutorial,
    setTutorialRuntime,
    stripTourParam,
    requestTutorialResume,
    clearTutorialResume,
  ]);

  useEffect(() => {
    if (step !== "visitList" || activeTab !== "list") return;
    notifyListTabOpened();
  }, [step, activeTab, notifyListTabOpened]);

  useEffect(() => {
    if (step !== "visitCalendar" || activeTab !== "calendar") return;
    notifyCalendarTabOpened();
  }, [step, activeTab, notifyCalendarTabOpened]);

  useEffect(() => {
    if (step !== "exploreTodo") return;
    if (activeTab === "todo") return;
    router.push("/dashboard/todo", { scroll: false });
  }, [step, activeTab, router]);

  const handleCelebrationComplete = useCallback(() => {
    finishCelebration();
    if (activeTab === "list") {
      notifyListTabOpened();
    } else {
      router.push("/dashboard/list", { scroll: false });
    }
  }, [finishCelebration, activeTab, router, notifyListTabOpened]);

  const handleContinueToCalendar = useCallback(() => {
    continueToCalendar();
    if (activeTab !== "calendar") {
      router.push("/dashboard/calendar", { scroll: false });
    }
  }, [continueToCalendar, activeTab, router]);

  const handleBeginCreateEvent = useCallback(() => {
    beginCreateEvent();
    if (activeTab !== "calendar") {
      router.push("/dashboard/calendar", { scroll: false });
    }
  }, [beginCreateEvent, activeTab, router]);

  const handleFinishTutorial = useCallback(async () => {
    await completeTutorial("first_task");
    reload();
    finishFirstTaskTutorial();
    stripTourParam();
    exploration?.startBoardExploration();
  }, [completeTutorial, finishFirstTaskTutorial, reload, stripTourParam, exploration]);

  const handlePause = useCallback(() => {
    dismissTutorial();
    stripTourParam();
  }, [dismissTutorial, stripTourParam]);

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

  const pauseButton = (
    <button
      type="button"
      onClick={handlePause}
      className="mt-3 flex w-full items-center justify-center gap-1.5 text-xs font-medium text-[color:var(--foreground)]/50 hover:text-[var(--foreground)]"
    >
      <X className="h-3.5 w-3.5" aria-hidden />
      {t("gamification.tutorials.pause")}
    </button>
  );

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
          {pauseButton}
        </div>
      </div>,
      document.body,
    );
  }

  if (step === "celebrate") {
    return <TutorialRewardCelebration open onComplete={handleCelebrationComplete} />;
  }

  if (step === "done" || !active) return null;

  const questTotal = String(QUEST_STEPS.length);

  return (
    <>
      {step === "clickNewTask" ? (
        <TutorialSpotlight targetSelector='[data-tutorial="new-task-button"]' visible cardPosition="bottom">
          <span className="first-task-tutorial__badge">
            <Sparkles className="h-3 w-3" aria-hidden />
            {t("firstTaskTutorial.spotlight.quest", { current: "1", total: questTotal })}
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
          {pauseButton}
        </TutorialSpotlight>
      ) : null}

      {step === "fillForm" ? (
        <TutorialSpotlight
          targetSelector='[data-tutorial="new-task-modal"]'
          visible
          padding={12}
          cardPosition="bottom-right"
        >
          <span className="first-task-tutorial__badge">
            <Sparkles className="h-3 w-3" aria-hidden />
            {t("firstTaskTutorial.spotlight.quest", { current: "2", total: questTotal })}
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
          {pauseButton}
        </TutorialSpotlight>
      ) : null}

      {step === "visitList" ? (
        <TutorialSpotlight
          targetSelector='[data-tutorial="dashboard-tab-list"]'
          visible
          cardPosition="bottom"
        >
          <span className="first-task-tutorial__badge">
            <Sparkles className="h-3 w-3" aria-hidden />
            {t("firstTaskTutorial.spotlight.quest", { current: "3", total: questTotal })}
          </span>
          <h3 className="mt-2 text-base font-semibold text-[var(--foreground)]">
            {t("firstTaskTutorial.spotlight.listTitle")}
          </h3>
          <p className="mt-1.5 text-sm text-[color:var(--foreground)]/65">
            {t("firstTaskTutorial.spotlight.listBody")}
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
          {pauseButton}
        </TutorialSpotlight>
      ) : null}

      {step === "editInList" && activeTab === "list" ? (
        <TutorialSpotlight
          targetSelector='[data-tutorial="list-view-panel"]'
          visible
          padding={8}
          cardPosition="bottom-right"
        >
          <span className="first-task-tutorial__badge">
            <Sparkles className="h-3 w-3" aria-hidden />
            {t("firstTaskTutorial.spotlight.quest", { current: "4", total: questTotal })}
          </span>
          <h3 className="mt-2 text-base font-semibold text-[var(--foreground)]">
            {t("firstTaskTutorial.spotlight.editTitle")}
          </h3>
          <p className="mt-1.5 text-sm text-[color:var(--foreground)]/65">
            {t("firstTaskTutorial.spotlight.editBody")}
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
          <button
            type="button"
            onClick={handleContinueToCalendar}
            className="ui-btn ui-btn-primary mt-4 inline-flex w-full items-center justify-center gap-2 px-4 py-2 text-sm font-semibold"
          >
            <ArrowRight className="h-4 w-4" aria-hidden />
            {t("firstTaskTutorial.spotlight.continueCalendar")}
          </button>
          {pauseButton}
        </TutorialSpotlight>
      ) : null}

      {step === "visitCalendar" ? (
        <TutorialSpotlight
          targetSelector='[data-tutorial="dashboard-tab-calendar"]'
          visible
          cardPosition="bottom"
        >
          <span className="first-task-tutorial__badge">
            <Sparkles className="h-3 w-3" aria-hidden />
            {t("firstTaskTutorial.spotlight.quest", { current: "5", total: questTotal })}
          </span>
          <h3 className="mt-2 text-base font-semibold text-[var(--foreground)]">
            {t("firstTaskTutorial.spotlight.calendarTitle")}
          </h3>
          <p className="mt-1.5 text-sm text-[color:var(--foreground)]/65">
            {t("firstTaskTutorial.spotlight.calendarBody")}
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
          {pauseButton}
        </TutorialSpotlight>
      ) : null}

      {step === "exploreCalendar" && activeTab === "calendar" ? (
        <TutorialSpotlight
          targetSelector='[data-tutorial="calendar-view-panel"]'
          visible
          padding={8}
          cardPosition="bottom-right"
        >
          <span className="first-task-tutorial__badge">
            <Sparkles className="h-3 w-3" aria-hidden />
            {t("firstTaskTutorial.spotlight.quest", { current: "5", total: questTotal })}
          </span>
          <h3 className="mt-2 text-base font-semibold text-[var(--foreground)]">
            {t("firstTaskTutorial.spotlight.calendarTitle")}
          </h3>
          <p className="mt-1.5 text-sm text-[color:var(--foreground)]/65">
            {t("firstTaskTutorial.spotlight.calendarBody")}
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
          <button
            type="button"
            onClick={handleBeginCreateEvent}
            className="ui-btn ui-btn-primary mt-4 inline-flex w-full items-center justify-center gap-2 px-4 py-2 text-sm font-semibold"
          >
            <ArrowRight className="h-4 w-4" aria-hidden />
            {t("firstTaskTutorial.spotlight.createEventCta")}
          </button>
          {pauseButton}
        </TutorialSpotlight>
      ) : null}

      {step === "createEvent" && activeTab === "calendar" ? (
        calendarEventModalOpen ? (
          <TutorialSpotlight
            targetSelector='[data-tutorial="calendar-event-modal"]'
            visible
            padding={12}
            cardPosition="bottom-right"
          >
            <span className="first-task-tutorial__badge">
              <Sparkles className="h-3 w-3" aria-hidden />
              {t("firstTaskTutorial.spotlight.quest", { current: "6", total: questTotal })}
            </span>
            <h3 className="mt-2 text-base font-semibold text-[var(--foreground)]">
              {t("firstTaskTutorial.spotlight.createEventTitle")}
            </h3>
            <p className="mt-1.5 text-sm text-[color:var(--foreground)]/65">
              {t("firstTaskTutorial.spotlight.createEventBody")}
            </p>
            <div className="first-task-tutorial__xp-bar">
              <div className="first-task-tutorial__xp-fill" style={{ width: `${progress}%` }} />
            </div>
            {pauseButton}
          </TutorialSpotlight>
        ) : (
          <TutorialSpotlight
            targetSelector='[data-tutorial="calendar-add-event"]'
            visible
            cardPosition="left"
          >
            <span className="first-task-tutorial__badge">
              <Sparkles className="h-3 w-3" aria-hidden />
              {t("firstTaskTutorial.spotlight.quest", { current: "6", total: questTotal })}
            </span>
            <h3 className="mt-2 text-base font-semibold text-[var(--foreground)]">
              {t("firstTaskTutorial.spotlight.createEventTitle")}
            </h3>
            <p className="mt-1.5 text-sm text-[color:var(--foreground)]/65">
              {t("firstTaskTutorial.spotlight.createEventBody")}
            </p>
            <div className="first-task-tutorial__xp-bar">
              <div className="first-task-tutorial__xp-fill" style={{ width: `${progress}%` }} />
            </div>
            {pauseButton}
          </TutorialSpotlight>
        )
      ) : null}

      {step === "exploreTodo" && activeTab === "todo"
        ? createPortal(
            <div className="first-task-tutorial__welcome" role="dialog" aria-modal="true">
              <div className="first-task-tutorial__welcome-card">
                <span className="first-task-tutorial__badge">
                  <Sparkles className="h-3 w-3" aria-hidden />
                  {t("firstTaskTutorial.spotlight.quest", { current: "7", total: questTotal })}
                </span>
                <h2 className="mt-3 text-2xl font-bold text-[var(--foreground)]">
                  {t("firstTaskTutorial.spotlight.todoFinishTitle")}
                </h2>
                <p className="mt-2 text-sm text-[color:var(--foreground)]/65">
                  {t("firstTaskTutorial.spotlight.todoFinishBody")}
                </p>
                <ul className="first-task-tutorial__steps mt-4 text-left">
                  {(["kanban", "list", "calendar", "todo"] as const).map((space) => (
                    <li key={space} className="first-task-tutorial__step-item first-task-tutorial__step-item--done">
                      <Check className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" aria-hidden />
                      {t(`firstTaskTutorial.spotlight.todoFinishSpaces.${space}`)}
                    </li>
                  ))}
                </ul>
                <div className="first-task-tutorial__xp-bar">
                  <div className="first-task-tutorial__xp-fill" style={{ width: "100%" }} />
                </div>
                <button
                  type="button"
                  onClick={() => void handleFinishTutorial()}
                  className="ui-btn ui-btn-primary mt-5 inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold"
                >
                  <Rocket className="h-4 w-4" aria-hidden />
                  {t("firstTaskTutorial.spotlight.todoFinishCta")}
                </button>
                {pauseButton}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
