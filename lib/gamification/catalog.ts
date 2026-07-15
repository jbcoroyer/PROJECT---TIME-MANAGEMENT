import type { BadgeDefinition, TutorialDefinition, TutorialId, GamificationProfile } from "./types";

export const BADGES: BadgeDefinition[] = [
  {
    id: "first_step",
    titleKey: "gamification.badges.firstStep.title",
    descriptionKey: "gamification.badges.firstStep.description",
    icon: "rocket",
  },
  {
    id: "explorer",
    titleKey: "gamification.badges.explorer.title",
    descriptionKey: "gamification.badges.explorer.description",
    icon: "compass",
  },
  {
    id: "team_builder",
    titleKey: "gamification.badges.teamBuilder.title",
    descriptionKey: "gamification.badges.teamBuilder.description",
    icon: "users",
  },
  {
    id: "module_master",
    titleKey: "gamification.badges.moduleMaster.title",
    descriptionKey: "gamification.badges.moduleMaster.description",
    icon: "layers",
  },
  {
    id: "centurion",
    titleKey: "gamification.badges.centurion.title",
    descriptionKey: "gamification.badges.centurion.description",
    icon: "star",
    xpBonus: 0,
  },
];

export const TUTORIALS: TutorialDefinition[] = [
  {
    id: "first_task",
    titleKey: "gamification.tutorials.firstTask.title",
    descriptionKey: "gamification.tutorials.firstTask.description",
    badgeId: "first_step",
    xpReward: 100,
    href: "/dashboard/kanban",
    tourParam: "tour=1",
    estimatedMinutes: 3,
  },
  {
    id: "product_tour",
    titleKey: "gamification.tutorials.productTour.title",
    descriptionKey: "gamification.tutorials.productTour.description",
    badgeId: "explorer",
    xpReward: 50,
    href: "/dashboard/kanban",
    estimatedMinutes: 5,
  },
  {
    id: "team_setup",
    titleKey: "gamification.tutorials.teamSetup.title",
    descriptionKey: "gamification.tutorials.teamSetup.description",
    badgeId: "team_builder",
    xpReward: 75,
    href: "/settings?section=team",
    estimatedMinutes: 4,
  },
  {
    id: "modules_tour",
    titleKey: "gamification.tutorials.modulesTour.title",
    descriptionKey: "gamification.tutorials.modulesTour.description",
    badgeId: "module_master",
    xpReward: 60,
    href: "/settings?section=modules",
    estimatedMinutes: 3,
  },
];

export const XP_PER_LEVEL = 120;

export function levelFromXp(xp: number): number {
  return Math.max(1, Math.floor(xp / XP_PER_LEVEL) + 1);
}

export function xpProgressInLevel(xp: number): { current: number; max: number; ratio: number } {
  const inLevel = xp % XP_PER_LEVEL;
  return {
    current: inLevel,
    max: XP_PER_LEVEL,
    ratio: inLevel / XP_PER_LEVEL,
  };
}

export function badgeById(id: string): BadgeDefinition | undefined {
  return BADGES.find((b) => b.id === id);
}

export function tutorialById(id: TutorialId): TutorialDefinition | undefined {
  return TUTORIALS.find((t) => t.id === id);
}

export function parseGamificationRow(row: {
  gamification_xp?: number | null;
  gamification_badges?: string[] | null;
  gamification_state?: unknown;
  first_task_tutorial_completed_at?: string | null;
}): GamificationProfile {
  const tutorialsRaw =
    row.gamification_state && typeof row.gamification_state === "object"
      ? (row.gamification_state as GamificationProfile["tutorials"])
      : {};

  return {
    xp: row.gamification_xp ?? 0,
    badges: row.gamification_badges ?? [],
    tutorials: tutorialsRaw,
    firstTaskTutorialCompleted: Boolean(row.first_task_tutorial_completed_at),
  };
}