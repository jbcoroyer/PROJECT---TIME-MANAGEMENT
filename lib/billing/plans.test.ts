import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  daysLeftInTrial,
  isOrgAccessAllowed,
  mapStripeSubscriptionStatus,
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
});
