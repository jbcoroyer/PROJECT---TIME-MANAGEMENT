import { redirect } from "next/navigation";
import BillingRequiredScreen from "../../components/billing/BillingRequiredScreen";
import { getDefaultModuleRoute } from "../../lib/modules";
import { resolveBillingAccess } from "../../lib/billing/resolveBillingAccess";
import { getBrandingServer } from "../../lib/server/getBrandingServer";
import { SETUP_PATH } from "../../lib/setupPaths";
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
    const branding = await getBrandingServer();
    if (!branding.isConfigured) {
      redirect(SETUP_PATH);
    }
    redirect(getDefaultModuleRoute(branding.enabledModules));
  }

  return (
    <BillingRequiredScreen reason={access.reason} trialDaysLeft={access.trialDaysLeft} />
  );
}
