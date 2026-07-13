"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useBranding } from "../../lib/brandingContext";
import { useBillingPlan } from "../../lib/billing/useBillingPlan";
import { isModuleAllowedForPlan } from "../../lib/billing/plans";
import { getDefaultModuleRoute, isPathAllowedForModules, resolveModuleForPath } from "../../lib/modules";

/** Redirige si l'utilisateur accède à un module désactivé ou non inclus dans son plan. */
export default function ModuleRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { branding, loading: brandingLoading } = useBranding();
  const { plan, loading: planLoading } = useBillingPlan();

  useEffect(() => {
    if (brandingLoading || planLoading) return;

    if (!isPathAllowedForModules(pathname, branding.enabledModules)) {
      router.replace(getDefaultModuleRoute(branding.enabledModules));
      return;
    }

    const moduleId = resolveModuleForPath(pathname);
    if (moduleId && !isModuleAllowedForPlan(plan, moduleId)) {
      router.replace("/settings?upgrade=pro");
    }
  }, [pathname, branding.enabledModules, brandingLoading, plan, planLoading, router]);

  return <>{children}</>;
}
