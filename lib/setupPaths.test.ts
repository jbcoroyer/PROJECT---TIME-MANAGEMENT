import { describe, expect, it } from "vitest";
import { BILLING_REQUIRED_PATH } from "./billing/billingPaths";
import { isSetupExemptPath } from "./setupPaths";

describe("setupPaths", () => {
  it("n'envoie pas /billing vers /setup", () => {
    expect(isSetupExemptPath(BILLING_REQUIRED_PATH)).toBe(true);
    expect(isSetupExemptPath("/billing?billing=success")).toBe(false);
  });
});
