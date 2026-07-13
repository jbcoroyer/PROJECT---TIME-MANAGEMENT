import { describe, expect, it, afterEach, vi } from "vitest";
import { isBillingEnforcementEnabled } from "./enforcement";

describe("isBillingEnforcementEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("est désactivé en développement sans variable explicite", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("BILLING_ENFORCEMENT", "");
    expect(isBillingEnforcementEnabled()).toBe(false);
  });

  it("est activé en production sans variable explicite", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BILLING_ENFORCEMENT", "");
    expect(isBillingEnforcementEnabled()).toBe(true);
  });

  it("s'active avec BILLING_ENFORCEMENT=true", () => {
    vi.stubEnv("BILLING_ENFORCEMENT", "true");
    expect(isBillingEnforcementEnabled()).toBe(true);
  });

  it("se désactive avec BILLING_ENFORCEMENT=false même en production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BILLING_ENFORCEMENT", "false");
    expect(isBillingEnforcementEnabled()).toBe(false);
  });
});
