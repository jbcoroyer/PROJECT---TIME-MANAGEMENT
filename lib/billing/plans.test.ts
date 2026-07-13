import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  canAddOrgMember,
  daysLeftInTrial,
  hasPlanFeature,
  isModuleAllowedForPlan,
  isOrgAccessAllowed,
  mapStripeSubscriptionStatus,
  maxMembersForPlan,
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

  it("bloque l'accès après expiration de l'essai", () => {
    expect(
      isOrgAccessAllowed({
        plan: "trial",
        billingStatus: "trialing",
        trialEndsAt: "2026-07-10T10:00:00Z",
      }),
    ).toBe(false);
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

  it("limite les membres sur le plan Starter", () => {
    expect(maxMembersForPlan("starter")).toBe(5);
    expect(maxMembersForPlan("pro")).toBeNull();
    expect(canAddOrgMember("starter", 4)).toBe(true);
    expect(canAddOrgMember("starter", 5)).toBe(false);
    expect(canAddOrgMember("pro", 100)).toBe(true);
  });

  it("mappe les statuts Stripe", () => {
    expect(mapStripeSubscriptionStatus("past_due")).toBe("past_due");
    expect(mapStripeSubscriptionStatus("incomplete_expired")).toBe("canceled");
  });

  it("restreint les modules et features sur Starter", () => {
    expect(isModuleAllowedForPlan("starter", "dashboard")).toBe(true);
    expect(isModuleAllowedForPlan("starter", "social")).toBe(false);
    expect(hasPlanFeature("starter", "ai")).toBe(false);
    expect(hasPlanFeature("pro", "ai")).toBe(true);
    expect(hasPlanFeature("trial", "outlook_sync")).toBe(true);
  });
});
