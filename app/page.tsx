import { redirect } from "next/navigation";
import LandingPage from "../components/marketing/LandingPage";
import { getDefaultModuleRoute } from "../lib/modules";
import { getBrandingServer } from "../lib/server/getBrandingServer";
import { createServerSupabase } from "../lib/server/supabaseServer";
import { SETUP_PATH, INVITE_ACCEPT_PATH } from "../lib/setupPaths";
import { needsInviteProfileCompletion } from "../lib/inviteOnboarding";

export default async function Home() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <LandingPage />;
  }

  if (needsInviteProfileCompletion(user)) {
    redirect(INVITE_ACCEPT_PATH);
  }

  const branding = await getBrandingServer();
  if (!branding.isConfigured) {
    redirect(SETUP_PATH);
  }

  redirect(getDefaultModuleRoute(branding.enabledModules));
}
