"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useBranding } from "../lib/brandingContext";
import { useCurrentUser } from "../lib/useCurrentUser";
import { isSetupExemptPath, SETUP_PATH } from "../lib/setupPaths";

/** Redirige vers /setup tant que l'app n'est pas configurée (utilisateur connecté). */
export default function SetupRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const { branding, loading: brandingLoading } = useBranding();
  const { user, loading: userLoading } = useCurrentUser();

  useEffect(() => {
    if (brandingLoading || userLoading) return;

    if (branding.isConfigured) {
      if (pathname === SETUP_PATH) {
        router.replace("/dashboard/kanban");
      }
      return;
    }

    if (!user) return;
    if (isSetupExemptPath(pathname)) return;

    router.replace(SETUP_PATH);
  }, [
    branding.isConfigured,
    brandingLoading,
    pathname,
    router,
    user,
    userLoading,
  ]);

  return null;
}
