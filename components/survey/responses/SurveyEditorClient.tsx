"use client";

import SurveyEditorWorkspace from "./SurveyEditorWorkspace";
import { saveSurveyDefinition } from "../../../app/actions/survey";
import type { SurveyDefinition } from "../../../lib/survey/surveyTypes";

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
  backLabel = "Retour au questionnaire",
}: SurveyEditorClientProps) {
  return (
    <SurveyEditorWorkspace
      formId={surveyId}
      title={title}
      initialDefinition={initialDefinition}
      onSave={(definition) => saveSurveyDefinition(surveyId, definition)}
      backHref={backHref}
      backLabel={backLabel}
      successMessage="Questionnaire enregistré."
    />
  );
}
