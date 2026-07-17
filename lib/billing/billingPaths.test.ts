import { describe, expect, it, afterEach, vi } from "vitest";
import { isBillingExemptApiPath, isBillingExemptPath } from "./billingPaths";

describe("billingPaths", () => {
  it("exempte la page /billing", () => {
    expect(isBillingExemptPath("/billing")).toBe(true);
    expect(isBillingExemptPath("/dashboard")).toBe(false);
  });

  it("exempte les routes API billing et webhooks", () => {
    expect(isBillingExemptApiPath("/api/billing/status")).toBe(true);
    expect(isBillingExemptApiPath("/api/webhooks/stripe")).toBe(true);
    expect(isBillingExemptApiPath("/api/cron/trial-reminders")).toBe(true);
    expect(isBillingExemptApiPath("/api/health")).toBe(true);
    expect(isBillingExemptApiPath("/api/v2/ai")).toBe(false);
  });
});
