import { describe, expect, it, afterEach } from "vitest";
import { isBillingEnforcementEnabled } from "./enforcement";

describe("isBillingEnforcementEnabled", () => {
  afterEach(() => {
    delete process.env.BILLING_ENFORCEMENT;
  });

  it("est désactivé par défaut", () => {
    delete process.env.BILLING_ENFORCEMENT;
    expect(isBillingEnforcementEnabled()).toBe(false);
  });

  it("s'active uniquement avec BILLING_ENFORCEMENT=true", () => {
    process.env.BILLING_ENFORCEMENT = "true";
    expect(isBillingEnforcementEnabled()).toBe(true);
  });
});
