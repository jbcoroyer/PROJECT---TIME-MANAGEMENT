import {
  addDays,
  endOfDay,
  endOfISOWeek,
  max as maxDate,
  min as minDate,
  startOfDay,
  startOfISOWeek,
} from "date-fns";
import type { Task } from "../types";
import { DONE_COLUMN_NAME } from "../workflowConstants";
import { defaultDomainColor, domainCalendarColors } from "../kanbanStyles";

export type RetroplanningGroupBy = "tasks" | "person" | "domain" | "mode";

export type GanttBar = {
  taskId: string;
  label: string;
  start: Date;
  end: Date;
  color: string;
  categoryLabel: string;
  assignees: string[];
  task: Task;
  rowKey: string;
};

export type GanttGroup = {
  id: string;
  label: string;
  subtitle?: string;
  accentColor?: string;
  bars: GanttBar[];
};

export type GanttWeekColumn = {
  weekStart: Date;
  weekEnd: Date;
  weekNumber: number;
  label: string;
};

const MODE_PALETTE = [
  "#6366f1",
  "#0d9488",
  "#d97706",
  "#db2777",
  "#2563eb",
  "#7c3aed",
  "#059669",
  "#dc2626",
] as const;

const modeColorCache = new Map<string, string>();

function hashModeColor(key: string): string {
  const cached = modeColorCache.get(key);
  if (cached) return cached;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash + key.charCodeAt(i) * 17) % MODE_PALETTE.length;
  const color = MODE_PALETTE[hash] ?? MODE_PALETTE[0];
  modeColorCache.set(key, color);
  return color;
}

export function resolveTaskMode(task: Task): string {
  if (task.eventCategory?.trim()) return task.eventCategory.trim();
  if (task.eventName?.trim()) return task.eventName.trim();
  return task.domain?.replace(/^[^\s]+\s*/, "").trim() || task.domain || "Général";
}

export function resolveBarColor(task: Task, groupBy: RetroplanningGroupBy): string {
  if (groupBy === "domain") {
    return domainCalendarColors[task.domain] ?? defaultDomainColor;
  }
  if (groupBy === "mode") {
    return hashModeColor(resolveTaskMode(task));
  }
  return domainCalendarColors[task.domain] ?? hashModeColor(resolveTaskMode(task));
}

/** Calcule l'intervalle start → end d'une tâche pour le Gantt. */
export function computeTaskDateRange(task: Task): { start: Date; end: Date } | null {
  const slotDates = task.projectedWork
    .filter((p) => p.date)
    .map((p) => startOfDay(new Date(p.date)))
    .filter((d) => !Number.isNaN(d.getTime()));

  const deadline = task.deadline ? startOfDay(new Date(task.deadline)) : null;
  const created = task.createdAt ? startOfDay(new Date(task.createdAt)) : null;

  if (slotDates.length === 0 && !deadline && !created) return null;

  let start: Date;
  let end: Date;

  if (slotDates.length > 0) {
    start = minDate(slotDates);
    end = maxDate(slotDates);
  } else if (deadline && created) {
    start = minDate([created, deadline]);
    end = maxDate([created, deadline]);
  } else if (deadline) {
    const spanDays = Math.max(1, task.estimatedDays || Math.ceil((task.estimatedHours || 4) / 7));
    end = deadline;
    start = addDays(deadline, -(spanDays - 1));
  } else if (created) {
    start = created;
    const spanDays = Math.max(1, task.estimatedDays || Math.ceil((task.estimatedHours || 4) / 7));
    end = addDays(created, spanDays - 1);
  } else {
    return null;
  }

  if (end < start) end = start;
  if (start.getTime() === end.getTime()) {
    end = endOfDay(addDays(start, Math.max(0, (task.estimatedDays || 1) - 1)));
  }

  return { start: startOfDay(start), end: endOfDay(end) };
}

export function buildGanttBars(
  tasks: Task[],
  groupBy: RetroplanningGroupBy,
): GanttBar[] {
  const bars: GanttBar[] = [];

  for (const task of tasks) {
    if (task.isArchived || task.parentTaskId || task.column === DONE_COLUMN_NAME) continue;
    const range = computeTaskDateRange(task);
    if (!range) continue;

    const assignees = task.admins.filter(Boolean);
    const color = resolveBarColor(task, groupBy);
    const categoryLabel = resolveTaskMode(task);

    if (groupBy === "person") {
      const people = assignees.length > 0 ? assignees : ["Non assigné"];
      for (const person of people) {
        bars.push({
          taskId: task.id,
          label: task.projectName,
          start: range.start,
          end: range.end,
          color,
          categoryLabel,
          assignees: task.admins,
          task,
          rowKey: `${person}::${task.id}`,
        });
      }
    } else {
      bars.push({
        taskId: task.id,
        label: task.projectName,
        start: range.start,
        end: range.end,
        color,
        categoryLabel,
        assignees,
        task,
        rowKey: task.id,
      });
    }
  }

  return bars.sort((a, b) => a.start.getTime() - b.start.getTime() || a.label.localeCompare(b.label));
}

export function buildGanttGroups(bars: GanttBar[], groupBy: RetroplanningGroupBy): GanttGroup[] {
  if (groupBy === "tasks") {
    return [
      {
        id: "all",
        label: "Rétroplanning",
        subtitle: `${bars.length} tâche${bars.length !== 1 ? "s" : ""} planifiée${bars.length !== 1 ? "s" : ""}`,
        bars,
      },
    ];
  }

  const map = new Map<string, GanttBar[]>();

  for (const bar of bars) {
    let key: string;
    if (groupBy === "person") {
      key = bar.rowKey.split("::")[0] ?? "Non assigné";
    } else if (groupBy === "domain") {
      key = bar.task.domain || "Sans domaine";
    } else {
      key = resolveTaskMode(bar.task);
    }

    const list = map.get(key) ?? [];
    list.push(bar);
    map.set(key, list);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b, "fr"))
    .map(([label, groupBars]) => ({
      id: label,
      label,
      subtitle: `${groupBars.length} tâche${groupBars.length !== 1 ? "s" : ""}`,
      accentColor: groupBars[0]?.color,
      bars: groupBars.sort((a, b) => a.start.getTime() - b.start.getTime()),
    }));
}

export function buildWeekColumns(rangeStart: Date, rangeEnd: Date): GanttWeekColumn[] {
  const columns: GanttWeekColumn[] = [];
  let cursor = startOfISOWeek(rangeStart);
  const end = endOfISOWeek(rangeEnd);

  while (cursor <= end) {
    const weekEnd = endOfISOWeek(cursor);
    columns.push({
      weekStart: cursor,
      weekEnd,
      weekNumber: getWeekNumber(cursor),
      label: `S${getWeekNumber(cursor)}`,
    });
    cursor = addDays(weekEnd, 1);
  }

  return columns;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function barPositionPercent(
  barStart: Date,
  barEnd: Date,
  rangeStart: Date,
  rangeEnd: Date,
): { left: number; width: number } {
  const totalMs = rangeEnd.getTime() - rangeStart.getTime();
  if (totalMs <= 0) return { left: 0, width: 100 };

  const clampedStart = maxDate([barStart, rangeStart]);
  const clampedEnd = minDate([barEnd, rangeEnd]);
  if (clampedEnd <= clampedStart) return { left: 0, width: 0 };

  const left = ((clampedStart.getTime() - rangeStart.getTime()) / totalMs) * 100;
  const width = ((clampedEnd.getTime() - clampedStart.getTime()) / totalMs) * 100;
  return {
    left: Math.max(0, Math.min(100, left)),
    width: Math.max(0.8, Math.min(100 - left, width)),
  };
}

export function todayPositionPercent(rangeStart: Date, rangeEnd: Date, now = new Date()): number | null {
  const t = now.getTime();
  if (t < rangeStart.getTime() || t > rangeEnd.getTime()) return null;
  const totalMs = rangeEnd.getTime() - rangeStart.getTime();
  return ((t - rangeStart.getTime()) / totalMs) * 100;
}

export function collectLegendItems(bars: GanttBar[]): { label: string; color: string }[] {
  const seen = new Map<string, string>();
  for (const bar of bars) {
    const key = bar.categoryLabel;
    if (!seen.has(key)) seen.set(key, bar.color);
  }
  return Array.from(seen.entries())
    .map(([label, color]) => ({ label, color }))
    .slice(0, 8);
}
