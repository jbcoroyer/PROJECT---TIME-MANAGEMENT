"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type FirstTaskTutorialStep =
  | "welcome"
  | "clickNewTask"
  | "fillForm"
  | "celebrate"
  | "done";

type FirstTaskTutorialContextValue = {
  active: boolean;
  step: FirstTaskTutorialStep;
  startTutorial: () => void;
  beginQuest: () => void;
  notifyNewTaskClicked: () => void;
  notifyFormOpened: () => void;
  notifyTaskCreated: () => void;
  finishCelebration: () => void;
  dismissTutorial: () => void;
};

const FirstTaskTutorialContext = createContext<FirstTaskTutorialContextValue | null>(null);

export function FirstTaskTutorialProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState<FirstTaskTutorialStep>("welcome");

  const startTutorial = useCallback(() => {
    setActive(true);
    setStep("welcome");
  }, []);

  const beginQuest = useCallback(() => {
    setActive(true);
    setStep("clickNewTask");
  }, []);

  const notifyNewTaskClicked = useCallback(() => {
    setStep((current) => (current === "clickNewTask" ? "fillForm" : current));
  }, []);

  const notifyFormOpened = useCallback(() => {
    setStep((current) =>
      current === "clickNewTask" || current === "welcome" ? "fillForm" : current,
    );
  }, []);

  const notifyTaskCreated = useCallback(() => {
    setStep("celebrate");
  }, []);

  const finishCelebration = useCallback(() => {
    setStep("done");
    setActive(false);
  }, []);

  const dismissTutorial = useCallback(() => {
    setActive(false);
    setStep("done");
  }, []);

  const value = useMemo(
    () => ({
      active,
      step,
      startTutorial,
      beginQuest,
      notifyNewTaskClicked,
      notifyFormOpened,
      notifyTaskCreated,
      finishCelebration,
      dismissTutorial,
    }),
    [
      active,
      step,
      startTutorial,
      beginQuest,
      notifyNewTaskClicked,
      notifyFormOpened,
      notifyTaskCreated,
      finishCelebration,
      dismissTutorial,
    ],
  );

  return (
    <FirstTaskTutorialContext.Provider value={value}>{children}</FirstTaskTutorialContext.Provider>
  );
}

export function useFirstTaskTutorial(): FirstTaskTutorialContextValue {
  const ctx = useContext(FirstTaskTutorialContext);
  if (!ctx) {
    throw new Error("useFirstTaskTutorial doit être utilisé sous FirstTaskTutorialProvider.");
  }
  return ctx;
}

export function useFirstTaskTutorialOptional(): FirstTaskTutorialContextValue | null {
  return useContext(FirstTaskTutorialContext);
}
