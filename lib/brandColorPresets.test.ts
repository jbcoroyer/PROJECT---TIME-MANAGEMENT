import { describe, expect, it } from "vitest";
import {
  ALL_BRAND_COLOR_PRESETS,
  BRAND_COLOR_PRESETS_DEFAULT,
  BRAND_COLOR_PRESETS_EXTENDED,
  DEFAULT_BRAND_PRIMARY,
  findClosestPresetHex,
  findPresetByHex,
  isPresetColor,
  normalizeHexColor,
} from "./brandColorPresets";

describe("brandColorPresets", () => {
  it("expose 10 couleurs cadrées pour l'onboarding", () => {
    expect(BRAND_COLOR_PRESETS_DEFAULT).toHaveLength(4);
    expect(BRAND_COLOR_PRESETS_EXTENDED).toHaveLength(6);
    expect(ALL_BRAND_COLOR_PRESETS).toHaveLength(10);
  });

  it("normalise les codes hex", () => {
    expect(normalizeHexColor("2563eb")).toBe("#2563EB");
    expect(normalizeHexColor("#abc")).toBe("#AABBCC");
  });

  it("retrouve un preset par hex", () => {
    const preset = findPresetByHex("#E07A28");
    expect(preset?.id).toBe("accent-orange");
    expect(isPresetColor("#E07A28")).toBe(true);
    expect(isPresetColor("#FF00FF")).toBe(false);
  });

  it("trouve le preset le plus proche", () => {
    expect(findClosestPresetHex("#E08030")).toBe(DEFAULT_BRAND_PRIMARY);
  });
});
