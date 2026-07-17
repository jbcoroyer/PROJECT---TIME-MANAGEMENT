"use client";

import { useGamification, useGamificationOptional } from "../gamification/gamificationContext";

export type FirstTaskTutorialStep =
  | "welcome"
  | "clickNewTask"
  | "fillForm"
  | "celebrate"
  | "visitList"
  | "editInList"
  | "visitCalendar"
  | "exploreCalendar"
  | "createEvent"
  | "visitTodo"
  | "exploreTodo"
  | "done";

function buildAdapter(g: ReturnType<typeof useGamification>) {
  return {
    active: g.tutorialActive,
    step: g.tutorialStep,
    startTutorial: () => {
      g.setTutorialRuntime(true, "welcome");
      void g.persistTutorial("first_task", { status: "in_progress", step: "welcome" });
    },
    beginQuest: () => {
      g.setTutorialRuntime(true, "clickNewTask");
      void g.persistTutorial("first_task", { status: "in_progress", step: "clickNewTask" });
    },
    notifyNewTaskClicked: () => {
      if (g.tutorialStep === "clickNewTask") {
        g.setTutorialRuntime(true, "fillForm");
        void g.persistTutorial("first_task", { status: "in_progress", step: "fillForm" });
      }
    },
    notifyFormOpened: () => {
      if (g.tutorialStep === "clickNewTask" || g.tutorialStep === "welcome") {
        g.setTutorialRuntime(true, "fillForm");
        void g.persistTutorial("first_task", { status: "in_progress", step: "fillForm" });
      }
    },
    notifyTaskCreated: () => {
      g.setTutorialRuntime(true, "celebrate");
      void g.persistTutorial("first_task", { status: "in_progress", step: "celebrate" });
    },
    finishCelebration: () => {
      g.setTutorialRuntime(true, "visitList");
      void g.persistTutorial("first_task", { status: "in_progress", step: "visitList" });
    },
    notifyListTabOpened: () => {
      if (g.tutorialStep === "visitList") {
        g.setTutorialRuntime(true, "editInList");
        void g.persistTutorial("first_task", { status: "in_progress", step: "editInList" });
      }
    },
    continueToCalendar: () => {
      g.setTutorialRuntime(true, "visitCalendar");
      void g.persistTutorial("first_task", { status: "in_progress", step: "visitCalendar" });
    },
    notifyCalendarTabOpened: () => {
      if (g.tutorialStep === "visitCalendar") {
        g.setTutorialRuntime(true, "exploreCalendar");
        void g.persistTutorial("first_task", { status: "in_progress", step: "exploreCalendar" });
      }
    },
    beginCreateEvent: () => {
      if (g.tutorialStep === "exploreCalendar") {
        g.setTutorialRuntime(true, "createEvent");
        void g.persistTutorial("first_task", { status: "in_progress", step: "createEvent" });
      }
    },
    notifyEventCreated: () => {
      g.setTutorialRuntime(true, "exploreTodo");
      void g.persistTutorial("first_task", { status: "in_progress", step: "exploreTodo" });
    },
    notifyTodoTabOpened: () => {
      if (g.tutorialStep === "visitTodo") {
        g.setTutorialRuntime(true, "exploreTodo");
        void g.persistTutorial("first_task", { status: "in_progress", step: "exploreTodo" });
      }
    },
    finishFirstTaskTutorial: () => {
      g.setTutorialRuntime(false, "done");
    },
    dismissTutorial: () => {
      g.setTutorialRuntime(false, "done");
      void g.persistTutorial("first_task", {
        status: "in_progress",
        step: g.tutorialStep === "welcome" ? "clickNewTask" : g.tutorialStep,
      });
    },
  };
}

export function FirstTaskTutorialProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useFirstTaskTutorial() {
  return buildAdapter(useGamification());
}

export function useFirstTaskTutorialOptional() {
  const g = useGamificationOptional();
  if (!g) return null;
  return buildAdapter(g);
}
