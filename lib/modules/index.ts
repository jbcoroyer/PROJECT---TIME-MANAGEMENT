import type { AppModuleDefinition, AppModuleId, ModuleCategory } from "./types";

export type { AppModuleId, AppModuleDefinition, ModuleCategory } from "./types";

/** Catalogue canonique — source unique pour navigation, onboarding et garde-fous. */
export const MODULE_REGISTRY: Record<AppModuleId, AppModuleDefinition> = {
  dashboard: {
    id: "dashboard",
    category: "pilotage",
    defaultRoute: "/dashboard/kanban",
    routePrefixes: ["/dashboard"],
    recommended: true,
  },
  asks: {
    id: "asks",
    category: "pilotage",
    defaultRoute: "/asks",
    routePrefixes: ["/asks"],
    recommended: false,
  },
  workspace: {
    id: "workspace",
    category: "pilotage",
    defaultRoute: "/todo",
    routePrefixes: ["/todo"],
    recommended: true,
  },
  planning: {
    id: "planning",
    category: "pilotage",
    defaultRoute: "/planning",
    routePrefixes: ["/planning"],
    recommended: false,
  },
  events: {
    id: "events",
    category: "operations",
    defaultRoute: "/events/dashboard",
    routePrefixes: ["/events"],
    recommended: false,
  },
  social: {
    id: "social",
    category: "communication",
    defaultRoute: "/social",
    routePrefixes: ["/social"],
    recommended: false,
  },
  dam: {
    id: "dam",
    category: "communication",
    defaultRoute: "/dam",
    routePrefixes: ["/dam"],
    recommended: false,
  },
  stock: {
    id: "stock",
    category: "operations",
    defaultRoute: "/stock",
    routePrefixes: ["/stock"],
    recommended: false,
  },
  ideas: {
    id: "ideas",
    category: "operations",
    defaultRoute: "/ideas",
    routePrefixes: ["/ideas"],
    recommended: false,
  },
  okr: {
    id: "okr",
    category: "strategy",
    defaultRoute: "/okr",
    routePrefixes: ["/okr"],
    recommended: false,
  },
  surveys: {
    id: "surveys",
    category: "strategy",
    defaultRoute: "/questionnaire/reponses",
    routePrefixes: ["/questionnaire/reponses"],
    recommended: false,
  },
};

export const ALL_MODULE_IDS = Object.keys(MODULE_REGISTRY) as AppModuleId[];

/** Ordre d'affichage du catalogue et de la navigation. */
export const MODULE_DISPLAY_ORDER: AppModuleId[] = [
  "dashboard",
  "workspace",
  "asks",
  "planning",
  "events",
  "social",
  "dam",
  "stock",
  "ideas",
  "okr",
  "surveys",
];

export const MODULE_CATEGORY_ORDER: ModuleCategory[] = [
  "pilotage",
  "communication",
  "operations",
  "strategy",
];

/** Modules pré-cochés à l'onboarding (recommandés). */
export const DEFAULT_ONBOARDING_MODULES: AppModuleId[] = ALL_MODULE_IDS.filter(
  (id) => MODULE_REGISTRY[id].recommended,
);

/** Priorité pour la redirection après connexion / setup. */
const LANDING_PRIORITY: AppModuleId[] = [
  "dashboard",
  "workspace",
  "asks",
  "planning",
  "events",
  "social",
  "stock",
  "dam",
  "ideas",
  "okr",
  "surveys",
];

export function parseEnabledModules(raw: unknown): AppModuleId[] | null {
  if (raw == null) return null;
  if (!Array.isArray(raw)) return null;
  const valid = new Set(ALL_MODULE_IDS);
  const parsed = raw.filter((v): v is AppModuleId => typeof v === "string" && valid.has(v as AppModuleId));
  return parsed.length > 0 ? parsed : [];
}

export function resolveEnabledModules(stored: AppModuleId[] | null | undefined): AppModuleId[] {
  if (stored == null) return [...ALL_MODULE_IDS];
  return stored.length > 0 ? stored : [...ALL_MODULE_IDS];
}

export function isModuleEnabled(enabledModules: AppModuleId[], moduleId: AppModuleId): boolean {
  return enabledModules.includes(moduleId);
}

export function toggleModule(
  enabledModules: AppModuleId[],
  moduleId: AppModuleId,
  enabled: boolean,
): AppModuleId[] {
  if (enabled) {
    return enabledModules.includes(moduleId) ? enabledModules : [...enabledModules, moduleId];
  }
  return enabledModules.filter((id) => id !== moduleId);
}

export function getModulesByCategory(): Record<ModuleCategory, AppModuleDefinition[]> {
  const grouped = Object.fromEntries(
    MODULE_CATEGORY_ORDER.map((c) => [c, [] as AppModuleDefinition[]]),
  ) as Record<ModuleCategory, AppModuleDefinition[]>;

  for (const id of MODULE_DISPLAY_ORDER) {
    const mod = MODULE_REGISTRY[id];
    grouped[mod.category].push(mod);
  }
  return grouped;
}

export function resolveModuleForPath(pathname: string): AppModuleId | null {
  const path = pathname.split("?")[0] ?? pathname;

  if (path === "/dashboard/triage") return "asks";

  for (const id of MODULE_DISPLAY_ORDER) {
    const mod = MODULE_REGISTRY[id];
    if (mod.routePrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
      return id;
    }
  }
  return null;
}

export function isPathAllowedForModules(pathname: string, enabledModules: AppModuleId[]): boolean {
  const path = pathname.split("?")[0] ?? pathname;
  if (path === "/settings" || path.startsWith("/settings/")) return true;

  const moduleId = resolveModuleForPath(path);
  if (!moduleId) return true;
  return isModuleEnabled(enabledModules, moduleId);
}

export function getDefaultModuleRoute(enabledModules: AppModuleId[]): string {
  for (const id of LANDING_PRIORITY) {
    if (isModuleEnabled(enabledModules, id)) {
      return MODULE_REGISTRY[id].defaultRoute;
    }
  }
  return "/settings";
}

export function validateEnabledModules(modules: AppModuleId[]): string | null {
  if (modules.length === 0) {
    return "Sélectionnez au moins un module pour votre espace.";
  }
  const valid = new Set(ALL_MODULE_IDS);
  if (!modules.every((id) => valid.has(id))) {
    return "Modules invalides détectés.";
  }
  return null;
}

export {
  LANDING_MODULE_ORDER,
  MODULE_GLYPH_META,
  getModuleGlyphMeta,
  type ModuleGlyphColor,
  type ModuleGlyphMeta,
  type ModuleGlyphShape,
} from "./moduleGlyphs";
