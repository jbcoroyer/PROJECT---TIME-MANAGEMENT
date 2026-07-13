"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useBranding } from "../lib/brandingContext";
import { getDefaultModuleRoute } from "../lib/modules";
import { SETUP_PATH } from "../lib/setupPaths";

/**
 * Redirige uniquement hors de /setup une fois l'app configurée.
 * L'entrée vers /setup est gérée côté serveur (workspace layout + page d'accueil).
 */
export default function SetupRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const { branding, loading: brandingLoading } = useBranding();

  useEffect(() => {
    if (brandingLoading || !branding.isConfigured) return;
    if (pathname !== SETUP_PATH) return;
    router.replace(getDefaultModuleRoute(branding.enabledModules));
  }, [branding.isConfigured, branding.enabledModules, brandingLoading, pathname, router]);

  return null;
}
