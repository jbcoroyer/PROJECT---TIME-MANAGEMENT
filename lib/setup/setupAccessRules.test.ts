import { describe, expect, it } from "vitest";
import { resolveConfiguredStatus } from "./resolveConfiguredStatus";
import {
  resolveCanCompleteSetup,
  resolvePostAuthRoute,
  resolveSetupPageDecision,
  type SetupAccessInput,
} from "./setupAccessRules";

/** Matrice documentée — chaque scénario utilisateur connu. */
const SCENARIOS: Array<{
  name: string;
  access: SetupAccessInput;
  brandingConfigured: boolean;
  defaultRoute: string;
  expectedPage: ReturnType<typeof resolveSetupPageDecision>["kind"];
  expectedCanComplete: boolean;
}> = [
  {
    name: "Visiteur non connecté",
    access: {
      isAuthenticated: false,
      organizationId: null,
      isConfigured: false,
      isAdmin: false,
      adminCount: 0,
      memberCount: 0,
    },
    brandingConfigured: false,
    defaultRoute: "/dashboard/kanban",
    expectedPage: "sign-in",
    expectedCanComplete: false,
  },
  {
    name: "Compte créé — profil pas encore provisionné (trigger en cours)",
    access: {
      isAuthenticated: true,
      organizationId: null,
      isConfigured: false,
      isAdmin: false,
      adminCount: 0,
      memberCount: 0,
    },
    brandingConfigured: false,
    defaultRoute: "/dashboard/kanban",
    expectedPage: "provisioning",
    expectedCanComplete: false,
  },
  {
    name: "Admin — installation initiale",
    access: {
      isAuthenticated: true,
      organizationId: "org-1",
      isConfigured: false,
      isAdmin: true,
      adminCount: 1,
      memberCount: 1,
    },
    brandingConfigured: false,
    defaultRoute: "/dashboard/kanban",
    expectedPage: "wizard",
    expectedCanComplete: true,
  },
  {
    name: "Membre invité — org non configurée, admin présent",
    access: {
      isAuthenticated: true,
      organizationId: "org-1",
      isConfigured: false,
      isAdmin: false,
      adminCount: 1,
      memberCount: 3,
    },
    brandingConfigured: false,
    defaultRoute: "/dashboard/kanban",
    expectedPage: "pending",
    expectedCanComplete: false,
  },
  {
    name: "Seul membre non-admin — espace personnel",
    access: {
      isAuthenticated: true,
      organizationId: "org-1",
      isConfigured: false,
      isAdmin: false,
      adminCount: 0,
      memberCount: 1,
    },
    brandingConfigured: false,
    defaultRoute: "/dashboard/kanban",
    expectedPage: "wizard",
    expectedCanComplete: true,
  },
  {
    name: "Org déjà configurée (admin)",
    access: {
      isAuthenticated: true,
      organizationId: "org-1",
      isConfigured: true,
      isAdmin: true,
      adminCount: 1,
      memberCount: 1,
    },
    brandingConfigured: true,
    defaultRoute: "/dashboard/kanban",
    expectedPage: "redirect-app",
    expectedCanComplete: false,
  },
  {
    name: "Dérive schéma — access configuré, branding en échec",
    access: {
      isAuthenticated: true,
      organizationId: "org-1",
      isConfigured: true,
      isAdmin: true,
      adminCount: 1,
      memberCount: 1,
    },
    brandingConfigured: false,
    defaultRoute: "/dashboard/kanban",
    expectedPage: "redirect-app",
    expectedCanComplete: false,
  },
  {
    name: "Dérive schéma inverse — branding OK, access pas encore synchronisé",
    access: {
      isAuthenticated: true,
      organizationId: "org-1",
      isConfigured: false,
      isAdmin: true,
      adminCount: 1,
      memberCount: 1,
    },
    brandingConfigured: true,
    defaultRoute: "/agenda",
    expectedPage: "redirect-app",
    expectedCanComplete: true,
  },
];

describe("matrice utilisateurs setup", () => {
  for (const scenario of SCENARIOS) {
    it(scenario.name, () => {
      const canComplete = resolveCanCompleteSetup(scenario.access);
      expect(canComplete).toBe(scenario.expectedCanComplete);

      const isConfiguredResolved = resolveConfiguredStatus({
        accessConfigured: scenario.access.isConfigured,
        brandingConfigured: scenario.brandingConfigured,
      });

      const decision = resolveSetupPageDecision({
        isConfiguredResolved,
        isAuthenticated: scenario.access.isAuthenticated,
        organizationId: scenario.access.organizationId,
        canCompleteSetup: canComplete,
        defaultRoute: scenario.defaultRoute,
      });

      expect(decision.kind).toBe(scenario.expectedPage);
    });
  }
});

describe("resolvePostAuthRoute", () => {
  it("envoie vers /setup si non configuré", () => {
    expect(
      resolvePostAuthRoute({
        isConfiguredResolved: false,
        defaultRoute: "/agenda",
        fallbackPath: "/dashboard/kanban",
      }),
    ).toBe("/setup");
  });

  it("utilise le fallback si configuré", () => {
    expect(
      resolvePostAuthRoute({
        isConfiguredResolved: true,
        defaultRoute: "/agenda",
        fallbackPath: "/dashboard/kanban",
      }),
    ).toBe("/dashboard/kanban");
  });

  it("évite de renvoyer vers /setup si déjà configuré", () => {
    expect(
      resolvePostAuthRoute({
        isConfiguredResolved: true,
        defaultRoute: "/agenda",
        fallbackPath: "/setup",
      }),
    ).toBe("/agenda");
  });
});
