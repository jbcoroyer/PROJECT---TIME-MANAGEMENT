"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { useBranding } from "../brandingContext";
import { effectiveModulesForPlan } from "../billing/plans";
import { useBillingPlan } from "../billing/useBillingPlan";
import { useGamificationOptional } from "../gamification/gamificationContext";
import type { AppModuleId } from "../modules/types";
import { isModuleEnabled } from "../modules";
import { MODULE_DISCOVERY_ORDER, MODULE_TOUR_DEFINITIONS } from "./moduleTutorialConfig";
import { markProductTourPending } from "../../components/onboarding/ProductTour";

export type BoardExplorationStep =
  | "idle"
  | "intro"
  | "add_column"
  | "visit_list"
  | "visit_calendar"
  | "visit_todo"
  | "celebrate"
  | "done";

const BOARD_STEP_ORDER: BoardExplorationStep[] = [
  "intro",
  "add_column",
  "visit_list",
  "visit_calendar",
  "visit_todo",
  "celebrate",
  "done",
];

type ExplorationContextValue = {
  boardActive: boolean;
  boardStep: BoardExplorationStep;
  startBoardExploration: () => void;
  beginBoardQuest: () => void;
  pauseBoardExploration: () => void;
  notifyColumnAdded: () => void;
  notifyTabVisited: (tab: "list" | "calendar" | "todo") => void;
  completeBoardCelebration: () => void;

  moduleHubOpen: boolean;
  openModuleHub: () => void;
  closeModuleHub: () => void;
  skipModuleDiscovery: () => void;
  finishModuleDiscovery: () => void;

  availableModules: AppModuleId[];
  completedModuleTours: AppModuleId[];
  activeModuleTour: AppModuleId | null;
  moduleTourStep: number;
  startModuleTour: (moduleId: AppModuleId) => void;
  advanceModuleTour: () => void;
  skipModuleTour: () => void;
};

const ExplorationContext = createContext<ExplorationContextValue | null>(null);

function readCompletedModules(meta: Record<string, unknown> | undefined): AppModuleId[] {
  const raw = meta?.completedModules;
  if (!Array.isArray(raw)) return [];
  return raw.filter((id): id is AppModuleId => typeof id === "string");
}

export function ExplorationTutorialProvider({ children }: { children: ReactNode }) {
  const gamification = useGamificationOptional();
  const { branding } = useBranding();
  const { plan } = useBillingPlan();
  const pathname = usePathname();

  const [boardActive, setBoardActive] = useState(false);
  const [boardStep, setBoardStep] = useState<BoardExplorationStep>("idle");
  const [moduleHubOpen, setModuleHubOpen] = useState(false);
  const [activeModuleTour, setActiveModuleTour] = useState<AppModuleId | null>(null);
  const [moduleTourStep, setModuleTourStep] = useState(0);

  const allowedModules = useMemo(
    () => effectiveModulesForPlan(plan, branding.enabledModules),
    [plan, branding.enabledModules],
  );

  const availableModules = useMemo(
    () =>
      MODULE_DISCOVERY_ORDER.filter(
        (id) => id !== "dashboard" && isModuleEnabled(allowedModules, id),
      ),
    [allowedModules],
  );

  const completedModuleTours = useMemo(
    () => readCompletedModules(gamification?.profile.tutorials.module_discovery?.meta),
    [gamification?.profile.tutorials.module_discovery?.meta],
  );

  const boardStatus = gamification?.profile.tutorials.board_exploration?.status;
  const moduleStatus = gamification?.profile.tutorials.module_discovery?.status;
  const boardSavedStep = gamification?.profile.tutorials.board_exploration?.step as
    | BoardExplorationStep
    | undefined;

  const [boardRestored, setBoardRestored] = useState(false);
  if (
    !boardRestored &&
    !boardActive &&
    boardStep === "idle" &&
    boardStatus === "in_progress" &&
    boardSavedStep &&
    boardSavedStep !== "done"
  ) {
    setBoardRestored(true);
    setBoardActive(true);
    if (boardSavedStep === "celebrate" || BOARD_STEP_ORDER.includes(boardSavedStep)) {
      setBoardStep(boardSavedStep);
    }
  }

  const [moduleHubAutoOpened, setModuleHubAutoOpened] = useState(false);
  if (
    !moduleHubAutoOpened &&
    moduleStatus === "in_progress" &&
    !moduleHubOpen &&
    !activeModuleTour &&
    pathname.startsWith("/dashboard")
  ) {
    setModuleHubAutoOpened(true);
    setModuleHubOpen(true);
  }

  const persistBoardStep = useCallback(
    (step: BoardExplorationStep) => {
      if (!gamification || step === "idle" || step === "done") return;
      void gamification.persistTutorial("board_exploration", {
        status: "in_progress",
        step,
      });
    },
    [gamification],
  );

  const startBoardExploration = useCallback(() => {
    setBoardActive(true);
    setBoardStep("intro");
    persistBoardStep("intro");
  }, [persistBoardStep]);

  const beginBoardQuest = useCallback(() => {
    setBoardActive(true);
    setBoardStep("add_column");
    persistBoardStep("add_column");
  }, [persistBoardStep]);

  const pauseBoardExploration = useCallback(() => {
    setBoardActive(false);
    if (gamification) {
      void gamification.persistTutorial("board_exploration", {
        status: "in_progress",
        step: boardStep === "idle" ? "intro" : boardStep,
      });
    }
  }, [boardStep, gamification]);

  const advanceBoard = useCallback(
    (next: BoardExplorationStep) => {
      setBoardStep(next);
      persistBoardStep(next);
    },
    [persistBoardStep],
  );

  const notifyColumnAdded = useCallback(() => {
    if (boardStep === "add_column") {
      advanceBoard("visit_list");
    }
  }, [advanceBoard, boardStep]);

  const notifyTabVisited = useCallback(
    (tab: "list" | "calendar" | "todo") => {
      if (!boardActive) return;
      if (tab === "list" && boardStep === "visit_list") advanceBoard("visit_calendar");
      if (tab === "calendar" && boardStep === "visit_calendar") advanceBoard("visit_todo");
      if (tab === "todo" && boardStep === "visit_todo") advanceBoard("celebrate");
    },
    [advanceBoard, boardActive, boardStep],
  );

  const completeBoardCelebration = useCallback(async () => {
    setBoardActive(false);
    setBoardStep("done");
    if (gamification) {
      await gamification.completeTutorial("board_exploration");
      void gamification.persistTutorial("module_discovery", { status: "in_progress", step: "hub" });
    }
    setModuleHubOpen(true);
  }, [gamification]);

  const openModuleHub = useCallback(() => {
    setModuleHubOpen(true);
    if (gamification) {
      void gamification.persistTutorial("module_discovery", { status: "in_progress", step: "hub" });
    }
  }, [gamification]);

  const closeModuleHub = useCallback(() => {
    setModuleHubOpen(false);
  }, []);

  const finishModuleDiscovery = useCallback(async () => {
    setModuleHubOpen(false);
    setActiveModuleTour(null);
    setModuleTourStep(0);
    if (gamification) {
      await gamification.completeTutorial("module_discovery");
    }
    markProductTourPending();
  }, [gamification]);

  const skipModuleDiscovery = useCallback(async () => {
    setModuleHubOpen(false);
    setActiveModuleTour(null);
    if (gamification) {
      await gamification.skipTutorialQuest("module_discovery");
    }
    markProductTourPending();
  }, [gamification]);

  const persistModuleProgress = useCallback(
    (completed: AppModuleId[]) => {
      if (!gamification) return;
      void gamification.persistTutorial("module_discovery", {
        status: "in_progress",
        step: "hub",
        meta: { completedModules: completed },
      });
    },
    [gamification],
  );

  const startModuleTour = useCallback(
    (moduleId: AppModuleId) => {
      setActiveModuleTour(moduleId);
      setModuleTourStep(0);
      setModuleHubOpen(false);
      if (gamification) {
        void gamification.persistTutorial("module_discovery", {
          status: "in_progress",
          step: `tour-${moduleId}`,
        });
      }
    },
    [gamification],
  );

  const advanceModuleTour = useCallback(() => {
    if (!activeModuleTour) return;
    const tourDef = MODULE_TOUR_DEFINITIONS[activeModuleTour];
    const maxSteps = tourDef?.steps.length ?? 2;
    const nextStep = moduleTourStep + 1;

    if (nextStep >= maxSteps) {
      const merged = completedModuleTours.includes(activeModuleTour)
        ? completedModuleTours
        : [...completedModuleTours, activeModuleTour];
      persistModuleProgress(merged);
      setActiveModuleTour(null);
      setModuleTourStep(0);
      setModuleHubOpen(true);
      return;
    }

    setModuleTourStep(nextStep);
  }, [activeModuleTour, completedModuleTours, moduleTourStep, persistModuleProgress]);

  const skipModuleTour = useCallback(() => {
    setActiveModuleTour(null);
    setModuleTourStep(0);
    setModuleHubOpen(true);
  }, []);

  const value = useMemo(
    () => ({
      boardActive,
      boardStep,
      startBoardExploration,
      beginBoardQuest,
      pauseBoardExploration,
      notifyColumnAdded,
      notifyTabVisited,
      completeBoardCelebration,
      moduleHubOpen,
      openModuleHub,
      closeModuleHub,
      skipModuleDiscovery,
      finishModuleDiscovery,
      availableModules,
      completedModuleTours,
      activeModuleTour,
      moduleTourStep,
      startModuleTour,
      advanceModuleTour,
      skipModuleTour,
    }),
    [
      boardActive,
      boardStep,
      startBoardExploration,
      beginBoardQuest,
      pauseBoardExploration,
      notifyColumnAdded,
      notifyTabVisited,
      completeBoardCelebration,
      moduleHubOpen,
      openModuleHub,
      closeModuleHub,
      skipModuleDiscovery,
      finishModuleDiscovery,
      availableModules,
      completedModuleTours,
      activeModuleTour,
      moduleTourStep,
      startModuleTour,
      advanceModuleTour,
      skipModuleTour,
    ],
  );

  return <ExplorationContext.Provider value={value}>{children}</ExplorationContext.Provider>;
}

export function useExplorationTutorial(): ExplorationContextValue {
  const ctx = useContext(ExplorationContext);
  if (!ctx) {
    throw new Error("useExplorationTutorial doit être utilisé sous ExplorationTutorialProvider.");
  }
  return ctx;
}

export function useExplorationTutorialOptional(): ExplorationContextValue | null {
  return useContext(ExplorationContext);
}
