import type { AppModuleId } from "./modules/types";

export type NavItemDefinition = {
  href: string;
  labelKey: string;
  moduleId: AppModuleId | null;
  adminOnly?: boolean;
};

/** Entrées de navigation — icônes via `ModuleGlyph` (pas Lucide). */
export const NAV_ITEMS: NavItemDefinition[] = [
  { href: "/dashboard/kanban", labelKey: "nav.dashboard", moduleId: "dashboard" },
  { href: "/asks", labelKey: "nav.asks", moduleId: "asks" },
  { href: "/todo", labelKey: "nav.workspace", moduleId: "workspace" },
  { href: "/planning", labelKey: "nav.planning", moduleId: "planning" },
  { href: "/dashboard/triage", labelKey: "nav.triage", moduleId: "asks" },
  { href: "/events/dashboard", labelKey: "nav.events", moduleId: "events" },
  { href: "/social", labelKey: "nav.social", moduleId: "social" },
  { href: "/dam", labelKey: "nav.dam", moduleId: "dam" },
  { href: "/stock", labelKey: "nav.stock", moduleId: "stock" },
  { href: "/ideas", labelKey: "nav.ideas", moduleId: "ideas" },
  { href: "/okr", labelKey: "nav.okr", moduleId: "okr" },
  {
    href: "/questionnaire/reponses",
    labelKey: "nav.surveys",
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
