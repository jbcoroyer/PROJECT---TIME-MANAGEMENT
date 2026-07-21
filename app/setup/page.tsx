import { redirect } from "next/navigation";
import SetupGate from "../../components/setup/SetupGate";
import SetupPageContent from "../../components/setup/SetupPageContent";
import { getSetupAccess } from "../../lib/setup/getSetupAccess";
import { resolveOrganizationSetupStatus } from "../../lib/setup/resolveOrganizationSetupStatus";
import { resolveSetupPageDecision } from "../../lib/setup/setupAccessRules";

export const metadata = {
  title: "Installation",
};

async function waitForOrganizationProvisioned(maxAttempts = 8): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const access = await getSetupAccess();
    if (access.organizationId) return;
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
}

export default async function SetupPage() {
  await waitForOrganizationProvisioned();
  const status = await resolveOrganizationSetupStatus();

  const decision = resolveSetupPageDecision({
    isConfiguredResolved: status.isConfiguredResolved,
    isAuthenticated: status.isAuthenticated,
    organizationId: status.organizationId,
    canCompleteSetup: status.canCompleteSetup,
    defaultRoute: status.defaultRoute,
  });

  switch (decision.kind) {
    case "redirect-app":
      redirect(decision.route);
    case "sign-in":
      return <SetupGate variant="sign-in" />;
    case "provisioning":
      return <SetupGate variant="provisioning" />;
    case "pending":
      return <SetupGate variant="pending" />;
    case "wizard":
      return <SetupPageContent />;
  }
}
