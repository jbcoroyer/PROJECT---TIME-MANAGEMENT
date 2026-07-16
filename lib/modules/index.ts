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
    commerciallyAvailable: true,
  },
  asks: {
    id: "asks",
    category: "pilotage",
    defaultRoute: "/asks",
    routePrefixes: ["/asks"],
    recommended: false,
    commerciallyAvailable: true,
  },
  workspace: {
    id: "workspace",
    category: "pilotage",
    defaultRoute: "/agenda",
    routePrefixes: ["/agenda", "/todo"],
    recommended: true,
    commerciallyAvailable: true,
  },
  planning: {
    id: "planning",
    category: "pilotage",
    defaultRoute: "/planning",
    routePrefixes: ["/planning"],
    recommended: false,
    commerciallyAvailable: true,
  },
  events: {
    id: "events",
    category: "operations",
    defaultRoute: "/events/dashboard",
    routePrefixes: ["/events"],
    recommended: false,
    commerciallyAvailable: true,
  },
  social: {
    id: "social",
    category: "communication",
    defaultRoute: "/social",
    routePrefixes: ["/social"],
    recommended: false,
    commerciallyAvailable: false,
  },
  dam: {
    id: "dam",
    category: "communication",
    defaultRoute: "/dam",
    routePrefixes: ["/dam"],
    recommended: false,
    commerciallyAvailable: false,
  },
  stock: {
    id: "stock",
    category: "operations",
    defaultRoute: "/stock",
    routePrefixes: ["/stock"],
    recommended: false,
    commerciallyAvailable: true,
  },
  ideas: {
    id: "ideas",
    category: "operations",
    defaultRoute: "/ideas",
    routePrefixes: ["/ideas"],
    recommended: false,
    commerciallyAvailable: true,
  },
  okr: {
    id: "okr",
    category: "strategy",
    defaultRoute: "/okr",
    routePrefixes: ["/okr"],
    recommended: false,
    commerciallyAvailable: true,
  },
  surveys: {
    id: "surveys",
    category: "strategy",
    defaultRoute: "/questionnaire/reponses",
    routePrefixes: ["/questionnaire/reponses"],
    recommended: false,
    commerciallyAvailable: true,
  },
};

export const ALL_MODULE_IDS = Object.keys(MODULE_REGISTRY) as AppModuleId[];

/** Ordre d'affichage du catalogue commercial (onboarding, settings). */
export const MODULE_DISPLAY_ORDER: AppModuleId[] = [
  "dashboard",
  "workspace",
  "asks",
  "planning",
  "events",
  "stock",
  "ideas",
  "okr",
  "surveys",
];

/** Ordre pour la résolution de routes — inclut les modules hors catalogue commercial. */
const ROUTE_RESOLUTION_ORDER: AppModuleId[] = [
  ...MODULE_DISPLAY_ORDER,
  "social",
  "dam",
];

export const MODULE_CATEGORY_ORDER: ModuleCategory[] = [
  "pilotage",
  "communication",
  "operations",
  "strategy",
];

/** Modules pré-cochés à l'onboarding (recommandés, catalogue commercial). */
export const DEFAULT_ONBOARDING_MODULES: AppModuleId[] = MODULE_DISPLAY_ORDER.filter(
  (id) => MODULE_REGISTRY[id].recommended && MODULE_REGISTRY[id].commerciallyAvailable,
);

/** Priorité pour la redirection après connexion / setup. */
const LANDING_PRIORITY: AppModuleId[] = [
  "dashboard",
  "workspace",
  "asks",
  "planning",
  "events",
  "stock",
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

export function getCommerciallyAvailableModules(): AppModuleId[] {
  return ALL_MODULE_IDS.filter((id) => MODULE_REGISTRY[id].commerciallyAvailable);
}

export function getCommerciallyAvailableCatalog(): Record<ModuleCategory, AppModuleDefinition[]> {
  const grouped = getModulesByCategory();
  return Object.fromEntries(
    MODULE_CATEGORY_ORDER.map((category) => [
      category,
      grouped[category].filter((mod) => mod.commerciallyAvailable),
    ]),
  ) as Record<ModuleCategory, AppModuleDefinition[]>;
}

export function resolveModuleForPath(pathname: string): AppModuleId | null {
  const path = pathname.split("?")[0] ?? pathname;

  if (path === "/dashboard/triage") return "asks";

  for (const id of ROUTE_RESOLUTION_ORDER) {
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
