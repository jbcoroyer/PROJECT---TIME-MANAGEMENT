import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import V2AppLayout from "../../components/v2/V2AppLayout";
import { BILLING_REQUIRED_PATH } from "../../lib/billing/billingPaths";
import { isBillingEnforcementEnabled } from "../../lib/billing/enforcement";
import { resolveBillingAccess } from "../../lib/billing/resolveBillingAccess";
import { isPlatformAdminEmail } from "../../lib/server/platformAdmin";
import { createServerSupabase } from "../../lib/server/supabaseServer";
import { SETUP_PATH, INVITE_ACCEPT_PATH } from "../../lib/setupPaths";
import { needsInviteProfileCompletion } from "../../lib/inviteOnboarding";
import { resolveOrganizationSetupStatus } from "../../lib/setup/resolveOrganizationSetupStatus";

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    if (needsInviteProfileCompletion(user)) {
      redirect(INVITE_ACCEPT_PATH);
    }

    const status = await resolveOrganizationSetupStatus();
    if (!status.isConfiguredResolved) {
      redirect(SETUP_PATH);
    }

    if (isBillingEnforcementEnabled()) {
      const billing = await resolveBillingAccess(supabase, user.id);
      const platformAdmin = isPlatformAdminEmail(user.email);
      if (!billing.allowed && !platformAdmin) {
        redirect(BILLING_REQUIRED_PATH);
      }
    }
  }

  return <V2AppLayout>{children}</V2AppLayout>;
}
