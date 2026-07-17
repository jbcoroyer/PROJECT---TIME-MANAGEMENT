import { describe, expect, it, vi } from "vitest";
import {
  clampTutorialCardPosition,
  getTutorialViewportPadding,
} from "./tutorialCardPosition";

describe("tutorialCardPosition", () => {
  it("clamps card position inside the viewport", () => {
    vi.stubGlobal("window", {
      innerHeight: 800,
      innerWidth: 1280,
    });

    const padding = getTutorialViewportPadding();
    const result = clampTutorialCardPosition(900, 900, 320, 280, padding);

    expect(result.top).toBeLessThanOrEqual(800 - 280 - padding.bottom);
    expect(result.left).toBeLessThanOrEqual(1280 - 320 - padding.right);
    expect(result.top).toBeGreaterThanOrEqual(padding.top);
    expect(result.left).toBeGreaterThanOrEqual(padding.left);

    vi.unstubAllGlobals();
  });

  it("keeps valid positions unchanged", () => {
    const padding = getTutorialViewportPadding();
    const top = padding.top + 40;
    const left = padding.left + 40;

    expect(clampTutorialCardPosition(top, left, 280, 220, padding)).toEqual({ top, left });
  });
});
