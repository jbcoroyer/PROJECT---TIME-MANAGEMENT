export type BrandColorPreset = {
  id: string;
  hex: string;
  labelKey: string;
};

/** Accent par défaut — orange Recueil (oklch 0.6 0.19 45). */
export const DEFAULT_BRAND_PRIMARY = "#E07A28";

/** 4 couleurs visibles au départ de l'onboarding. */
export const BRAND_COLOR_PRESETS_DEFAULT: BrandColorPreset[] = [
  { id: "accent-orange", hex: "#E07A28", labelKey: "setup.colors.accentOrange" },
  { id: "accent-coral", hex: "#EA580C", labelKey: "setup.colors.accentCoral" },
  { id: "accent-teal", hex: "#0D9488", labelKey: "setup.colors.accentTeal" },
  { id: "accent-violet", hex: "#7C3AED", labelKey: "setup.colors.accentViolet" },
];

/** 6 couleurs supplémentaires via « + de couleurs » (10 max au total). */
export const BRAND_COLOR_PRESETS_EXTENDED: BrandColorPreset[] = [
  { id: "accent-midnight", hex: "#1E3A5F", labelKey: "setup.colors.accentMidnight" },
  { id: "accent-magenta", hex: "#BE185D", labelKey: "setup.colors.accentMagenta" },
  { id: "accent-emerald", hex: "#059669", labelKey: "setup.colors.accentEmerald" },
  { id: "accent-terracotta", hex: "#B45309", labelKey: "setup.colors.accentTerracotta" },
  { id: "accent-pool", hex: "#0891B2", labelKey: "setup.colors.accentPool" },
  { id: "accent-slate", hex: "#475569", labelKey: "setup.colors.accentSlate" },
];

export const ALL_BRAND_COLOR_PRESETS: BrandColorPreset[] = [
  ...BRAND_COLOR_PRESETS_DEFAULT,
  ...BRAND_COLOR_PRESETS_EXTENDED,
];

/** @deprecated Conservé pour compat tests — regroupement unique. */
export const BRAND_COLOR_PRESET_GROUPS = [
  {
    id: "onboarding" as const,
    labelKey: "setup.primaryColor",
    presets: ALL_BRAND_COLOR_PRESETS,
  },
];

export function normalizeHexColor(value: string): string {
  const raw = value.trim();
  if (!raw) return "";
  const withHash = raw.startsWith("#") ? raw : `#${raw}`;
  if (/^#[0-9A-Fa-f]{6}$/.test(withHash)) return withHash.toUpperCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(withHash)) {
    const h = withHash.slice(1);
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toUpperCase();
  }
  return "";
}

/** Couleur hex sûre pour persistance / injection CSS (fail-closed). */
export function sanitizePrimaryColor(
  value: string | undefined,
  fallback = DEFAULT_BRAND_PRIMARY,
): string {
  if (value === undefined || !value.trim()) return fallback;
  const normalized = normalizeHexColor(value);
  return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : fallback;
}

export function findPresetByHex(hex: string): BrandColorPreset | undefined {
  const normalized = normalizeHexColor(hex);
  return ALL_BRAND_COLOR_PRESETS.find((p) => normalizeHexColor(p.hex) === normalized);
}

export function isPresetColor(hex: string): boolean {
  return Boolean(findPresetByHex(hex));
}

export function findClosestPresetHex(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return DEFAULT_BRAND_PRIMARY;

  let best = ALL_BRAND_COLOR_PRESETS[0];
  let bestDist = Infinity;

  for (const preset of ALL_BRAND_COLOR_PRESETS) {
    const presetRgb = hexToRgb(preset.hex);
    if (!presetRgb) continue;
    const dist = rgbDistance(rgb, presetRgb);
    if (dist < bestDist) {
      bestDist = dist;
      best = preset;
    }
  }

  return best.hex;
}

export const ACCENT_COLOR_CHOICE_COUNT = 7;

/** 7 couleurs proposées : logo en priorité, puis presets sans doublon. */
export function buildAccentColorChoices(logoColors: string[] = []): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of logoColors) {
    const hex = normalizeHexColor(raw);
    if (!hex || seen.has(hex)) continue;
    seen.add(hex);
    result.push(hex);
    if (result.length >= ACCENT_COLOR_CHOICE_COUNT) return result;
  }

  for (const preset of ALL_BRAND_COLOR_PRESETS) {
    const hex = normalizeHexColor(preset.hex);
    if (!hex || seen.has(hex)) continue;
    seen.add(hex);
    result.push(hex);
    if (result.length >= ACCENT_COLOR_CHOICE_COUNT) return result;
  }

  while (result.length < ACCENT_COLOR_CHOICE_COUNT) {
    const fallback = normalizeHexColor(DEFAULT_BRAND_PRIMARY);
    if (fallback && !seen.has(fallback)) {
      seen.add(fallback);
      result.push(fallback);
    } else {
      break;
    }
  }

  return result;
}

export function hexToRgbComponents(hex: string): { r: number; g: number; b: number } | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return { r: rgb[0], g: rgb[1], b: rgb[2] };
}

export function rgbComponentsToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function hexToRgb(hex: string): [number, number, number] | null {
  const normalized = normalizeHexColor(hex);
  if (!/^#[0-9A-F]{6}$/.test(normalized)) return null;
  return [
    parseInt(normalized.slice(1, 3), 16),
    parseInt(normalized.slice(3, 5), 16),
    parseInt(normalized.slice(5, 7), 16),
  ];
}

function rgbDistance(a: [number, number, number], b: [number, number, number]): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}
