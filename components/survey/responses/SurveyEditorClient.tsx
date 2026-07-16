"use client";

import SurveyEditorWorkspace from "./SurveyEditorWorkspace";
import { saveSurveyDefinition } from "../../../app/actions/survey";
import type { SurveyDefinition } from "../../../lib/survey/surveyTypes";
import { useTranslation } from "../../../lib/i18n/useTranslation";

type SurveyEditorClientProps = {
  surveyId: string;
  title: string;
  initialDefinition: SurveyDefinition;
  backHref: string;
  backLabel?: string;
};

export default function SurveyEditorClient({
  surveyId,
  title,
  initialDefinition,
  backHref,
  backLabel,
}: SurveyEditorClientProps) {
  const { t } = useTranslation();

  return (
    <SurveyEditorWorkspace
      formId={surveyId}
      title={title}
      initialDefinition={initialDefinition}
      onSave={(definition) => saveSurveyDefinition(surveyId, definition)}
      backHref={backHref}
      backLabel={backLabel ?? t("survey.editor.back")}
      successMessage={t("survey.editor.successQuestionnaire")}
    />
  );
}
