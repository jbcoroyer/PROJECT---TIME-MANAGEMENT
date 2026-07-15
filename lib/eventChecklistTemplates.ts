import type { EventTaskCategory } from "./eventTaskCategories";

export type ChecklistTemplateTask = {
  title: string;
  category: EventTaskCategory;
  /** Jours avant la date de début de l'événement (ex. 30 = J-30). Valeurs négatives = après l'événement. */
  daysBeforeStart: number;
  priority?: "Basse" | "Moyenne" | "Haute";
};

export type EventChecklistTemplate = {
  key: string;
  label: string;
  description: string;
  tasks: ChecklistTemplateTask[];
};

/** Aucun modèle prédéfini : tâches et contenus saisis par l'utilisateur. */
export const eventChecklistTemplates: EventChecklistTemplate[] = [];

export function getEventChecklistTemplate(key: string | null | undefined): EventChecklistTemplate | null {
  if (!key) return null;
  return eventChecklistTemplates.find((t) => t.key === key) ?? null;
}

/** Date limite tâche à partir du début de l'événement et d'un offset J-XX. */
export function deadlineFromDaysBeforeStart(startDateIso: string, daysBeforeStart: number): string {
  const base = new Date(`${startDateIso}T12:00:00`);
  if (Number.isNaN(base.getTime())) return startDateIso;
  base.setDate(base.getDate() - daysBeforeStart);
  return base.toISOString().slice(0, 10);
}
