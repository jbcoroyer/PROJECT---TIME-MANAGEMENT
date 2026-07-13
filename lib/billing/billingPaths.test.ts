import { describe, expect, it } from "vitest";
import { BILLING_REQUIRED_PATH, isBillingExemptPath } from "./billingPaths";

describe("billingPaths", () => {
  it("autorise l'onboarding et la facturation pendant le blocage", () => {
    expect(isBillingExemptPath("/setup")).toBe(true);
    expect(isBillingExemptPath(BILLING_REQUIRED_PATH)).toBe(true);
  });

  it("bloque les routes applicatives", () => {
    expect(isBillingExemptPath("/dashboard/kanban")).toBe(false);
    expect(isBillingExemptPath("/settings")).toBe(false);
  });
});
