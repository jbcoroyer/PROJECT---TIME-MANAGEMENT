import { notFound } from "next/navigation";
import AsksTriageWorkspace from "../../../../../components/v2/asks/AsksTriageWorkspace";
import { getIntakeForm } from "../../../../../app/actions/intakeForm";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ formId: string }>;
};

export default async function IntakeFormTriagePage({ params }: PageProps) {
  const { formId } = await params;
  const form = await getIntakeForm(formId);
  if (!form) notFound();

  return <AsksTriageWorkspace formId={form.id} formTitle={form.title} />;
}
