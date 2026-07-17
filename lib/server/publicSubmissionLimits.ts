import type { SurveyAnswers, SurveyDefinition } from "../survey/surveyTypes";

/** Titre / libellé court (idées, demandes, champs texte questionnaire). */
export const PUBLIC_TEXT_TITLE_MAX = 200;

/** Description, commentaires, réponses ouvertes. */
export const PUBLIC_TEXT_BODY_MAX = 5000;

/** Nom, e-mail, entité, service, etc. */
export const PUBLIC_TEXT_SHORT_MAX = 500;

/** Nombre max d'options cochées (questionnaire / prestations). */
export const PUBLIC_ARRAY_MAX_ITEMS = 50;

export function clampPublicText(value: string, max: number): string {
  return value.trim().slice(0, max);
}

export function clampPublicOptionalText(
  value: string | null | undefined,
  max: number,
): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

/** Tronque les réponses questionnaire selon le type de question. */
export function sanitizeSurveyAnswers(
  answers: SurveyAnswers,
  definition: SurveyDefinition,
): SurveyAnswers {
  const out: SurveyAnswers = { ...answers };

  for (const question of definition.questions) {
    const raw = out[question.id];
    if (raw == null) continue;

    if (typeof raw === "string") {
      const max =
        question.type === "open"
          ? PUBLIC_TEXT_BODY_MAX
          : question.type === "text"
            ? PUBLIC_TEXT_SHORT_MAX
            : PUBLIC_TEXT_TITLE_MAX;
      out[question.id] = clampPublicText(raw, max);
      continue;
    }

    if (Array.isArray(raw)) {
      out[question.id] = raw
        .map((item) => clampPublicText(String(item), PUBLIC_TEXT_TITLE_MAX))
        .filter(Boolean)
        .slice(0, PUBLIC_ARRAY_MAX_ITEMS);
    }
  }

  return out;
}

export type SanitizedIntakeSubmission = {
  title: string;
  description: string;
  company: string;
  concern: string;
  supportFormat: string;
  deadline: string;
  requesterName: string;
  requesterEmail: string;
};

export function sanitizeIntakeSubmission(input: {
  title?: string;
  description?: string;
  company?: string;
  expectedSupport?: string;
  supportFormat?: string;
  deadline?: string;
  requesterName?: string;
  requesterEmail?: string;
}): SanitizedIntakeSubmission {
  return {
    title: clampPublicText(input.title ?? "", PUBLIC_TEXT_TITLE_MAX),
    description: clampPublicText(input.description ?? "", PUBLIC_TEXT_BODY_MAX),
    company: clampPublicText(input.company ?? "", PUBLIC_TEXT_SHORT_MAX),
    concern: clampPublicText(input.expectedSupport ?? "", PUBLIC_TEXT_BODY_MAX),
    supportFormat: clampPublicText(input.supportFormat ?? "", PUBLIC_TEXT_SHORT_MAX),
    deadline: clampPublicText(input.deadline ?? "", PUBLIC_TEXT_SHORT_MAX),
    requesterName: clampPublicText(input.requesterName ?? "", PUBLIC_TEXT_SHORT_MAX),
    requesterEmail: clampPublicText(input.requesterEmail ?? "", PUBLIC_TEXT_SHORT_MAX),
  };
}

export type SanitizedStockIdeaSubmission = {
  title: string;
  description: string | null;
};

export function sanitizeStockIdeaSubmission(input: {
  title?: string;
  description?: string | null;
}): SanitizedStockIdeaSubmission {
  const title = clampPublicText(input.title ?? "", PUBLIC_TEXT_TITLE_MAX);
  const descriptionRaw = input.description?.trim();
  const description = descriptionRaw
    ? clampPublicText(descriptionRaw, PUBLIC_TEXT_BODY_MAX)
    : null;
  return { title, description };
}
