import { redirect } from "next/navigation";
import BillingRequiredScreen from "../../components/billing/BillingRequiredScreen";
import { resolveBillingAccess } from "../../lib/billing/resolveBillingAccess";
import { getServerOrgContext } from "../../lib/server/orgContext";
import { SETUP_PATH } from "../../lib/setupPaths";
import { resolveOrganizationSetupStatus } from "../../lib/setup/resolveOrganizationSetupStatus";
import { createServerSupabase } from "../../lib/server/supabaseServer";

export const metadata = {
  title: "Abonnement requis",
};

export default async function BillingRequiredPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const access = await resolveBillingAccess(supabase, user.id);
  if (access.allowed) {
    const status = await resolveOrganizationSetupStatus();
    if (!status.isConfiguredResolved) {
      redirect(SETUP_PATH);
    }
    redirect(status.defaultRoute);
  }

  const ctx = await getServerOrgContext();

  return (
    <BillingRequiredScreen
      reason={access.reason}
      trialDaysLeft={access.trialDaysLeft}
      isAdmin={ctx?.isAdmin ?? false}
    />
  );
}
