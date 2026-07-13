import { redirect } from "next/navigation";
import HomeLogin from "../components/auth/HomeLogin";
import { getDefaultModuleRoute } from "../lib/modules";
import { getBrandingServer } from "../lib/server/getBrandingServer";
import { createServerSupabase } from "../lib/server/supabaseServer";
import { SETUP_PATH } from "../lib/setupPaths";

export default async function Home() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <HomeLogin />;
  }

  const branding = await getBrandingServer();
  if (!branding.isConfigured) {
    redirect(SETUP_PATH);
  }

  redirect(getDefaultModuleRoute(branding.enabledModules));
}
