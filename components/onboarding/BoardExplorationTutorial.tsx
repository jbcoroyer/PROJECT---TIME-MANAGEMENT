"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, Check, Circle, Map, Plus, Sparkles, X } from "lucide-react";
import { useTranslation } from "../../lib/i18n/useTranslation";
import { useExplorationTutorialOptional } from "../../lib/onboarding/explorationTutorialContext";
import TutorialSpotlight from "./TutorialSpotlight";
import TutorialRewardCelebration from "./TutorialRewardCelebration";
import "./first-task-tutorial.css";

const VISIT_STEPS = ["visit_list", "visit_calendar", "visit_todo"] as const;

function boardProgress(step: string): number {
  if (step === "intro") return 10;
  if (step === "add_column") return 30;
  if (step === "visit_list") return 50;
  if (step === "visit_calendar") return 70;
  if (step === "visit_todo") return 85;
  if (step === "celebrate") return 100;
  return 0;
}

export default function BoardExplorationTutorial() {
  const { t } = useTranslation({ preferBrowser: true });
  const pathname = usePathname();
  const router = useRouter();
  const exploration = useExplorationTutorialOptional();

  const activeTab = pathname.match(/^\/dashboard\/([^/?#]+)/)?.[1] ?? "kanban";

  useEffect(() => {
    if (!exploration?.boardActive) return;
    if (exploration.boardStep === "add_column" && activeTab !== "kanban") {
      router.replace("/dashboard/kanban", { scroll: false });
      return;
    }
    if (activeTab === "list" && exploration.boardStep === "visit_list") {
      exploration.notifyTabVisited("list");
    }
    if (activeTab === "calendar" && exploration.boardStep === "visit_calendar") {
      exploration.notifyTabVisited("calendar");
    }
    if (activeTab === "todo" && exploration.boardStep === "visit_todo") {
      exploration.notifyTabVisited("todo");
    }
  }, [activeTab, exploration, router]);

  if (!exploration?.boardActive || !pathname.startsWith("/dashboard")) return null;

  const { boardStep, completeBoardCelebration, pauseBoardExploration, beginBoardQuest } =
    exploration;
  const progress = boardProgress(boardStep);

  const pauseButton = (
    <button
      type="button"
      onClick={pauseBoardExploration}
      className="mt-3 flex w-full items-center justify-center gap-1.5 text-xs font-medium text-[color:var(--foreground)]/50 hover:text-[var(--foreground)]"
    >
      <X className="h-3.5 w-3.5" aria-hidden />
      {t("gamification.tutorials.pause")}
    </button>
  );

  const questItems = [
    { id: "add_column", done: progress >= 50 },
    { id: "visit_views", done: progress >= 85 },
  ];

  const questList = (
    <ul className="first-task-tutorial__steps">
      {questItems.map(({ id, done }) => (
        <li
          key={id}
          className={[
            "first-task-tutorial__step-item",
            done ? "first-task-tutorial__step-item--done" : "",
            !done && boardStep === "add_column" && id === "add_column"
              ? "first-task-tutorial__step-item--current"
              : "",
            !done && VISIT_STEPS.includes(boardStep as (typeof VISIT_STEPS)[number]) && id === "visit_views"
              ? "first-task-tutorial__step-item--current"
              : "",
          ].join(" ")}
        >
          {done ? (
            <Check className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" aria-hidden />
          ) : (
            <Circle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          )}
          {t(`boardExploration.quest.${id}`)}
        </li>
      ))}
    </ul>
  );

  if (boardStep === "intro") {
    return createPortal(
      <div className="first-task-tutorial__welcome" role="dialog" aria-modal="true">
        <div className="first-task-tutorial__welcome-card">
          <span className="first-task-tutorial__badge">
            <Map className="h-3 w-3" aria-hidden />
            {t("boardExploration.intro.badge")}
          </span>
          <h2 className="mt-3 text-2xl font-bold text-[var(--foreground)]">
            {t("boardExploration.intro.title")}
          </h2>
          <p className="mt-2 text-sm text-[color:var(--foreground)]/65">
            {t("boardExploration.intro.body")}
          </p>
          <ul className="first-task-tutorial__steps mt-4 text-left">
            <li className="first-task-tutorial__step-item first-task-tutorial__step-item--current">
              <Plus className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" aria-hidden />
              {t("boardExploration.quest.addColumn")}
            </li>
            <li className="first-task-tutorial__step-item">
              <Map className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" aria-hidden />
              {t("boardExploration.quest.visitViews")}
            </li>
          </ul>
          <div className="first-task-tutorial__xp-bar">
            <div className="first-task-tutorial__xp-fill" style={{ width: "12%" }} />
          </div>
          <p className="mt-2 text-[11px] font-semibold text-[color:var(--foreground)]/45">
            {t("boardExploration.intro.xpHint")}
          </p>
          <button
            type="button"
            onClick={beginBoardQuest}
            className="ui-btn ui-btn-primary mt-5 inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold"
          >
            <ArrowRight className="h-4 w-4" aria-hidden />
            {t("boardExploration.intro.cta")}
          </button>
          {pauseButton}
        </div>
      </div>,
      document.body,
    );
  }

  if (boardStep === "celebrate") {
    return (
      <TutorialRewardCelebration
        open
        messagePrefix="boardExploration.reward"
        onComplete={() => void completeBoardCelebration()}
      />
    );
  }

  return (
    <>
      {boardStep === "add_column" && activeTab === "kanban" ? (
        <TutorialSpotlight
          targetSelector='[data-tutorial="add-column-button"]'
          visible
          cardPosition="left"
        >
          <span className="first-task-tutorial__badge">
            <Sparkles className="h-3 w-3" aria-hidden />
            {t("boardExploration.spotlight.step", { current: "1", total: "4" })}
          </span>
          <h3 className="mt-2 text-base font-semibold text-[var(--foreground)]">
            {t("boardExploration.spotlight.addColumnTitle")}
          </h3>
          <p className="mt-1.5 text-sm text-[color:var(--foreground)]/65">
            {t("boardExploration.spotlight.addColumnBody")}
          </p>
          {questList}
          <div className="first-task-tutorial__xp-bar">
            <div className="first-task-tutorial__xp-fill" style={{ width: `${progress}%` }} />
          </div>
          {pauseButton}
        </TutorialSpotlight>
      ) : null}

      {boardStep === "visit_list" ? (
        <TutorialSpotlight
          targetSelector='[data-tutorial="dashboard-tab-list"]'
          visible
          cardPosition="bottom"
        >
          <span className="first-task-tutorial__badge">
            <Sparkles className="h-3 w-3" aria-hidden />
            {t("boardExploration.spotlight.step", { current: "2", total: "4" })}
          </span>
          <h3 className="mt-2 text-base font-semibold text-[var(--foreground)]">
            {t("boardExploration.spotlight.listTitle")}
          </h3>
          <p className="mt-1.5 text-sm text-[color:var(--foreground)]/65">
            {t("boardExploration.spotlight.listBody")}
          </p>
          {questList}
          <div className="first-task-tutorial__xp-bar">
            <div className="first-task-tutorial__xp-fill" style={{ width: `${progress}%` }} />
          </div>
          {pauseButton}
        </TutorialSpotlight>
      ) : null}

      {boardStep === "visit_calendar" ? (
        <TutorialSpotlight
          targetSelector='[data-tutorial="dashboard-tab-calendar"]'
          visible
          cardPosition="bottom"
        >
          <span className="first-task-tutorial__badge">
            <Sparkles className="h-3 w-3" aria-hidden />
            {t("boardExploration.spotlight.step", { current: "3", total: "4" })}
          </span>
          <h3 className="mt-2 text-base font-semibold text-[var(--foreground)]">
            {t("boardExploration.spotlight.calendarTitle")}
          </h3>
          <p className="mt-1.5 text-sm text-[color:var(--foreground)]/65">
            {t("boardExploration.spotlight.calendarBody")}
          </p>
          {questList}
          <div className="first-task-tutorial__xp-bar">
            <div className="first-task-tutorial__xp-fill" style={{ width: `${progress}%` }} />
          </div>
          {pauseButton}
        </TutorialSpotlight>
      ) : null}

      {boardStep === "visit_todo" ? (
        <TutorialSpotlight
          targetSelector='[data-tutorial="dashboard-tab-todo"]'
          visible
          cardPosition="bottom"
        >
          <span className="first-task-tutorial__badge">
            <Sparkles className="h-3 w-3" aria-hidden />
            {t("boardExploration.spotlight.step", { current: "4", total: "4" })}
          </span>
          <h3 className="mt-2 text-base font-semibold text-[var(--foreground)]">
            {t("boardExploration.spotlight.todoTitle")}
          </h3>
          <p className="mt-1.5 text-sm text-[color:var(--foreground)]/65">
            {t("boardExploration.spotlight.todoBody")}
          </p>
          {questList}
          <div className="first-task-tutorial__xp-bar">
            <div className="first-task-tutorial__xp-fill" style={{ width: `${progress}%` }} />
          </div>
          {pauseButton}
        </TutorialSpotlight>
      ) : null}
    </>
  );
}
