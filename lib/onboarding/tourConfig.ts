export const TOUR_STEP_IDS = ["firstTask", "team", "modules", "outlook"] as const;

export type TourStepId = (typeof TOUR_STEP_IDS)[number];

export const TOUR_EXAMPLE_KEYS = ["e1", "e2", "e3"] as const;

export type TourStepConfig = {
  id: TourStepId;
  href: string;
};

export const TOUR_STEPS: TourStepConfig[] = [
  { id: "firstTask", href: "/dashboard/kanban" },
  { id: "team", href: "/settings?section=team" },
  { id: "modules", href: "/settings?section=modules" },
  { id: "outlook", href: "/settings?section=outlook" },
];

export function buildFirstTaskHref(options: { taskDraft?: string; createTask?: boolean }): string {
  const params = new URLSearchParams({ quickAdd: "1" });
  const draft = options.taskDraft?.trim();
  if (draft) params.set("taskDraft", draft);
  if (options.createTask && draft) params.set("createTask", "1");
  return `/dashboard/kanban?${params.toString()}`;
}
