import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import V2AppLayout from "../../components/v2/V2AppLayout";
import { BILLING_REQUIRED_PATH } from "../../lib/billing/billingPaths";
import { isBillingEnforcementEnabled } from "../../lib/billing/enforcement";
import { resolveBillingAccess } from "../../lib/billing/resolveBillingAccess";
import { getBrandingServer } from "../../lib/server/getBrandingServer";
import { isPlatformAdminEmail } from "../../lib/server/platformAdmin";
import { createServerSupabase } from "../../lib/server/supabaseServer";
import { SETUP_PATH } from "../../lib/setupPaths";

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const branding = await getBrandingServer();
    if (!branding.isConfigured) {
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
