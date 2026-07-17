import type { AppLocale } from "../i18n";
import { t } from "../i18n";
import type { Question, SurveyDefinition } from "../survey/surveyTypes";
import {
  createStarterIntakeDefinition,
  INTAKE_QUESTION_IDS,
} from "./intakeFormDefinition";

export const INTAKE_FORM_TEMPLATE_IDS = [
  "blank",
  "project",
  "general_inquiry",
  "support",
  "creative_brief",
] as const;

export type IntakeFormTemplateId = (typeof INTAKE_FORM_TEMPLATE_IDS)[number];

export type IntakeFormTemplateMeta = {
  id: IntakeFormTemplateId;
  fieldCount: number;
  estimatedMinutes: number;
};

export const INTAKE_FORM_TEMPLATE_META: IntakeFormTemplateMeta[] = [
  { id: "blank", fieldCount: 8, estimatedMinutes: 3 },
  { id: "project", fieldCount: 12, estimatedMinutes: 5 },
  { id: "general_inquiry", fieldCount: 10, estimatedMinutes: 3 },
  { id: "support", fieldCount: 11, estimatedMinutes: 4 },
  { id: "creative_brief", fieldCount: 14, estimatedMinutes: 6 },
];

function tk(locale: AppLocale, key: string, vars?: Record<string, string | number>): string {
  return t(locale, key, vars);
}

function tkOpt(locale: AppLocale, key: string, index: number): string {
  return t(locale, `${key}.${index}`);
}

function contactBlock(locale: AppLocale, withPhone: boolean): Question[] {
  const ids = INTAKE_QUESTION_IDS;
  const questions: Question[] = [
    {
      id: "extra_first_name",
      type: "text",
      section: 1,
      label: tk(locale, "asks.templates.fields.firstName"),
      required: true,
      placeholder: tk(locale, "asks.templates.fields.firstNamePlaceholder"),
    },
    {
      id: ids.requesterName,
      type: "text",
      section: 1,
      label: tk(locale, "asks.templates.fields.lastName"),
      required: true,
      placeholder: tk(locale, "asks.templates.fields.lastNamePlaceholder"),
    },
    {
      id: ids.requesterEmail,
      type: "text",
      section: 1,
      label: tk(locale, "asks.templates.fields.email"),
      required: true,
      inputVariant: "email",
    },
  ];

  if (withPhone) {
    questions.push({
      id: "extra_phone",
      type: "text",
      section: 1,
      label: tk(locale, "asks.templates.fields.phone"),
      required: false,
      placeholder: tk(locale, "asks.templates.fields.phonePlaceholder"),
    });
  }

  return questions;
}

function companyQuestion(locale: AppLocale): Question {
  return {
    id: INTAKE_QUESTION_IDS.company,
    type: "single",
    section: 1,
    label: tk(locale, "asks.templates.fields.company"),
    required: false,
    optionsSource: "companies",
    options: ["—"],
  };
}

function buildDefinition(
  formId: string,
  title: string,
  welcomeMessage: string,
  locale: AppLocale,
  templateKey: IntakeFormTemplateId,
  questions: Question[],
  sectionTitleKey: string,
  estimatedMinutes: number,
): SurveyDefinition {
  const ids = INTAKE_QUESTION_IDS;
  const introSubtitle =
    welcomeMessage.trim() ||
    tk(locale, `asks.templates.${templateKey}.defaultWelcome`);

  const questionIds = questions.map((q) => q.id);

  return {
    version: formId,
    title,
    intro: {
      title,
      subtitle: introSubtitle,
      estimatedMinutes,
    },
    questions,
    steps: [
      {
        id: "section-1",
        title: tk(locale, sectionTitleKey),
        subtitle: "",
        questionIds,
      },
    ],
    exports: {
      respondentNameQuestionId: ids.requesterName,
    },
  };
}

function projectTemplate(
  formId: string,
  title: string,
  welcomeMessage: string,
  locale: AppLocale,
): SurveyDefinition {
  const ids = INTAKE_QUESTION_IDS;
  const priorityOptions = [0, 1, 2, 3].map((i) =>
    tkOpt(locale, "asks.templates.options.priority", i),
  );

  const questions: Question[] = [
    ...contactBlock(locale, true),
    {
      id: ids.title,
      type: "text",
      section: 1,
      label: tk(locale, "asks.templates.fields.projectName"),
      required: true,
      placeholder: tk(locale, "asks.templates.fields.projectNamePlaceholder"),
    },
    {
      id: ids.expectedSupport,
      type: "text",
      section: 1,
      label: tk(locale, "asks.templates.fields.requestType"),
      required: true,
      placeholder: tk(locale, "asks.templates.fields.requestTypePlaceholder"),
    },
    {
      id: "extra_priority",
      type: "single",
      section: 1,
      label: tk(locale, "asks.templates.fields.priority"),
      required: true,
      options: priorityOptions,
    },
    companyQuestion(locale),
    {
      id: ids.deadline,
      type: "text",
      section: 1,
      label: tk(locale, "asks.templates.fields.deadline"),
      required: true,
      inputVariant: "date",
    },
    {
      id: "extra_budget",
      type: "text",
      section: 1,
      label: tk(locale, "asks.templates.fields.budget"),
      required: false,
      placeholder: tk(locale, "asks.templates.fields.budgetPlaceholder"),
    },
    {
      id: ids.supportFormat,
      type: "single",
      section: 1,
      label: tk(locale, "asks.templates.fields.deliverableFormat"),
      required: true,
      options: [0, 1, 2, 3, 4].map((i) =>
        tkOpt(locale, "asks.templates.options.deliverableFormat", i),
      ),
    },
    {
      id: ids.description,
      type: "open",
      section: 1,
      label: tk(locale, "asks.templates.fields.projectDescription"),
      required: false,
      placeholder: tk(locale, "asks.templates.fields.projectDescriptionPlaceholder"),
    },
  ];

  return buildDefinition(
    formId,
    title,
    welcomeMessage,
    locale,
    "project",
    questions,
    "asks.templates.project.sectionTitle",
    5,
  );
}

function generalInquiryTemplate(
  formId: string,
  title: string,
  welcomeMessage: string,
  locale: AppLocale,
): SurveyDefinition {
  const ids = INTAKE_QUESTION_IDS;
  const channelOptions = [0, 1, 2].map((i) =>
    tkOpt(locale, "asks.templates.options.responseChannel", i),
  );

  const questions: Question[] = [
    ...contactBlock(locale, true),
    {
      id: ids.title,
      type: "text",
      section: 1,
      label: tk(locale, "asks.templates.fields.subject"),
      required: true,
      placeholder: tk(locale, "asks.templates.fields.subjectPlaceholder"),
    },
    {
      id: ids.expectedSupport,
      type: "single",
      section: 1,
      label: tk(locale, "asks.templates.fields.department"),
      required: true,
      options: [0, 1, 2, 3, 4].map((i) =>
        tkOpt(locale, "asks.templates.options.department", i),
      ),
    },
    companyQuestion(locale),
    {
      id: ids.supportFormat,
      type: "single",
      section: 1,
      label: tk(locale, "asks.templates.fields.responseChannel"),
      required: true,
      options: channelOptions,
    },
    {
      id: ids.deadline,
      type: "text",
      section: 1,
      label: tk(locale, "asks.templates.fields.desiredDate"),
      required: true,
      inputVariant: "date",
      help: tk(locale, "asks.templates.fields.desiredDateHelp"),
    },
    {
      id: ids.description,
      type: "open",
      section: 1,
      label: tk(locale, "asks.templates.fields.message"),
      required: true,
      placeholder: tk(locale, "asks.templates.fields.messagePlaceholder"),
    },
  ];

  return buildDefinition(
    formId,
    title,
    welcomeMessage,
    locale,
    "general_inquiry",
    questions,
    "asks.templates.general_inquiry.sectionTitle",
    3,
  );
}

function supportTemplate(
  formId: string,
  title: string,
  welcomeMessage: string,
  locale: AppLocale,
): SurveyDefinition {
  const ids = INTAKE_QUESTION_IDS;

  const questions: Question[] = [
    ...contactBlock(locale, true),
    {
      id: ids.title,
      type: "text",
      section: 1,
      label: tk(locale, "asks.templates.fields.issueSubject"),
      required: true,
      placeholder: tk(locale, "asks.templates.fields.issueSubjectPlaceholder"),
    },
    {
      id: ids.expectedSupport,
      type: "single",
      section: 1,
      label: tk(locale, "asks.templates.fields.issueCategory"),
      required: true,
      options: [0, 1, 2, 3, 4].map((i) =>
        tkOpt(locale, "asks.templates.options.issueCategory", i),
      ),
    },
    {
      id: "extra_priority",
      type: "single",
      section: 1,
      label: tk(locale, "asks.templates.fields.urgency"),
      required: true,
      options: [0, 1, 2].map((i) => tkOpt(locale, "asks.templates.options.urgency", i)),
    },
    companyQuestion(locale),
    {
      id: ids.supportFormat,
      type: "single",
      section: 1,
      label: tk(locale, "asks.templates.fields.impact"),
      required: true,
      options: [0, 1, 2].map((i) => tkOpt(locale, "asks.templates.options.impact", i)),
    },
    {
      id: ids.deadline,
      type: "text",
      section: 1,
      label: tk(locale, "asks.templates.fields.resolutionDeadline"),
      required: true,
      inputVariant: "date",
    },
    {
      id: ids.description,
      type: "open",
      section: 1,
      label: tk(locale, "asks.templates.fields.issueDescription"),
      required: true,
      placeholder: tk(locale, "asks.templates.fields.issueDescriptionPlaceholder"),
    },
  ];

  return buildDefinition(
    formId,
    title,
    welcomeMessage,
    locale,
    "support",
    questions,
    "asks.templates.support.sectionTitle",
    4,
  );
}

function creativeBriefTemplate(
  formId: string,
  title: string,
  welcomeMessage: string,
  locale: AppLocale,
): SurveyDefinition {
  const ids = INTAKE_QUESTION_IDS;

  const questions: Question[] = [
    ...contactBlock(locale, true),
    {
      id: ids.title,
      type: "text",
      section: 1,
      label: tk(locale, "asks.templates.fields.campaignName"),
      required: true,
      placeholder: tk(locale, "asks.templates.fields.campaignNamePlaceholder"),
    },
    {
      id: ids.expectedSupport,
      type: "text",
      section: 1,
      label: tk(locale, "asks.templates.fields.supportType"),
      required: true,
      placeholder: tk(locale, "asks.templates.fields.supportTypePlaceholder"),
    },
    {
      id: ids.supportFormat,
      type: "single",
      section: 1,
      label: tk(locale, "asks.templates.fields.mainFormat"),
      required: true,
      options: [0, 1, 2, 3, 4, 5].map((i) =>
        tkOpt(locale, "asks.templates.options.creativeFormat", i),
      ),
    },
    {
      id: "extra_deliverables",
      type: "open",
      section: 1,
      label: tk(locale, "asks.templates.fields.deliverables"),
      required: true,
      placeholder: tk(locale, "asks.templates.fields.deliverablesPlaceholder"),
    },
    companyQuestion(locale),
    {
      id: ids.deadline,
      type: "text",
      section: 1,
      label: tk(locale, "asks.templates.fields.deadline"),
      required: true,
      inputVariant: "date",
    },
    {
      id: "extra_budget",
      type: "text",
      section: 1,
      label: tk(locale, "asks.templates.fields.budget"),
      required: false,
      placeholder: tk(locale, "asks.templates.fields.budgetPlaceholder"),
    },
    {
      id: ids.description,
      type: "open",
      section: 1,
      label: tk(locale, "asks.templates.fields.briefContext"),
      required: true,
      placeholder: tk(locale, "asks.templates.fields.briefContextPlaceholder"),
    },
    {
      id: "extra_references",
      type: "open",
      section: 1,
      label: tk(locale, "asks.templates.fields.references"),
      required: false,
      placeholder: tk(locale, "asks.templates.fields.referencesPlaceholder"),
    },
    {
      id: "extra_brand",
      type: "open",
      section: 1,
      label: tk(locale, "asks.templates.fields.brandGuidelines"),
      required: false,
      placeholder: tk(locale, "asks.templates.fields.brandGuidelinesPlaceholder"),
    },
  ];

  return buildDefinition(
    formId,
    title,
    welcomeMessage,
    locale,
    "creative_brief",
    questions,
    "asks.templates.creative_brief.sectionTitle",
    6,
  );
}

export function isIntakeFormTemplateId(value: string): value is IntakeFormTemplateId {
  return (INTAKE_FORM_TEMPLATE_IDS as readonly string[]).includes(value);
}

/** Construit la définition initiale selon le modèle choisi (ou blank = défaut historique). */
export function createIntakeDefinitionFromTemplate(
  formId: string,
  title: string,
  welcomeMessage: string,
  templateId: IntakeFormTemplateId,
  locale: AppLocale = "fr",
): SurveyDefinition {
  switch (templateId) {
    case "blank":
      return createStarterIntakeDefinition(formId, title, welcomeMessage);
    case "project":
      return projectTemplate(formId, title, welcomeMessage, locale);
    case "general_inquiry":
      return generalInquiryTemplate(formId, title, welcomeMessage, locale);
    case "support":
      return supportTemplate(formId, title, welcomeMessage, locale);
    case "creative_brief":
      return creativeBriefTemplate(formId, title, welcomeMessage, locale);
    default:
      return createStarterIntakeDefinition(formId, title, welcomeMessage);
  }
}

export function defaultWelcomeForTemplate(
  templateId: IntakeFormTemplateId,
  locale: AppLocale,
): string {
  if (templateId === "blank") {
    return tk(locale, "asks.hub.defaultWelcomeMessage");
  }
  return tk(locale, `asks.templates.${templateId}.defaultWelcome`);
}

export function defaultTitleForTemplate(
  templateId: IntakeFormTemplateId,
  locale: AppLocale,
  appName: string,
): string {
  if (templateId === "blank") {
    return tk(locale, "asks.hub.defaultTitle", { appName });
  }
  return tk(locale, `asks.templates.${templateId}.defaultTitle`, { appName });
}
