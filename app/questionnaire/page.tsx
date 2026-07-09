import type { Metadata } from "next";
import SurveyForm from "../../components/survey/SurveyForm";
import { brandingToMetadata } from "../../lib/branding";
import { getBrandingServer } from "../../lib/server/getBrandingServer";

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getBrandingServer();
  return {
    ...brandingToMetadata(branding),
    title: "Questionnaire de satisfaction",
    description: `Donnez votre avis sur ${branding.appName}. Questionnaire anonyme, environ 5 minutes.`,
  };
}

export default function QuestionnairePage() {
  return <SurveyForm surveyId="satisfaction-2026" />;
}
