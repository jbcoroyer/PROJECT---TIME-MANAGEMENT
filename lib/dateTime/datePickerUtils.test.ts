import { describe, expect, it } from "vitest";
import {
  formatIsoDate,
  isIsoDateInRange,
  parseIsoDate,
} from "./datePickerUtils";

describe("datePickerUtils", () => {
  it("parses and formats ISO dates", () => {
    const date = parseIsoDate("2026-07-17");
    expect(date).not.toBeNull();
    expect(formatIsoDate(date!)).toBe("2026-07-17");
  });

  it("checks min/max range", () => {
    expect(isIsoDateInRange("2026-07-17", "2026-07-01", "2026-07-31")).toBe(true);
    expect(isIsoDateInRange("2026-08-01", "2026-07-01", "2026-07-31")).toBe(false);
  });
});
