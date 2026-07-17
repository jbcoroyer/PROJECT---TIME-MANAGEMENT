import { MODULE_DISPLAY_ORDER, MODULE_REGISTRY, type AppModuleId } from "../modules";

export type ModuleQuestionId = "primaryNeed" | "clientFlow" | "operations" | "teamExtras";

export type ModuleQuestionOption = {
  id: string;
  labelKey: string;
  modules: AppModuleId[];
};

export type ModuleQuestion = {
  id: ModuleQuestionId;
  titleKey: string;
  subtitleKey: string;
  options: ModuleQuestionOption[];
};

export const MODULE_QUESTIONNAIRE: ModuleQuestion[] = [
  {
    id: "primaryNeed",
    titleKey: "setup.moduleQuiz.q1Title",
    subtitleKey: "setup.moduleQuiz.q1Subtitle",
    options: [
      {
        id: "team",
        labelKey: "setup.moduleQuiz.q1Team",
        modules: ["dashboard", "workspace", "planning"],
      },
      {
        id: "clients",
        labelKey: "setup.moduleQuiz.q1Clients",
        modules: ["dashboard", "asks", "workspace"],
      },
      {
        id: "events",
        labelKey: "setup.moduleQuiz.q1Events",
        modules: ["dashboard", "events", "stock"],
      },
      {
        id: "strategy",
        labelKey: "setup.moduleQuiz.q1Strategy",
        modules: ["dashboard", "okr", "surveys"],
      },
    ],
  },
  {
    id: "clientFlow",
    titleKey: "setup.moduleQuiz.q2Title",
    subtitleKey: "setup.moduleQuiz.q2Subtitle",
    options: [
      {
        id: "forms",
        labelKey: "setup.moduleQuiz.q2Forms",
        modules: ["asks"],
      },
      {
        id: "booking",
        labelKey: "setup.moduleQuiz.q2Booking",
        modules: ["workspace"],
      },
      {
        id: "minimal",
        labelKey: "setup.moduleQuiz.q2Minimal",
        modules: [],
      },
    ],
  },
  {
    id: "operations",
    titleKey: "setup.moduleQuiz.q3Title",
    subtitleKey: "setup.moduleQuiz.q3Subtitle",
    options: [
      {
        id: "events",
        labelKey: "setup.moduleQuiz.q3Events",
        modules: ["events"],
      },
      {
        id: "stock",
        labelKey: "setup.moduleQuiz.q3Stock",
        modules: ["stock"],
      },
      {
        id: "none",
        labelKey: "setup.moduleQuiz.q3None",
        modules: [],
      },
    ],
  },
  {
    id: "teamExtras",
    titleKey: "setup.moduleQuiz.q4Title",
    subtitleKey: "setup.moduleQuiz.q4Subtitle",
    options: [
      {
        id: "ideas",
        labelKey: "setup.moduleQuiz.q4Ideas",
        modules: ["ideas"],
      },
      {
        id: "feedback",
        labelKey: "setup.moduleQuiz.q4Feedback",
        modules: ["surveys"],
      },
      {
        id: "planning",
        labelKey: "setup.moduleQuiz.q4Planning",
        modules: ["planning"],
      },
      {
        id: "none",
        labelKey: "setup.moduleQuiz.q4None",
        modules: [],
      },
    ],
  },
];

export type ModuleQuizAnswers = Partial<Record<ModuleQuestionId, string>>;

/** Recommande les modules à activer à partir des réponses du questionnaire. */
export function recommendModulesFromQuiz(answers: ModuleQuizAnswers): AppModuleId[] {
  const scores = new Map<AppModuleId, number>();

  const bump = (moduleId: AppModuleId, weight: number) => {
    if (!MODULE_REGISTRY[moduleId]?.commerciallyAvailable) return;
    scores.set(moduleId, (scores.get(moduleId) ?? 0) + weight);
  };

  bump("dashboard", 100);

  for (const question of MODULE_QUESTIONNAIRE) {
    const optionId = answers[question.id];
    if (!optionId) continue;
    const option = question.options.find((entry) => entry.id === optionId);
    if (!option) continue;
    for (const moduleId of option.modules) {
      bump(moduleId, 10);
    }
  }

  const ranked = MODULE_DISPLAY_ORDER.filter((id) => (scores.get(id) ?? 0) > 0).sort(
    (a, b) => (scores.get(b) ?? 0) - (scores.get(a) ?? 0),
  );

  if (ranked.length <= 1) {
    bump("workspace", 5);
    return MODULE_DISPLAY_ORDER.filter((id) => (scores.get(id) ?? 0) > 0);
  }

  return ranked;
}

export function isQuizComplete(answers: ModuleQuizAnswers): boolean {
  return MODULE_QUESTIONNAIRE.every((question) => Boolean(answers[question.id]));
}
