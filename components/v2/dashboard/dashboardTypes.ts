import {
  Archive,
  BarChart3,
  CalendarDays,
  ClipboardList,
  KanbanSquare,
  Table2,
  Users,
  type LucideIcon,
} from "lucide-react";

export type MainTab =
  | "kanban"
  | "list"
  | "todo"
  | "calendar"
  | "analytics"
  | "archives"
  | "workload";

export const MAIN_TAB_SET = new Set<MainTab>([
  "kanban",
  "list",
  "todo",
  "calendar",
  "analytics",
  "archives",
  "workload",
]);

export const MAIN_TABS: { id: MainTab; labelKey: string; icon: LucideIcon }[] = [
  { id: "todo", labelKey: "dashboard.tabs.todo", icon: ClipboardList },
  { id: "kanban", labelKey: "dashboard.tabs.kanban", icon: KanbanSquare },
  { id: "list", labelKey: "dashboard.tabs.list", icon: Table2 },
  { id: "calendar", labelKey: "dashboard.tabs.calendar", icon: CalendarDays },
  { id: "workload", labelKey: "dashboard.tabs.workload", icon: Users },
  { id: "analytics", labelKey: "dashboard.tabs.analytics", icon: BarChart3 },
  { id: "archives", labelKey: "dashboard.tabs.archives", icon: Archive },
];
