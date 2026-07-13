import { redirect } from "next/navigation";
import SetupGate from "../../components/setup/SetupGate";
import SetupPageContent from "../../components/setup/SetupPageContent";
import { getSetupAccess } from "../actions/setup";
import { getBrandingServer } from "../../lib/server/getBrandingServer";
import { getDefaultModuleRoute } from "../../lib/modules";

export const metadata = {
  title: "Installation",
};

export default async function SetupPage() {
  const access = await getSetupAccess();

  if (access.isConfigured) {
    const branding = await getBrandingServer();
    redirect(getDefaultModuleRoute(branding.enabledModules));
  }

  if (!access.isAuthenticated) {
    return <SetupGate variant="sign-in" />;
  }

  if (!access.canCompleteSetup) {
    return <SetupGate variant="pending" />;
  }

  return <SetupPageContent />;
}
