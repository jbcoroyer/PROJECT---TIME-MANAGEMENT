import "server-only";

import type { AppBranding } from "../branding";
import { getDefaultModuleRoute } from "../modules";
import { getBrandingServer } from "../server/getBrandingServer";
import { getSetupAccess, type SetupAccess } from "./getSetupAccess";
import { resolveConfiguredStatus } from "./resolveConfiguredStatus";

export type OrganizationSetupStatus = SetupAccess & {
  /** Fusion branding + accès admin : une seule vérité pour le routing. */
  isConfiguredResolved: boolean;
  branding: AppBranding;
  defaultRoute: string;
};

/**
 * État d'installation unifié pour éviter les blocages (setup pending, boucles redirect)
 * quand branding et getSetupAccess divergent.
 */
export async function resolveOrganizationSetupStatus(): Promise<OrganizationSetupStatus> {
  const [access, branding] = await Promise.all([getSetupAccess(), getBrandingServer()]);

  const isConfiguredResolved = resolveConfiguredStatus({
    accessConfigured: access.isConfigured,
    brandingConfigured: branding.isConfigured,
  });
  const brandingResolved =
    isConfiguredResolved && !branding.isConfigured
      ? { ...branding, isConfigured: true }
      : branding;

  return {
    ...access,
    isConfiguredResolved,
    branding: brandingResolved,
    defaultRoute: getDefaultModuleRoute(brandingResolved.enabledModules),
  };
}
