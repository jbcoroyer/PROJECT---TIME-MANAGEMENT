export type TutorialId =
  | "first_task"
  | "board_exploration"
  | "module_discovery"
  | "product_tour"
  | "team_setup"
  | "modules_tour";

export type TutorialStatus = "pending" | "in_progress" | "completed" | "skipped";

export type TutorialProgress = {
  status: TutorialStatus;
  step?: string;
  updatedAt?: string;
  /** Données libres (ex. modules visités). */
  meta?: Record<string, unknown>;
};

export type GamificationProfile = {
  xp: number;
  badges: string[];
  tutorials: Partial<Record<TutorialId, TutorialProgress>>;
  firstTaskTutorialCompleted: boolean;
};

export type BadgeDefinition = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: "sparkles" | "rocket" | "users" | "compass" | "layers" | "star";
  xpBonus?: number;
};

export type TutorialDefinition = {
  id: TutorialId;
  titleKey: string;
  descriptionKey: string;
  badgeId: string;
  xpReward: number;
  href: string;
  tourParam?: string;
  estimatedMinutes: number;
};
