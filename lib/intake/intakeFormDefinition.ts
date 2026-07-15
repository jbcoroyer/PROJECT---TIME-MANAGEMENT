import type { Question, SurveyDefinition } from "../survey/surveyTypes";
import { generateQuestionId } from "../survey/surveyDefinitionUtils";

/** Identifiants stables des champs mappés vers intake_requests. */
export const INTAKE_QUESTION_IDS = {
  requesterName: "intake_requester_name",
  requesterEmail: "intake_requester_email",
  title: "intake_title",
  expectedSupport: "intake_expected_support",
  supportFormat: "intake_support_format",
  company: "intake_company",
  deadline: "intake_deadline",
  description: "intake_description",
} as const;

const SUPPORT_FORMAT_OPTIONS = [
  "A4 print",
  "PDF",
  "Carré Instagram 1080×1080",
  "Story Instagram 1080×1920",
  "Post LinkedIn 1200×627",
] as const;

export function parseIntakeFormDefinition(raw: unknown): SurveyDefinition | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as SurveyDefinition;
  if (!d.version || !Array.isArray(d.questions) || !Array.isArray(d.steps)) return null;
  return d;
}

/** Définition par défaut alignée sur le formulaire public d'origine. */
export function createStarterIntakeDefinition(
  formId: string,
  title: string,
  welcomeMessage: string,
): SurveyDefinition {
  const ids = INTAKE_QUESTION_IDS;
  const questions: Question[] = [
    {
      id: ids.requesterName,
      type: "text",
      section: 1,
      label: "Votre nom",
      required: true,
    },
    {
      id: ids.requesterEmail,
      type: "text",
      section: 1,
      label: "Votre e-mail",
      required: true,
      inputVariant: "email",
    },
    {
      id: ids.title,
      type: "text",
      section: 1,
      label: "Nom du projet",
      required: true,
      placeholder: "Ex. Campagne salon VIV Europe",
    },
    {
      id: ids.expectedSupport,
      type: "text",
      section: 1,
      label: "Support attendu",
      required: true,
      placeholder: "Ex. Flyer, visuel réseaux sociaux, kakémono…",
    },
    {
      id: ids.supportFormat,
      type: "single",
      section: 1,
      label: "Format du support",
      required: true,
      options: [...SUPPORT_FORMAT_OPTIONS],
    },
    {
      id: ids.company,
      type: "single",
      section: 1,
      label: "Société",
      required: false,
      optionsSource: "companies",
      options: ["—"],
    },
    {
      id: ids.deadline,
      type: "text",
      section: 1,
      label: "Échéance",
      required: true,
      inputVariant: "date",
    },
    {
      id: ids.description,
      type: "open",
      section: 1,
      label: "Description du projet",
      required: false,
      placeholder: "Contexte, objectifs, public cible, contraintes, références…",
    },
  ];

  const questionIds = questions.map((q) => q.id);

  return {
    version: formId,
    title,
    intro: {
      title,
      subtitle:
        welcomeMessage.trim() ||
        "Décrivez votre besoin. Notre équipe qualifiera votre demande avant de la traiter.",
      estimatedMinutes: 3,
    },
    questions,
    steps: [
      {
        id: "section-1",
        title: "Votre demande",
        subtitle: "",
        questionIds,
      },
    ],
    exports: {
      respondentNameQuestionId: ids.requesterName,
    },
  };
}

/** Questions dans l'ordre d'affichage (tous les écrans). */
export function orderedIntakeQuestions(definition: SurveyDefinition): Question[] {
  const byId = new Map(definition.questions.map((q) => [q.id, q]));
  const ordered: Question[] = [];
  const used = new Set<string>();

  for (const step of definition.steps) {
    for (const id of step.questionIds) {
      const q = byId.get(id);
      if (q && !used.has(id)) {
        ordered.push(q);
        used.add(id);
      }
    }
  }

  for (const q of definition.questions) {
    if (!used.has(q.id)) ordered.push(q);
  }

  return ordered;
}

export function isMappedIntakeQuestionId(id: string): boolean {
  return Object.values(INTAKE_QUESTION_IDS).includes(id as (typeof INTAKE_QUESTION_IDS)[keyof typeof INTAKE_QUESTION_IDS]);
}

/** Bump la version après modification structurelle (facultatif). */
export function bumpIntakeDefinitionVersion(definition: SurveyDefinition): SurveyDefinition {
  return {
    ...definition,
    version: generateQuestionId(),
  };
}
