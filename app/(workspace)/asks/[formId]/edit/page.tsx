import { notFound, redirect } from "next/navigation";
import IntakeFormEditorClient from "../../../../../components/v2/asks/IntakeFormEditorClient";
import { fetchIntakeFormDefinition, getIntakeForm } from "../../../../../app/actions/intakeForm";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ formId: string }>;
};

export default async function IntakeFormEditPage({ params }: PageProps) {
  const { formId } = await params;
  const form = await getIntakeForm(formId);
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
