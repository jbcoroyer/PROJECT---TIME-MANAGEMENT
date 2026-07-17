import { redirect } from "next/navigation";
import { listIntakeForms } from "../../../../app/actions/intakeForm";

export const dynamic = "force-dynamic";

/** Redirection legacy /asks/edit → premier formulaire ou liste. */
export default async function LegacyIntakeFormEditPage() {
  const forms = await listIntakeForms();
  if (forms.length === 1) {
    redirect(`/asks/${forms[0].id}/edit`);
  }
  redirect("/asks");
}
