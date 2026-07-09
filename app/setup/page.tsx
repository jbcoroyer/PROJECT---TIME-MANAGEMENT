import { redirect } from "next/navigation";
import SetupGate from "../../components/setup/SetupGate";
import SetupPageContent from "../../components/setup/SetupPageContent";
import { getSetupAccess } from "../actions/setup";

export const metadata = {
  title: "Installation",
};

export default async function SetupPage() {
  const access = await getSetupAccess();

  if (access.isConfigured) {
    redirect("/v2/dashboard/kanban");
  }

  if (!access.isAuthenticated) {
    return <SetupGate variant="sign-in" />;
  }

  if (!access.canCompleteSetup) {
    return <SetupGate variant="pending" />;
  }

  return <SetupPageContent />;
}
