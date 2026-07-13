"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useBranding } from "../../lib/brandingContext";
import { getDefaultModuleRoute, isPathAllowedForModules } from "../../lib/modules";

/** Redirige si l'utilisateur accède à un module désactivé. */
export default function ModuleRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { branding, loading } = useBranding();

  useEffect(() => {
    if (loading) return;
    if (isPathAllowedForModules(pathname, branding.enabledModules)) return;
    router.replace(getDefaultModuleRoute(branding.enabledModules));
  }, [pathname, branding.enabledModules, loading, router]);

  return <>{children}</>;
}
