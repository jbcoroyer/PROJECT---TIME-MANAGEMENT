import { notFound } from "next/navigation";
import IntakeFormEditorClient from "../../../../components/v2/asks/IntakeFormEditorClient";
import { fetchIntakeFormDefinition, getOrgIntakeForm } from "../../../../app/actions/intakeForm";

export const dynamic = "force-dynamic";

export default async function IntakeFormEditPage() {
  const form = await getOrgIntakeForm();
  if (!form) notFound();

  const result = await fetchIntakeFormDefinition(form.id);
  if (!result.ok) notFound();

  return (
    <IntakeFormEditorClient
      formId={form.id}
      title={form.title}
      initialDefinition={result.definition}
    />
  );
}
