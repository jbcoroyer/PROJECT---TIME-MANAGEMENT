import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicIntakeForm from "../../../../components/v2/asks/PublicIntakeForm";
import { getPublicIntakeFormMeta } from "../../../../app/actions/intakeForm";

type PageProps = {
  params: Promise<{ formId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { formId } = await params;
  const meta = await getPublicIntakeFormMeta(formId);
  return {
    title: meta?.title ?? "Soumettre une demande",
    description: meta?.welcomeMessage || "Formulaire de demande externe.",
  };
}

export default async function PublicIntakeFormPage({ params }: PageProps) {
  const { formId } = await params;
  const meta = await getPublicIntakeFormMeta(formId);
  if (!meta) notFound();

  return <PublicIntakeForm formId={formId} meta={meta} />;
}
