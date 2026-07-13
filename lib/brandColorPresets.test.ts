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
    const preset = findPresetByHex("#5C6B5A");
    expect(preset?.id).toBe("design-sage");
    expect(isPresetColor("#5C6B5A")).toBe(true);
    expect(isPresetColor("#FF00FF")).toBe(false);
  });
});
