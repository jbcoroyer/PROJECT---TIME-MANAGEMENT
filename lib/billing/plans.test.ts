import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  canAccessTeamWorkload,
  canAddOrgMember,
  daysLeftInTrial,
  effectiveModulesForPlan,
  hasPlanFeature,
  isModuleAllowedForPlan,
  isOrgAccessAllowed,
  mapStripeSubscriptionStatus,
  maxMembersForPlan,
  maxModulesForPlan,
} from "./plans";

describe("billing plans", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-13T10:00:00Z"));
  });

  it("autorise l'accès pendant l'essai", () => {
    expect(
      isOrgAccessAllowed({
        plan: "trial",
        billingStatus: "trialing",
        trialEndsAt: "2026-07-20T10:00:00Z",
      }),
    ).toBe(true);
  });

  it("bloque l'accès après expiration de l'essai sans rétrogradation", () => {
    expect(
      isOrgAccessAllowed({
        plan: "trial",
        billingStatus: "trialing",
        trialEndsAt: "2026-07-10T10:00:00Z",
      }),
    ).toBe(true);
  });

  it("autorise le plan Gratuit", () => {
    expect(
      isOrgAccessAllowed({
        plan: "free",
        billingStatus: "active",
        trialEndsAt: null,
      }),
    ).toBe(true);
  });

  it("calcule les jours restants d'essai", () => {
    expect(daysLeftInTrial("2026-07-20T10:00:00Z")).toBe(7);
    expect(daysLeftInTrial("2026-07-10T10:00:00Z")).toBe(0);
  });

  it("bloque un abonnement résilié", () => {
    expect(
      isOrgAccessAllowed({
        plan: "starter",
        billingStatus: "canceled",
        trialEndsAt: null,
      }),
    ).toBe(false);
  });

  it("limite les membres sur Gratuit, Starter et Pro", () => {
    expect(maxMembersForPlan("free")).toBe(2);
    expect(maxMembersForPlan("starter")).toBe(5);
    expect(maxMembersForPlan("pro")).toBe(25);
    expect(canAddOrgMember("free", 1)).toBe(true);
    expect(canAddOrgMember("free", 2)).toBe(false);
    expect(canAddOrgMember("starter", 4)).toBe(true);
    expect(canAddOrgMember("starter", 5)).toBe(false);
    expect(canAddOrgMember("pro", 24)).toBe(true);
    expect(canAddOrgMember("pro", 25)).toBe(false);
  });

  it("limite les modules sur le plan Gratuit", () => {
    expect(maxModulesForPlan("free")).toBe(5);
    expect(maxModulesForPlan("starter")).toBeNull();
    const enabled = [
      "dashboard",
      "workspace",
      "planning",
      "ideas",
      "asks",
      "events",
      "social",
    ] as const;
    expect(effectiveModulesForPlan("free", [...enabled])).toHaveLength(5);
    expect(effectiveModulesForPlan("starter", [...enabled])).toHaveLength(7);
  });

  it("mappe les statuts Stripe", () => {
    expect(mapStripeSubscriptionStatus("past_due")).toBe("past_due");
    expect(mapStripeSubscriptionStatus("incomplete_expired")).toBe("canceled");
  });

  it("autorise tous les modules par identifiant et restreint les features premium au Pro", () => {
    expect(isModuleAllowedForPlan("free", "dashboard")).toBe(true);
    expect(isModuleAllowedForPlan("free", "social")).toBe(true);
    expect(isModuleAllowedForPlan("starter", "social")).toBe(true);
    expect(hasPlanFeature("free", "ai")).toBe(false);
    expect(hasPlanFeature("starter", "ai")).toBe(false);
    expect(hasPlanFeature("pro", "ai")).toBe(true);
    expect(hasPlanFeature("trial", "outlook_sync")).toBe(true);
    expect(hasPlanFeature("free", "team_workload")).toBe(false);
    expect(hasPlanFeature("starter", "team_workload")).toBe(true);
    expect(hasPlanFeature("pro", "team_workload")).toBe(true);
  });

  it("masque la charge équipe sans plan payant ou avec un seul utilisateur", () => {
    expect(canAccessTeamWorkload("free", 2)).toBe(false);
    expect(canAccessTeamWorkload("starter", 1)).toBe(false);
    expect(canAccessTeamWorkload("starter", 2)).toBe(true);
    expect(canAccessTeamWorkload("pro", 3)).toBe(true);
    expect(canAccessTeamWorkload("trial", 2)).toBe(true);
  });
});
