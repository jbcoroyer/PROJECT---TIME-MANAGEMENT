import { DONE_COLUMN_NAME } from "../../../lib/workflowConstants";
import type { Task } from "../../../lib/types";

export type TaskWithSubtasks = Task & { subtasks: Task[] };

export function buildActiveTasks(tasks: Task[]): TaskWithSubtasks[] {
  const roots = tasks.filter((task) => !task.isArchived && !task.parentTaskId);
  const subtaskMap = new Map<string, Task[]>();
  for (const t of tasks) {
    if (t.parentTaskId) {
      const arr = subtaskMap.get(t.parentTaskId) ?? [];
      arr.push(t);
      subtaskMap.set(t.parentTaskId, arr);
    }
  }
  return roots.map((t) => ({ ...t, subtasks: subtaskMap.get(t.id) ?? [] }));
}

export function buildArchivedTasks(tasks: Task[]): Task[] {
  return tasks.filter((task) => task.isArchived && !task.parentTaskId);
}

export function buildWorkloadTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => !t.isArchived && t.column !== DONE_COLUMN_NAME);
}

export function filterTasksByQuery(activeTasks: TaskWithSubtasks[], searchQuery: string): TaskWithSubtasks[] {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return activeTasks;
  return activeTasks.filter((task) => {
    const haystack = [
      task.projectName,
      task.company,
      task.domain,
      task.clientName,
      task.description,
      task.admins.join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
}
