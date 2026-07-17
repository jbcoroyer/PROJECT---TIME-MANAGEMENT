import IntakeFormListWorkspace from "../../../components/v2/asks/IntakeFormListWorkspace";
import { listIntakeForms } from "../../../app/actions/intakeForm";

export const dynamic = "force-dynamic";

export default async function V2AsksPage() {
  const forms = await listIntakeForms();
  return <IntakeFormListWorkspace initialForms={forms} />;
}
