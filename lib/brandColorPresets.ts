export type BrandColorPreset = {
  id: string;
  hex: string;
  labelKey: string;
};

export type BrandColorPresetGroup = {
  id: "pastel" | "design" | "trend";
  labelKey: string;
  presets: BrandColorPreset[];
};

/** Palettes d'accent pour l'onboarding — contrastes adaptés aux boutons blancs. */
export const BRAND_COLOR_PRESET_GROUPS: BrandColorPresetGroup[] = [
  {
    id: "pastel",
    labelKey: "setup.colorGroups.pastel",
    presets: [
      { id: "pastel-sky", hex: "#5B9FED", labelKey: "setup.colors.pastelSky" },
      { id: "pastel-lavender", hex: "#8B7FD4", labelKey: "setup.colors.pastelLavender" },
      { id: "pastel-mint", hex: "#4DA88A", labelKey: "setup.colors.pastelMint" },
      { id: "pastel-peach", hex: "#E8927C", labelKey: "setup.colors.pastelPeach" },
      { id: "pastel-rose", hex: "#D97AA8", labelKey: "setup.colors.pastelRose" },
      { id: "pastel-honey", hex: "#C9A03A", labelKey: "setup.colors.pastelHoney" },
    ],
  },
  {
    id: "design",
    labelKey: "setup.colorGroups.design",
    presets: [
      { id: "design-indigo", hex: "#4F46E5", labelKey: "setup.colors.designIndigo" },
      { id: "design-emerald", hex: "#059669", labelKey: "setup.colors.designEmerald" },
      { id: "design-violet", hex: "#7C3AED", labelKey: "setup.colors.designViolet" },
      { id: "design-slate", hex: "#475569", labelKey: "setup.colors.designSlate" },
      { id: "design-coral", hex: "#EA580C", labelKey: "setup.colors.designCoral" },
      { id: "design-teal", hex: "#0D9488", labelKey: "setup.colors.designTeal" },
    ],
  },
  {
    id: "trend",
    labelKey: "setup.colorGroups.trend",
    presets: [
      { id: "trend-terracotta", hex: "#B45309", labelKey: "setup.colors.trendTerracotta" },
      { id: "trend-olive", hex: "#65A30D", labelKey: "setup.colors.trendOlive" },
      { id: "trend-midnight", hex: "#1E3A5F", labelKey: "setup.colors.trendMidnight" },
      { id: "trend-magenta", hex: "#BE185D", labelKey: "setup.colors.trendMagenta" },
      { id: "trend-pool", hex: "#0891B2", labelKey: "setup.colors.trendPool" },
      { id: "trend-forest", hex: "#3F6212", labelKey: "setup.colors.trendForest" },
    ],
  },
];

export const ALL_BRAND_COLOR_PRESETS = BRAND_COLOR_PRESET_GROUPS.flatMap((g) => g.presets);

export function normalizeHexColor(value: string): string {
  const raw = value.trim();
  if (!raw) return "";
  const withHash = raw.startsWith("#") ? raw : `#${raw}`;
  if (/^#[0-9A-Fa-f]{6}$/.test(withHash)) return withHash.toUpperCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(withHash)) {
    const h = withHash.slice(1);
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toUpperCase();
  }
  return raw;
}

export function findPresetByHex(hex: string): BrandColorPreset | undefined {
  const normalized = normalizeHexColor(hex);
  return ALL_BRAND_COLOR_PRESETS.find((p) => normalizeHexColor(p.hex) === normalized);
}

export function isPresetColor(hex: string): boolean {
  return Boolean(findPresetByHex(hex));
}
