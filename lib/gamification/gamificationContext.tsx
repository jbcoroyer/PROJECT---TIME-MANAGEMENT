"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  completeTutorialWithRewards,
  getGamificationProfile,
  saveTutorialProgress,
  skipTutorial,
} from "../../app/actions/gamification";
import type { FirstTaskTutorialStep } from "../onboarding/firstTaskTutorialContext";
import { getSupabaseBrowser } from "../supabaseBrowser";
import {
  mergeGamificationProfile,
  readLocalGamification,
  writeLocalGamificationComplete,
  writeLocalTutorialProgress,
} from "./localProgress";
import { tutorialById } from "./catalog";
import type { GamificationProfile, TutorialId, TutorialProgress } from "./types";

type GamificationContextValue = {
  profile: GamificationProfile;
  loading: boolean;
  panelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  refresh: () => Promise<void>;
  persistTutorial: (tutorialId: TutorialId, progress: TutorialProgress) => Promise<void>;
  completeTutorial: (tutorialId: TutorialId) => Promise<{ xpGained?: number; badgeId?: string }>;
  skipTutorialQuest: (tutorialId: TutorialId) => Promise<void>;
  resumeTutorial: (tutorialId: TutorialId) => void;
  tutorialActive: boolean;
  tutorialStep: FirstTaskTutorialStep;
  setTutorialRuntime: (active: boolean, step: FirstTaskTutorialStep) => void;
  requestTutorialResume: boolean;
  clearTutorialResume: () => void;
};

const GamificationContext = createContext<GamificationContextValue | null>(null);

const EMPTY_PROFILE: GamificationProfile = {
  xp: 0,
  badges: [],
  tutorials: {},
  firstTaskTutorialCompleted: false,
};

const FIRST_TASK_STEP_MAP: Record<string, FirstTaskTutorialStep> = {
  welcome: "welcome",
  clickNewTask: "clickNewTask",
  fillForm: "fillForm",
  celebrate: "celebrate",
  done: "done",
};

export function GamificationProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);

  const [profile, setProfile] = useState<GamificationProfile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [tutorialActive, setTutorialActive] = useState(false);
  const [tutorialStep, setTutorialStep] = useState<FirstTaskTutorialStep>("welcome");
  const [requestTutorialResume, setRequestTutorialResume] = useState(false);

  const refresh = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUserId(null);
      setProfile(EMPTY_PROFILE);
      setLoading(false);
      return;
    }

    setUserId(user.id);

    const result = await getGamificationProfile();
    const merged = mergeGamificationProfile(user.id, result.ok ? result.profile : null);
    setProfile(merged);
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void refresh();
    });
  }, [refresh]);

  const persistTutorial = useCallback(
    async (tutorialId: TutorialId, progress: TutorialProgress) => {
      const uid = userId ?? (await getSupabaseBrowser().auth.getUser()).data.user?.id;
      if (!uid) return;
      writeLocalTutorialProgress(uid, tutorialId, progress);
      setProfile((prev) => ({
        ...prev,
        tutorials: { ...prev.tutorials, [tutorialId]: progress },
      }));
      await saveTutorialProgress(tutorialId, progress);
    },
    [userId],
  );

  const completeTutorial = useCallback(
    async (tutorialId: TutorialId) => {
      const uid = userId ?? (await getSupabaseBrowser().auth.getUser()).data.user?.id;
      if (!uid) return {};
      const def = tutorialById(tutorialId);
      const result = await completeTutorialWithRewards(tutorialId);
      if (result.ok && def) {
        writeLocalGamificationComplete(uid, tutorialId, result.xpGained ?? def.xpReward, def.badgeId);
        await refresh();
        return { xpGained: result.xpGained, badgeId: result.badgeId };
      }
      return {};
    },
    [userId, refresh],
  );

  const skipTutorialQuest = useCallback(
    async (tutorialId: TutorialId) => {
      await skipTutorial(tutorialId);
      if (userId) writeLocalTutorialProgress(userId, tutorialId, { status: "skipped", step: "done" });
      await refresh();
    },
    [userId, refresh],
  );

  const setTutorialRuntime = useCallback(
    (active: boolean, step: FirstTaskTutorialStep) => {
      setTutorialActive(active);
      setTutorialStep(step);
      if (active && step !== "welcome" && step !== "done" && userId) {
        void persistTutorial("first_task", { status: "in_progress", step });
      }
    },
    [persistTutorial, userId],
  );

  const resumeTutorial = useCallback(
    (tutorialId: TutorialId) => {
      if (tutorialId !== "first_task" || !userId) return;
      const local = readLocalGamification(userId);
      const saved = profile.tutorials.first_task ?? local.tutorials?.first_task;
      const step = FIRST_TASK_STEP_MAP[saved?.step ?? "clickNewTask"] ?? "clickNewTask";
      setTutorialActive(true);
      setTutorialStep(step === "welcome" ? "clickNewTask" : step);
      setRequestTutorialResume(true);
      setPanelOpen(false);
    },
    [profile.tutorials.first_task, userId],
  );

  const value = useMemo(
    () => ({
      profile,
      loading,
      panelOpen,
      openPanel: () => setPanelOpen(true),
      closePanel: () => setPanelOpen(false),
      refresh,
      persistTutorial,
      completeTutorial,
      skipTutorialQuest,
      resumeTutorial,
      tutorialActive,
      tutorialStep,
      setTutorialRuntime,
      requestTutorialResume,
      clearTutorialResume: () => setRequestTutorialResume(false),
    }),
    [
      profile,
      loading,
      panelOpen,
      refresh,
      persistTutorial,
      completeTutorial,
      skipTutorialQuest,
      resumeTutorial,
      tutorialActive,
      tutorialStep,
      setTutorialRuntime,
      requestTutorialResume,
    ],
  );

  return <GamificationContext.Provider value={value}>{children}</GamificationContext.Provider>;
}

export function useGamification(): GamificationContextValue {
  const ctx = useContext(GamificationContext);
  if (!ctx) {
    throw new Error("useGamification doit être utilisé sous GamificationProvider.");
  }
  return ctx;
}

export function useGamificationOptional(): GamificationContextValue | null {
  return useContext(GamificationContext);
}
