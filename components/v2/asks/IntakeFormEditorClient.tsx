"use client";

import SurveyEditorWorkspace from "../../survey/responses/SurveyEditorWorkspace";
import { saveIntakeFormDefinition } from "../../../app/actions/intakeForm";
import type { SurveyDefinition } from "../../../lib/survey/surveyTypes";

type IntakeFormEditorClientProps = {
  formId: string;
  title: string;
  initialDefinition: SurveyDefinition;
};

export default function IntakeFormEditorClient({
  formId,
  title,
  initialDefinition,
}: IntakeFormEditorClientProps) {
  return (
    <SurveyEditorWorkspace
      formId={formId}
      title={title}
      initialDefinition={initialDefinition}
      onSave={(definition) => saveIntakeFormDefinition(formId, definition)}
      backHref="/asks"
      backLabel="Retour à l'espace demandes"
      successMessage="Formulaire enregistré."
      showPrestationRules={false}
    />
  );
}
