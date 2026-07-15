import { isQuestionVisible } from "../survey/surveyDefinitionUtils";
import type { SurveyAnswers, SurveyDefinition } from "../survey/surveyTypes";
import type { SubmitPublicIntakeInput } from "../../app/actions/intakeForm";
import {
  INTAKE_QUESTION_IDS,
  isMappedIntakeQuestionId,
  orderedIntakeQuestions,
} from "./intakeFormDefinition";

function asString(value: SurveyAnswers[string]): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.join(", ");
  return "";
}

function formatExtraAnswer(label: string, value: SurveyAnswers[string]): string {
  const text = asString(value);
  if (!text) return "";
  return `${label} : ${text}`;
}

/** Valide les réponses obligatoires selon la définition. */
export function validateIntakeAnswers(
  definition: SurveyDefinition,
  answers: SurveyAnswers,
): string | null {
  const selectedPrestations: string[] = [];

  for (const question of orderedIntakeQuestions(definition)) {
    if (!question.required) continue;
    if (!isQuestionVisible(question, selectedPrestations)) continue;

    const value = answers[question.id];
    const isEmpty =
      value == null ||
      (typeof value === "string" && value.trim() === "") ||
      (Array.isArray(value) && value.length === 0);

    if (isEmpty) {
      return `Le champ « ${question.label} » est requis.`;
    }
  }

  const email = asString(answers[INTAKE_QUESTION_IDS.requesterEmail]);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Adresse e-mail invalide.";
  }

  return null;
}

/** Convertit les réponses du formulaire dynamique en payload de soumission. */
export function mapIntakeAnswersToInput(
  definition: SurveyDefinition,
  answers: SurveyAnswers,
): SubmitPublicIntakeInput {
  const ids = INTAKE_QUESTION_IDS;

  const extraLines = orderedIntakeQuestions(definition)
    .filter((q) => !isMappedIntakeQuestionId(q.id))
    .map((q) => formatExtraAnswer(q.label, answers[q.id]))
    .filter(Boolean);

  const baseDescription = asString(answers[ids.description]);
  const description =
    extraLines.length > 0
      ? [baseDescription, ...extraLines].filter(Boolean).join("\n\n")
      : baseDescription;

  const company = asString(answers[ids.company]);

  return {
    title: asString(answers[ids.title]),
    expectedSupport: asString(answers[ids.expectedSupport]),
    supportFormat: asString(answers[ids.supportFormat]),
    company: company === "—" ? "" : company,
    deadline: asString(answers[ids.deadline]),
    description,
    requesterName: asString(answers[ids.requesterName]),
    requesterEmail: asString(answers[ids.requesterEmail]),
  };
}
