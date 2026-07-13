import type { ColumnId } from "./types";
import { getAdminColorIndex } from "./adminColorAssignments";

export const columnStyles: Record<
  ColumnId,
  {
    headerBg: string;
    headerText: string;
    cellBg: string;
    cellBorder: string;
  }
> = {
  "À faire": {
    headerBg: "bg-[var(--surface-soft)]",
    headerText: "text-[color:var(--foreground)]/75",
    cellBg: "bg-[var(--surface)]",
    cellBorder: "border-[var(--line)]",
  },
  "En cours": {
    headerBg: "bg-[color-mix(in_srgb,var(--brand-primary)_6%,var(--surface-soft))]",
    headerText: "text-[color:var(--foreground)]/80",
    cellBg: "bg-[var(--surface)]",
    cellBorder: "border-[color-mix(in_srgb,var(--brand-primary)_12%,var(--line))]",
  },
  "En validation": {
    headerBg: "bg-[color-mix(in_srgb,var(--warning)_8%,var(--surface-soft))]",
    headerText: "text-[color:var(--foreground)]/80",
    cellBg: "bg-[var(--surface)]",
    cellBorder: "border-[color-mix(in_srgb,var(--warning)_15%,var(--line))]",
  },
  Terminé: {
    headerBg: "bg-[color-mix(in_srgb,var(--success)_8%,var(--surface-soft))]",
    headerText: "text-[color:var(--foreground)]/75",
    cellBg: "bg-[var(--surface)]",
    cellBorder: "border-[color-mix(in_srgb,var(--success)_15%,var(--line))]",
  },
};

/** Badges collaborateurs : 8 teintes chaudes sourdes */
const BADGE_VARIANTS = [
  "ui-pill border-[var(--line)] bg-[var(--surface-soft)] text-[color:var(--foreground)]/80",
  "ui-pill border-[color-mix(in_srgb,var(--brand-primary)_22%,var(--line))] bg-[var(--accent-soft)] text-[var(--accent-strong)]",
  "ui-pill border-[#d9d3c8] bg-[#ebe6de] text-[#5a5248]",
  "ui-pill border-[#cfc7b6] bg-[#e3ddd1] text-[#4f483e]",
  "ui-pill border-[color-mix(in_srgb,var(--brand-primary)_18%,var(--line))] bg-[color-mix(in_srgb,var(--brand-primary)_6%,var(--surface))] text-[color-mix(in_srgb,var(--brand-primary)_70%,var(--foreground))]",
  "ui-pill border-[#d4cec2] bg-[#f0ebe3] text-[#5c554a]",
  "ui-pill border-[#c9c0b0] bg-[#e8e2d6] text-[#524b40]",
  "ui-pill border-[color-mix(in_srgb,var(--brand-primary)_15%,var(--line))] bg-[color-mix(in_srgb,var(--brand-primary)_4%,var(--surface-soft))] text-[color-mix(in_srgb,var(--brand-primary)_65%,var(--foreground))]",
] as const;

const SOLID_COLORS = [
  "#78716c",
  "oklch(0.6 0.19 45)",
  "oklch(0.58 0.11 190)",
  "oklch(0.58 0.14 300)",
  "#6b6358",
  "oklch(0.62 0.15 90)",
  "#6d665c",
  "#524b40",
] as const;

const FILTER_PILL_VARIANTS = [
  "ui-pill border-[var(--line)] bg-[var(--surface-soft)] text-[color:var(--foreground)]/80 ring-2 ring-[var(--line)]",
  "ui-pill border-[color-mix(in_srgb,var(--brand-primary)_22%,var(--line))] bg-[var(--accent-soft)] text-[var(--accent-strong)] ring-2 ring-[color-mix(in_srgb,var(--brand-primary)_15%,transparent)]",
  "ui-pill border-[#d9d3c8] bg-[#ebe6de] text-[#5a5248] ring-2 ring-[#d9d3c8]/50",
  "ui-pill border-[#cfc7b6] bg-[#e3ddd1] text-[#4f483e] ring-2 ring-[#cfc7b6]/50",
  "ui-pill border-[color-mix(in_srgb,var(--brand-primary)_18%,var(--line))] bg-[color-mix(in_srgb,var(--brand-primary)_6%,var(--surface))] text-[color-mix(in_srgb,var(--brand-primary)_70%,var(--foreground))] ring-2 ring-[color-mix(in_srgb,var(--brand-primary)_12%,transparent)]",
  "ui-pill border-[#d4cec2] bg-[#f0ebe3] text-[#5c554a] ring-2 ring-[#d4cec2]/50",
  "ui-pill border-[#c9c0b0] bg-[#e8e2d6] text-[#524b40] ring-2 ring-[#c9c0b0]/50",
  "ui-pill border-[color-mix(in_srgb,var(--brand-primary)_15%,var(--line))] bg-[color-mix(in_srgb,var(--brand-primary)_4%,var(--surface-soft))] text-[color-mix(in_srgb,var(--brand-primary)_65%,var(--foreground))] ring-2 ring-[color-mix(in_srgb,var(--brand-primary)_10%,transparent)]",
] as const;

export type AdminAvatarMetaResolved = {
  gender: "female" | "male";
  avatarBg: string;
  avatarText: string;
  calendarColor: string;
};

const AVATAR_META_VARIANTS: readonly AdminAvatarMetaResolved[] = [
  { gender: "female", avatarBg: "bg-[var(--surface-soft)]", avatarText: "text-[color:var(--foreground)]/75", calendarColor: "#78716c" },
  { gender: "male", avatarBg: "bg-[var(--accent-soft)]", avatarText: "text-[var(--accent-strong)]", calendarColor: "oklch(0.6 0.19 45)" },
  { gender: "female", avatarBg: "bg-[#ebe6de]", avatarText: "text-[#5a5248]", calendarColor: "#6b6358" },
  { gender: "male", avatarBg: "bg-[#e3ddd1]", avatarText: "text-[#4f483e]", calendarColor: "#5a5248" },
  { gender: "female", avatarBg: "bg-[color-mix(in_srgb,var(--brand-primary)_8%,var(--surface))]", avatarText: "text-[var(--accent-strong)]", calendarColor: "#4a6b5d" },
  { gender: "male", avatarBg: "bg-[#f0ebe3]", avatarText: "text-[#5c554a]", calendarColor: "#6d665c" },
  { gender: "female", avatarBg: "bg-[#e8e2d6]", avatarText: "text-[#524b40]", calendarColor: "#524b40" },
  { gender: "male", avatarBg: "bg-[color-mix(in_srgb,var(--brand-primary)_5%,var(--surface-soft))]", avatarText: "text-[color-mix(in_srgb,var(--brand-primary)_70%,var(--foreground))]", calendarColor: "#4f5d4e" },
];

export function getAdminColorPaletteSize(): number {
  return BADGE_VARIANTS.length;
}

function adminColorIdx(name: string): number {
  return getAdminColorIndex(name, BADGE_VARIANTS.length);
}

export function adminBadgeClassFor(name: string): string {
  if (!name.trim()) return "ui-pill ui-pill-neutral";
  return BADGE_VARIANTS[adminColorIdx(name)] ?? BADGE_VARIANTS[0];
}

export function adminSolidColorFor(name: string): string {
  if (!name.trim()) return "#78716c";
  return SOLID_COLORS[adminColorIdx(name)] ?? SOLID_COLORS[0];
}

export function adminFilterPillClassFor(name: string): string {
  if (!name.trim()) return "ui-pill ui-pill-neutral";
  return FILTER_PILL_VARIANTS[adminColorIdx(name)] ?? FILTER_PILL_VARIANTS[0];
}

export function adminAvatarMetaFor(name: string): AdminAvatarMetaResolved {
  if (!name.trim()) {
    return {
      gender: "male",
      avatarBg: "bg-[var(--surface-soft)]",
      avatarText: "text-[color:var(--foreground)]/55",
      calendarColor: "#78716c",
    };
  }
  return AVATAR_META_VARIANTS[adminColorIdx(name)] ?? AVATAR_META_VARIANTS[0];
}

export const domainCalendarColors: Record<string, string> = {
  "🖥️ Digitale": "oklch(0.6 0.19 45)",
  "📮 Client": "#6b6358",
  "🎟️ Event": "#a68a5b",
  "🌎 General": "#4a6b5d",
  "🖨️ Print": "#9a7b6b",
  "📰 Presse": "#5b8a8a",
};

export const defaultDomainColor = "#78716c";

export const domainTagStyles: Record<string, string> = {
  "🖥️ Digitale": "ui-pill ui-pill-brand",
  "📮 Client": "ui-pill ui-pill-neutral",
  "🎟️ Event": "ui-pill ui-pill-warning",
  "🌎 General": "ui-pill ui-pill-success",
  "🖨️ Print": "ui-pill ui-pill-neutral",
  "📰 Presse": "ui-pill ui-pill-brand",
  default: "ui-pill ui-pill-neutral",
};
