import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  CalendarRange,
  ClipboardList,
  FolderOpen,
  Inbox,
  LayoutGrid,
  Lightbulb,
  ListTodo,
  Megaphone,
  Package,
  Send,
  Target,
} from "lucide-react";
import type { AppModuleId } from "./modules/types";

export type NavItemDefinition = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  moduleId: AppModuleId | null;
  adminOnly?: boolean;
};

/** Entrées de navigation — filtrées par modules activés dans AppShell. */
export const NAV_ITEMS: NavItemDefinition[] = [
  { href: "/dashboard/kanban", labelKey: "nav.dashboard", icon: LayoutGrid, moduleId: "dashboard" },
  { href: "/asks", labelKey: "nav.asks", icon: Send, moduleId: "asks" },
  { href: "/todo", labelKey: "nav.workspace", icon: ListTodo, moduleId: "workspace" },
  { href: "/planning", labelKey: "nav.planning", icon: CalendarDays, moduleId: "planning" },
  { href: "/dashboard/triage", labelKey: "nav.triage", icon: Inbox, moduleId: "asks" },
  { href: "/events/dashboard", labelKey: "nav.events", icon: CalendarRange, moduleId: "events" },
  { href: "/social", labelKey: "nav.social", icon: Megaphone, moduleId: "social" },
  { href: "/dam", labelKey: "nav.dam", icon: FolderOpen, moduleId: "dam" },
  { href: "/stock", labelKey: "nav.stock", icon: Package, moduleId: "stock" },
  { href: "/ideas", labelKey: "nav.ideas", icon: Lightbulb, moduleId: "ideas" },
  { href: "/okr", labelKey: "nav.okr", icon: Target, moduleId: "okr" },
  {
    href: "/questionnaire/reponses",
    labelKey: "nav.surveys",
    icon: ClipboardList,
    moduleId: "surveys",
    adminOnly: true,
  },
];

export function isNavActive(href: string, pathname: string): boolean {
  if (href === "/events/dashboard") return pathname.startsWith("/events");
  if (href === "/dashboard/triage") return pathname === "/dashboard/triage";
  if (href === "/asks") return pathname === "/asks";
  if (href === "/dashboard/kanban") {
    return (
      pathname === "/dashboard/kanban" ||
      (pathname.startsWith("/dashboard") && pathname !== "/dashboard/triage")
    );
  }
  if (href === "/stock") return pathname.startsWith("/stock");
  if (href === "/ideas") return pathname.startsWith("/ideas");
  if (href === "/questionnaire/reponses") return pathname.startsWith("/questionnaire/reponses");
  return pathname === href;
}
