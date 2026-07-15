"use client";

import { useGamification, useGamificationOptional } from "../gamification/gamificationContext";

export type FirstTaskTutorialStep =
  | "welcome"
  | "clickNewTask"
  | "fillForm"
  | "celebrate"
  | "done";

function useFirstTaskTutorialAdapter() {
  const g = useGamification();

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
  return useFirstTaskTutorialAdapter();
}

export function useFirstTaskTutorialOptional() {
  const g = useGamificationOptional();
  if (!g) return null;
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
