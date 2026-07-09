/** Chemins principaux de l'application (interface unique). */
export const DASHBOARD_KANBAN = "/dashboard/kanban" as const;

export function kanbanHref(taskId?: string | null): string {
  return taskId ? `${DASHBOARD_KANBAN}?task=${encodeURIComponent(taskId)}` : DASHBOARD_KANBAN;
}
