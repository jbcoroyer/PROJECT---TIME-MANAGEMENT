import type { AppModuleId } from "../modules/types";

export type ModuleTourStepDef = {
  id: string;
  titleKey: string;
  bodyKey: string;
  targetSelector?: string;
  cardPosition?: "bottom" | "top" | "auto";
  /** Carte flottante sans spotlight (moins intrusif sur la page). */
  floating?: boolean;
};

export type ModuleTourDefinition = {
  route: string;
  navSelector: string;
  steps: ModuleTourStepDef[];
};

/** Mini-tutoriels par module — 2 étapes max, courts et non bloquants. */
export const MODULE_TOUR_DEFINITIONS: Partial<Record<AppModuleId, ModuleTourDefinition>> = {
  workspace: {
    route: "/agenda",
    navSelector: '[data-tutorial="nav-workspace"]',
    steps: [
      {
        id: "overview",
        titleKey: "moduleTutorials.workspace.step1.title",
        bodyKey: "moduleTutorials.workspace.step1.body",
        floating: true,
      },
      {
        id: "deadlines",
        titleKey: "moduleTutorials.workspace.step2.title",
        bodyKey: "moduleTutorials.workspace.step2.body",
        floating: true,
      },
    ],
  },
  asks: {
    route: "/asks",
    navSelector: '[data-tutorial="nav-asks"]',
    steps: [
      {
        id: "inbox",
        titleKey: "moduleTutorials.asks.step1.title",
        bodyKey: "moduleTutorials.asks.step1.body",
        floating: true,
      },
      {
        id: "convert",
        titleKey: "moduleTutorials.asks.step2.title",
        bodyKey: "moduleTutorials.asks.step2.body",
        floating: true,
      },
    ],
  },
  planning: {
    route: "/planning",
    navSelector: '[data-tutorial="nav-planning"]',
    steps: [
      {
        id: "timeline",
        titleKey: "moduleTutorials.planning.step1.title",
        bodyKey: "moduleTutorials.planning.step1.body",
        floating: true,
      },
      {
        id: "capacity",
        titleKey: "moduleTutorials.planning.step2.title",
        bodyKey: "moduleTutorials.planning.step2.body",
        floating: true,
      },
    ],
  },
  events: {
    route: "/events/dashboard",
    navSelector: '[data-tutorial="nav-events"]',
    steps: [
      {
        id: "events-board",
        titleKey: "moduleTutorials.events.step1.title",
        bodyKey: "moduleTutorials.events.step1.body",
        floating: true,
      },
      {
        id: "event-tasks",
        titleKey: "moduleTutorials.events.step2.title",
        bodyKey: "moduleTutorials.events.step2.body",
        floating: true,
      },
    ],
  },
  social: {
    route: "/social",
    navSelector: '[data-tutorial="nav-social"]',
    steps: [
      {
        id: "calendar",
        titleKey: "moduleTutorials.social.step1.title",
        bodyKey: "moduleTutorials.social.step1.body",
        floating: true,
      },
      {
        id: "posts",
        titleKey: "moduleTutorials.social.step2.title",
        bodyKey: "moduleTutorials.social.step2.body",
        floating: true,
      },
    ],
  },
  dam: {
    route: "/dam",
    navSelector: '[data-tutorial="nav-dam"]',
    steps: [
      {
        id: "library",
        titleKey: "moduleTutorials.dam.step1.title",
        bodyKey: "moduleTutorials.dam.step1.body",
        floating: true,
      },
      {
        id: "share",
        titleKey: "moduleTutorials.dam.step2.title",
        bodyKey: "moduleTutorials.dam.step2.body",
        floating: true,
      },
    ],
  },
  stock: {
    route: "/stock",
    navSelector: '[data-tutorial="nav-stock"]',
    steps: [
      {
        id: "inventory",
        titleKey: "moduleTutorials.stock.step1.title",
        bodyKey: "moduleTutorials.stock.step1.body",
        floating: true,
      },
      {
        id: "movements",
        titleKey: "moduleTutorials.stock.step2.title",
        bodyKey: "moduleTutorials.stock.step2.body",
        floating: true,
      },
    ],
  },
  ideas: {
    route: "/ideas",
    navSelector: '[data-tutorial="nav-ideas"]',
    steps: [
      {
        id: "board",
        titleKey: "moduleTutorials.ideas.step1.title",
        bodyKey: "moduleTutorials.ideas.step1.body",
        floating: true,
      },
      {
        id: "vote",
        titleKey: "moduleTutorials.ideas.step2.title",
        bodyKey: "moduleTutorials.ideas.step2.body",
        floating: true,
      },
    ],
  },
  okr: {
    route: "/okr",
    navSelector: '[data-tutorial="nav-okr"]',
    steps: [
      {
        id: "objectives",
        titleKey: "moduleTutorials.okr.step1.title",
        bodyKey: "moduleTutorials.okr.step1.body",
        floating: true,
      },
      {
        id: "progress",
        titleKey: "moduleTutorials.okr.step2.title",
        bodyKey: "moduleTutorials.okr.step2.body",
        floating: true,
      },
    ],
  },
  surveys: {
    route: "/questionnaire/reponses",
    navSelector: '[data-tutorial="nav-surveys"]',
    steps: [
      {
        id: "responses",
        titleKey: "moduleTutorials.surveys.step1.title",
        bodyKey: "moduleTutorials.surveys.step1.body",
        floating: true,
      },
      {
        id: "create",
        titleKey: "moduleTutorials.surveys.step2.title",
        bodyKey: "moduleTutorials.surveys.step2.body",
        floating: true,
      },
    ],
  },
};

/** Modules proposés dans le hub (hors dashboard déjà exploré). */
export const MODULE_DISCOVERY_ORDER: AppModuleId[] = [
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
