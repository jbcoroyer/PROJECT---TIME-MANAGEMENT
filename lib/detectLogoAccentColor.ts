import { normalizeHexColor } from "./brandColorPresets";

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
  const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function rgbDistance(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

type ColorBucket = {
  r: number;
  g: number;
  b: number;
  count: number;
  satSum: number;
};

/** Extrait les couleurs d'accent les plus représentatives d'un bitmap (usage tests + canvas). */
export function extractAccentColorsFromPixelData(
  data: Uint8ClampedArray,
  maxColors = 4,
): string[] {
  const buckets = new Map<string, ColorBucket>();

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha < 128) continue;

    const pr = data[i];
    const pg = data[i + 1];
    const pb = data[i + 2];
    const lum = luminance(pr, pg, pb);
    const sat = saturation(pr, pg, pb);

    if (lum > 245 || lum < 12) continue;
    if (sat < 0.1 && lum > 165) continue;

    const key = `${pr >> 4},${pg >> 4},${pb >> 4}`;
    const prev = buckets.get(key);
    if (prev) {
      prev.r += pr;
      prev.g += pg;
      prev.b += pb;
      prev.count += 1;
      prev.satSum += sat;
    } else {
      buckets.set(key, { r: pr, g: pg, b: pb, count: 1, satSum: sat });
    }
  }

  const ranked = [...buckets.values()]
    .map((bucket) => {
      const r = Math.round(bucket.r / bucket.count);
      const g = Math.round(bucket.g / bucket.count);
      const b = Math.round(bucket.b / bucket.count);
      const avgSat = bucket.satSum / bucket.count;
      return {
        hex: rgbToHex(r, g, b),
        rgb: [r, g, b] as const,
        score: bucket.count * (0.35 + avgSat),
      };
    })
    .sort((a, b) => b.score - a.score);

  const picked: typeof ranked = [];
  for (const candidate of ranked) {
    if (picked.some((p) => rgbDistance(p.rgb, candidate.rgb) < 2200)) continue;
    picked.push(candidate);
    if (picked.length >= maxColors) break;
  }

  return picked.map((entry) => entry.hex);
}

async function readImagePixels(src: string): Promise<Uint8ClampedArray | null> {
  if (typeof document === "undefined") return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = 96;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        resolve(ctx.getImageData(0, 0, size, size).data);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function extractAccentColorsFromImageSource(
  src: string,
  maxColors = 4,
): Promise<string[]> {
  const pixels = await readImagePixels(src);
  if (!pixels) return [];
  return extractAccentColorsFromPixelData(pixels, maxColors);
}

export async function extractAccentColorsFromFile(
  file: File,
  maxColors = 4,
): Promise<string[]> {
  const url = URL.createObjectURL(file);
  try {
    return await extractAccentColorsFromImageSource(url, maxColors);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Première couleur d'accent détectée, ou null. */
export async function detectAccentFromFile(file: File): Promise<string | null> {
  const colors = await extractAccentColorsFromFile(file, 1);
  return colors[0] ?? null;
}

/** @deprecated Préférer les couleurs extraites du logo (hex exact). */
export function closestAccentFromHex(hex: string): string {
  const normalized = normalizeHexColor(hex);
  return normalized || "#E07A28";
}

export async function detectAccentFromImageSource(src: string): Promise<string | null> {
  const colors = await extractAccentColorsFromImageSource(src, 1);
  return colors[0] ?? null;
}
