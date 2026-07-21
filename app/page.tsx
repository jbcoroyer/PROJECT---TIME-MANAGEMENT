import { redirect } from "next/navigation";
import LandingPage from "../components/marketing/LandingPage";
import { getServerAuthUser } from "../lib/server/authSafe";
import { createServerSupabase } from "../lib/server/supabaseServer";
import { SETUP_PATH, INVITE_ACCEPT_PATH } from "../lib/setupPaths";
import { needsInviteProfileCompletion } from "../lib/inviteOnboarding";
import { resolveOrganizationSetupStatus } from "../lib/setup/resolveOrganizationSetupStatus";

export default async function Home() {
  const supabase = await createServerSupabase();
  const user = await getServerAuthUser(supabase);

  if (!user) {
    return <LandingPage />;
  }

  if (needsInviteProfileCompletion(user)) {
    redirect(INVITE_ACCEPT_PATH);
  }

  const status = await resolveOrganizationSetupStatus();
  if (!status.isConfiguredResolved) {
    redirect(SETUP_PATH);
  }

  redirect(status.defaultRoute);
}
