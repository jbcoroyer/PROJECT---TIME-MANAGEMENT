import { describe, expect, it } from "vitest";
import {
  ALL_BRAND_COLOR_PRESETS,
  BRAND_COLOR_PRESET_GROUPS,
  findPresetByHex,
  isPresetColor,
  normalizeHexColor,
} from "./brandColorPresets";

describe("brandColorPresets", () => {
  it("expose 3 groupes de couleurs", () => {
    expect(BRAND_COLOR_PRESET_GROUPS).toHaveLength(3);
    expect(ALL_BRAND_COLOR_PRESETS.length).toBeGreaterThanOrEqual(18);
  });

  it("normalise les codes hex", () => {
    expect(normalizeHexColor("2563eb")).toBe("#2563EB");
    expect(normalizeHexColor("#abc")).toBe("#AABBCC");
  });

  it("retrouve un preset par hex", () => {
    const preset = findPresetByHex("#4F46E5");
    expect(preset?.id).toBe("design-indigo");
    expect(isPresetColor("#4F46E5")).toBe(true);
    expect(isPresetColor("#FF00FF")).toBe(false);
  });
});
