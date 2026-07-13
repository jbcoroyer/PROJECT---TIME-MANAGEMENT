import type { PrintSpeciesOption } from "./taxonomies";
import { printSpeciesLabel } from "./taxonomies";

/** Chips espèces — neutres chauds, pas de couleurs arc-en-ciel */
const SPECIES_CHIP_PALETTE = [
  {
    badgeClass: "ui-pill ui-pill-neutral",
    borderClass: "border-[var(--line-strong)]",
    panelClass: "bg-[var(--surface-soft)]",
  },
  {
    badgeClass: "ui-pill ui-pill-brand",
    borderClass: "border-[color-mix(in_srgb,var(--brand-primary)_22%,var(--line))]",
    panelClass: "bg-[color-mix(in_srgb,var(--brand-primary)_5%,var(--surface))]",
  },
  {
    badgeClass: "ui-pill ui-pill-neutral",
    borderClass: "border-[var(--line-strong)]",
    panelClass: "bg-[var(--surface)]",
  },
  {
    badgeClass: "ui-pill ui-pill-brand",
    borderClass: "border-[color-mix(in_srgb,var(--brand-primary)_18%,var(--line))]",
    panelClass: "bg-[color-mix(in_srgb,var(--brand-primary)_4%,var(--surface-soft))]",
  },
  {
    badgeClass: "ui-pill ui-pill-neutral",
    borderClass: "border-[var(--line)]",
    panelClass: "bg-[var(--surface-soft)]",
  },
] as const;

export type PrintSpeciesVisualMeta = {
  label: string;
  badgeClass: string;
  borderClass: string;
  panelClass: string;
};

export function buildPrintSpeciesMeta(
  options: PrintSpeciesOption[],
): Record<string, PrintSpeciesVisualMeta> {
  const meta: Record<string, PrintSpeciesVisualMeta> = {};
  options.forEach((option, index) => {
    const palette = SPECIES_CHIP_PALETTE[index % SPECIES_CHIP_PALETTE.length];
    meta[option.value] = {
      label: option.label,
      ...palette,
    };
  });
  return meta;
}

export function getPrintSpeciesVisual(
  options: PrintSpeciesOption[],
  value: string,
): PrintSpeciesVisualMeta {
  const fromMap = buildPrintSpeciesMeta(options)[value];
  if (fromMap) return fromMap;
  const palette = SPECIES_CHIP_PALETTE[0];
  return {
    label: printSpeciesLabel(options, value),
    ...palette,
  };
}
