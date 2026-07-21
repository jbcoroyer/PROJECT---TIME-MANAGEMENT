/**
 * Règles pures setup/installation — testables pour tous les profils utilisateur.
 * (sans I/O ; la logique serveur dans getSetupAccess.ts doit rester alignée)
 */

export type SetupAccessInput = {
  isAuthenticated: boolean;
  organizationId: string | null;
  isConfigured: boolean;
  isAdmin: boolean;
  adminCount: number;
  memberCount: number;
};

export function resolveCanCompleteSetup(input: SetupAccessInput): boolean {
  if (!input.isAuthenticated || !input.organizationId || input.isConfigured) {
    return false;
  }
  if (input.isAdmin) return true;
  return input.adminCount === 0 || input.memberCount === 1;
}

export type SetupPageDecision =
  | { kind: "redirect-app"; route: string }
  | { kind: "sign-in" }
  | { kind: "provisioning" }
  | { kind: "wizard" }
  | { kind: "pending" };

export function resolveSetupPageDecision(input: {
  isConfiguredResolved: boolean;
  isAuthenticated: boolean;
  organizationId: string | null;
  canCompleteSetup: boolean;
  defaultRoute: string;
}): SetupPageDecision {
  if (input.isConfiguredResolved) {
    return { kind: "redirect-app", route: input.defaultRoute };
  }
  if (!input.isAuthenticated) {
    return { kind: "sign-in" };
  }
  if (!input.organizationId) {
    return { kind: "provisioning" };
  }
  if (input.canCompleteSetup) {
    return { kind: "wizard" };
  }
  return { kind: "pending" };
}

/** Après connexion : setup si non configuré, sinon route app ou fallback explicite. */
export function resolvePostAuthRoute(input: {
  isConfiguredResolved: boolean;
  defaultRoute: string;
  fallbackPath: string;
}): string {
  if (!input.isConfiguredResolved) return "/setup";
  const fallback = input.fallbackPath.startsWith("/") ? input.fallbackPath : "/dashboard";
  return fallback === "/setup" ? input.defaultRoute : fallback;
}
