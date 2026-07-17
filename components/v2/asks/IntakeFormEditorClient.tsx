"use client";

import SurveyEditorWorkspace from "../../survey/responses/SurveyEditorWorkspace";
import { saveIntakeFormDefinition } from "../../../app/actions/intakeForm";
import type { SurveyDefinition } from "../../../lib/survey/surveyTypes";
import { useTranslation } from "../../../lib/i18n/useTranslation";

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
  const { t } = useTranslation();

  return (
    <SurveyEditorWorkspace
      formId={formId}
      title={title}
      initialDefinition={initialDefinition}
      onSave={(definition) => saveIntakeFormDefinition(formId, definition)}
      backHref={`/asks/${formId}`}
      backLabel={t("asks.editor.backLabel")}
      successMessage={t("asks.editor.saveSuccess")}
      showPrestationRules={false}
    />
  );
}
