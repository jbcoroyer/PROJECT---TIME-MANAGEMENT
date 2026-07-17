import { notFound } from "next/navigation";
import IntakeFormHubWorkspace from "../../../../components/v2/asks/IntakeFormHubWorkspace";
import { getIntakeForm } from "../../../../app/actions/intakeForm";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ formId: string }>;
};

export default async function IntakeFormDetailPage({ params }: PageProps) {
  const { formId } = await params;
  const form = await getIntakeForm(formId);
  if (!form) notFound();

  return <IntakeFormHubWorkspace form={form} />;
}
