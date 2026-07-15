import IntakeFormHubWorkspace from "../../../components/v2/asks/IntakeFormHubWorkspace";
import { getOrgIntakeForm } from "../../../app/actions/intakeForm";

export const dynamic = "force-dynamic";

export default async function V2AsksPage() {
  const form = await getOrgIntakeForm();
  return <IntakeFormHubWorkspace initialForm={form} />;
}
