import { findClosestPresetHex, normalizeHexColor } from "./brandColorPresets";

function luminance(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function saturation(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === 0) return 0;
  return (max - min) / max;
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function extractDominantHex(data: Uint8ClampedArray): string | null {
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha < 128) continue;

    const pr = data[i];
    const pg = data[i + 1];
    const pb = data[i + 2];
    const lum = luminance(pr, pg, pb);
    const sat = saturation(pr, pg, pb);

    if (lum > 235) continue;
    if (sat < 0.1 && lum > 175) continue;

    r += pr;
    g += pg;
    b += pb;
    count += 1;
  }

  if (count === 0) return null;

  return rgbToHex(
    Math.round(r / count),
    Math.round(g / count),
    Math.round(b / count),
  );
}

export function closestAccentFromHex(hex: string): string {
  const normalized = normalizeHexColor(hex);
  if (!normalized) return findClosestPresetHex("#E07A28");
  return findClosestPresetHex(normalized);
}

export async function detectAccentFromImageSource(src: string): Promise<string | null> {
  if (typeof document === "undefined") return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = 64;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        const dominant = extractDominantHex(ctx.getImageData(0, 0, size, size).data);
        resolve(dominant ? closestAccentFromHex(dominant) : null);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function detectAccentFromFile(file: File): Promise<string | null> {
  const url = URL.createObjectURL(file);
  try {
    return await detectAccentFromImageSource(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}
