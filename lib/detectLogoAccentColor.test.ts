import { describe, expect, it } from "vitest";
import { extractAccentColorsFromPixelData } from "./detectLogoAccentColor";

function solidImage(r: number, g: number, b: number, size = 32): Uint8ClampedArray {
  const data = new Uint8ClampedArray(size * size * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = 255;
  }
  return data;
}

describe("extractAccentColorsFromPixelData", () => {
  it("extrait une couleur dominante orange", () => {
    const colors = extractAccentColorsFromPixelData(solidImage(224, 122, 40));
    expect(colors[0]).toBe("#E07A28");
  });

  it("ignore le blanc et retient le bleu", () => {
    const data = new Uint8ClampedArray(32 * 32 * 4);
    for (let i = 0; i < data.length; i += 4) {
      const isBlue = i % 8 === 0;
      data[i] = isBlue ? 13 : 255;
      data[i + 1] = isBlue ? 148 : 255;
      data[i + 2] = isBlue ? 136 : 255;
      data[i + 3] = 255;
    }
    const colors = extractAccentColorsFromPixelData(data);
    expect(colors.some((hex) => hex === "#0D9488")).toBe(true);
  });

  it("retourne plusieurs couleurs distinctes", () => {
    const data = new Uint8ClampedArray(64 * 64 * 4);
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        const i = (y * 64 + x) * 4;
        if (x < 32) {
          data[i] = 124;
          data[i + 1] = 58;
          data[i + 2] = 237;
        } else {
          data[i] = 234;
          data[i + 1] = 88;
          data[i + 2] = 12;
        }
        data[i + 3] = 255;
      }
    }
    const colors = extractAccentColorsFromPixelData(data, 4);
    expect(colors.length).toBeGreaterThanOrEqual(2);
  });
});
