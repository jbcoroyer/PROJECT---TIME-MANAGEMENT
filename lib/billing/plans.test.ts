import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  calculateMonthlyPriceCents,
  canAccessTeamWorkload,
  daysLeftInTrial,
  effectivePlanForOrg,
  isModuleAllowedForPlan,
  isOrgAccessAllowed,
  mapStripeSubscriptionStatus,
  planFromPriceId,
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

  it("bloque le plan canceled", () => {
    expect(
      isOrgAccessAllowed({
        plan: "canceled",
        billingStatus: "canceled",
        trialEndsAt: null,
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
        plan: "active",
        billingStatus: "canceled",
        trialEndsAt: null,
      }),
    ).toBe(false);
  });

  it("autorise un abonnement actif", () => {
    expect(
      isOrgAccessAllowed({
        plan: "active",
        billingStatus: "active",
        trialEndsAt: null,
      }),
    ).toBe(true);
  });

  it("calcule le prix mensuel avec plancher", () => {
    expect(calculateMonthlyPriceCents(1)).toBe(1000);
    expect(calculateMonthlyPriceCents(5)).toBe(1000);
    expect(calculateMonthlyPriceCents(6)).toBe(1200);
    expect(calculateMonthlyPriceCents(8)).toBe(1600);
    expect(calculateMonthlyPriceCents(12)).toBe(2400);
  });

  it("mappe les statuts Stripe", () => {
    expect(mapStripeSubscriptionStatus("past_due")).toBe("past_due");
    expect(mapStripeSubscriptionStatus("incomplete_expired")).toBe("canceled");
  });

  it("autorise tous les modules", () => {
    expect(isModuleAllowedForPlan("trial", "social")).toBe(true);
    expect(isModuleAllowedForPlan("canceled", "dashboard")).toBe(true);
  });

  it("affiche la charge équipe dès 2 collaborateurs", () => {
    expect(canAccessTeamWorkload("trial", 1)).toBe(false);
    expect(canAccessTeamWorkload("trial", 2)).toBe(true);
    expect(canAccessTeamWorkload("active", 3)).toBe(true);
    expect(canAccessTeamWorkload("canceled", 5)).toBe(true);
  });

  it("résout le plan effectif après essai expiré", () => {
    expect(
      effectivePlanForOrg({
        plan: "trial",
        trialEndsAt: "2026-07-10T10:00:00Z",
      }),
    ).toBe("canceled");
  });

  it("reconnaît le price_id unique", () => {
    vi.stubEnv("STRIPE_PRICE_SINGLE_PLAN", "price_single");
    expect(planFromPriceId("price_single")).toBe("active");
    expect(planFromPriceId("price_other")).toBeNull();
    vi.unstubAllEnvs();
  });
});
