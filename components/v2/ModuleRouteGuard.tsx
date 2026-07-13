"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useBranding } from "../../lib/brandingContext";
import { useBillingPlan } from "../../lib/billing/useBillingPlan";
import { effectiveModulesForPlan } from "../../lib/billing/plans";
import { getDefaultModuleRoute, isPathAllowedForModules, resolveModuleForPath } from "../../lib/modules";

/** Redirige si l'utilisateur accède à un module désactivé ou hors limite de son plan. */
export default function ModuleRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { branding, loading: brandingLoading } = useBranding();
  const { plan, loading: planLoading } = useBillingPlan();

  useEffect(() => {
    if (brandingLoading || planLoading) return;

    const allowedModules = effectiveModulesForPlan(plan, branding.enabledModules);

    if (!isPathAllowedForModules(pathname, allowedModules)) {
      const moduleId = resolveModuleForPath(pathname);
      const upgrade =
        plan === "free" && moduleId && branding.enabledModules.includes(moduleId)
          ? "starter"
          : "pro";
      router.replace(moduleId ? `/settings?upgrade=${upgrade}` : getDefaultModuleRoute(allowedModules));
    }
  }, [pathname, branding.enabledModules, brandingLoading, plan, planLoading, router]);

  return <>{children}</>;
}
