/** Identifiants stables des modules activables par organisation. */
export type AppModuleId =
  | "dashboard"
  | "asks"
  | "workspace"
  | "planning"
  | "events"
  | "social"
  | "dam"
  | "stock"
  | "ideas"
  | "okr"
  | "surveys";

export type ModuleCategory = "pilotage" | "communication" | "operations" | "strategy";

export type AppModuleDefinition = {
  id: AppModuleId;
  category: ModuleCategory;
  /** Route d'atterrissage par défaut pour ce module. */
  defaultRoute: string;
  /** Préfixes de routes protégées par ce module. */
  routePrefixes: readonly string[];
  /** Pré-sélectionné à l'onboarding (recommandé, désactivable). */
  recommended: boolean;
};
