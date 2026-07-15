import type { GamificationProfile, TutorialId, TutorialProgress } from "./types";

const STORAGE_KEY = "workspace-gamification-v1";

type StoredGamification = {
  userId: string;
  tutorials: Partial<Record<TutorialId, TutorialProgress>>;
  xp?: number;
  badges?: string[];
};

function readAll(): StoredGamification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredGamification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(rows: StoredGamification[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.slice(-20)));
}

export function readLocalGamification(userId: string): Partial<GamificationProfile> {
  const row = readAll().find((r) => r.userId === userId);
  if (!row) return {};
  return {
    xp: row.xp,
    badges: row.badges,
    tutorials: row.tutorials,
  };
}

export function writeLocalTutorialProgress(
  userId: string,
  tutorialId: TutorialId,
  progress: TutorialProgress,
) {
  const rows = readAll().filter((r) => r.userId !== userId);
  const existing = readAll().find((r) => r.userId === userId);
  rows.push({
    userId,
    xp: existing?.xp,
    badges: existing?.badges,
    tutorials: { ...(existing?.tutorials ?? {}), [tutorialId]: progress },
  });
  writeAll(rows);
}

export function writeLocalGamificationComplete(
  userId: string,
  tutorialId: TutorialId,
  xp: number,
  badgeId: string,
) {
  const existing = readAll().find((r) => r.userId === userId);
  const badges = new Set(existing?.badges ?? []);
  badges.add(badgeId);
  const rows = readAll().filter((r) => r.userId !== userId);
  rows.push({
    userId,
    xp: (existing?.xp ?? 0) + xp,
    badges: [...badges],
    tutorials: {
      ...(existing?.tutorials ?? {}),
      [tutorialId]: { status: "completed", step: "done", updatedAt: new Date().toISOString() },
    },
  });
  writeAll(rows);
}

export function mergeGamificationProfile(
  userId: string,
  server: GamificationProfile | null,
  firstTaskCompletedFallback?: boolean,
): GamificationProfile {
  const local = readLocalGamification(userId);
  const serverTutorials = server?.tutorials ?? {};
  const localTutorials = local.tutorials ?? {};
  const mergedTutorials = { ...serverTutorials };

  for (const [id, progress] of Object.entries(localTutorials)) {
    const key = id as TutorialId;
    const serverProgress = mergedTutorials[key];
    if (
      !serverProgress ||
      (progress.status === "in_progress" &&
        serverProgress.status !== "completed" &&
        serverProgress.status !== "skipped")
    ) {
      mergedTutorials[key] = progress;
    }
  }

  return {
    xp: Math.max(server?.xp ?? 0, local.xp ?? 0),
    badges: server?.badges?.length ? server.badges : (local.badges ?? []),
    tutorials: mergedTutorials,
    firstTaskTutorialCompleted:
      server?.firstTaskTutorialCompleted ??
      firstTaskCompletedFallback ??
      local.tutorials?.first_task?.status === "completed",
  };
}
