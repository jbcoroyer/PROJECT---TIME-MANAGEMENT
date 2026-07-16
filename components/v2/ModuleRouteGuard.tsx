"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useBranding } from "../../lib/brandingContext";
import { getDefaultModuleRoute, isPathAllowedForModules } from "../../lib/modules";

/** Redirige si l'utilisateur accède à un module désactivé. */
export default function ModuleRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { branding, loading: brandingLoading } = useBranding();

  useEffect(() => {
    if (brandingLoading) return;

    const allowedModules = branding.enabledModules;

    if (!isPathAllowedForModules(pathname, allowedModules)) {
      router.replace(getDefaultModuleRoute(allowedModules));
    }
  }, [pathname, branding.enabledModules, brandingLoading, router]);

  return <>{children}</>;
}
