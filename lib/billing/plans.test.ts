import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  calculateMonthlyPriceCents,
  calculateAnnualPriceCents,
  canAccessTeamWorkload,
  daysLeftInTrial,
  effectivePlanForOrg,
  inferTrialEndsAt,
  isModuleAllowedForPlan,
  isOrgAccessAllowed,
  isTrialExpired,
  mapStripeSubscriptionStatus,
  planFromPriceId,
  TRIAL_DAYS,
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
    expect(daysLeftInTrial("2026-07-13T10:00:01Z")).toBe(1);
  });

  it("infère trialEndsAt depuis la date de création", () => {
    const created = "2026-07-01T10:00:00Z";
    const inferred = inferTrialEndsAt(null, "trial", created);
    expect(inferred).toBe("2026-07-15T10:00:00.000Z");
    expect(daysLeftInTrial(inferred)).toBe(2);
  });

  it("détecte l'expiration d'essai", () => {
    expect(isTrialExpired("2026-07-10T10:00:00Z")).toBe(true);
    expect(isTrialExpired("2026-07-20T10:00:00Z")).toBe(false);
    expect(isTrialExpired(null)).toBe(false);
  });

  it("bloque l'essai sans date de fin", () => {
    expect(
      isOrgAccessAllowed({
        plan: "trial",
        billingStatus: "trialing",
        trialEndsAt: null,
      }),
    ).toBe(false);
  });

  it("autorise l'essai avec date de fin inférée", () => {
    const created = "2026-07-10T10:00:00Z";
    const trialEndsAt = inferTrialEndsAt(null, "trial", created);
    expect(
      isOrgAccessAllowed({
        plan: "trial",
        billingStatus: "trialing",
        trialEndsAt,
      }),
    ).toBe(true);
    expect(TRIAL_DAYS).toBe(14);
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

  it("calcule le prix annuel avec plancher (2 mois offerts)", async () => {
    const { ANNUAL_FLOOR_EUR, PRICE_PER_SEAT_ANNUAL_EUR } = await import("./plans");
    expect(PRICE_PER_SEAT_ANNUAL_EUR).toBe(20);
    expect(ANNUAL_FLOOR_EUR).toBe(100);
    expect(calculateAnnualPriceCents(1)).toBe(10000);
    expect(calculateAnnualPriceCents(5)).toBe(10000);
    expect(calculateAnnualPriceCents(6)).toBe(12000);
  });

  it("résume l'offre unique", async () => {
    const { singlePlanPricingSummary, PRICE_PER_SEAT_EUR, MONTHLY_FLOOR_EUR } = await import("./plans");
    expect(PRICE_PER_SEAT_EUR).toBe(2);
    expect(MONTHLY_FLOOR_EUR).toBe(10);
    expect(singlePlanPricingSummary()).toContain("2 €");
    expect(singlePlanPricingSummary()).toContain("10 €");
    expect(singlePlanPricingSummary("year")).toContain("20 €");
    expect(singlePlanPricingSummary("year")).toContain("2 mois offerts");
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
    vi.stubEnv("STRIPE_PRICE_SINGLE_PLAN_ANNUAL", "price_single_annual");
    expect(planFromPriceId("price_single")).toBe("active");
    expect(planFromPriceId("price_single_annual")).toBe("active");
    expect(planFromPriceId("price_other")).toBeNull();
    vi.unstubAllEnvs();
  });
});
