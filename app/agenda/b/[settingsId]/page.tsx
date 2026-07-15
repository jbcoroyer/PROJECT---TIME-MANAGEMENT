import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicBookingForm from "../../../../components/v2/agenda/PublicBookingForm";
import { getPublicAgendaMeta } from "../../../../app/actions/agenda";

type PageProps = {
  params: Promise<{ settingsId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { settingsId } = await params;
  const meta = await getPublicAgendaMeta(settingsId);
  return {
    title: meta?.title ?? "Réserver un créneau",
    description: meta?.welcomeMessage || "Prise de rendez-vous en ligne.",
  };
}

export default async function PublicAgendaBookingPage({ params }: PageProps) {
  const { settingsId } = await params;
  const meta = await getPublicAgendaMeta(settingsId);
  if (!meta) notFound();
  return <PublicBookingForm meta={meta} />;
}
