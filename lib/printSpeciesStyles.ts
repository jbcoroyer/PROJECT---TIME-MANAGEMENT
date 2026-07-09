import type { PrintSpeciesOption } from "./taxonomies";
import { printSpeciesLabel } from "./taxonomies";

const SPECIES_CHIP_PALETTE = [
  {
    badgeClass: "border-slate-200 bg-slate-50 text-slate-700",
    borderClass: "border-slate-300",
    panelClass: "bg-slate-50/50",
  },
  {
    badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
    borderClass: "border-amber-300",
    panelClass: "bg-amber-50/45",
  },
  {
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    borderClass: "border-emerald-300",
    panelClass: "bg-emerald-50/45",
  },
  {
    badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
    borderClass: "border-rose-300",
    panelClass: "bg-rose-50/45",
  },
  {
    badgeClass: "border-violet-200 bg-violet-50 text-violet-700",
    borderClass: "border-violet-300",
    panelClass: "bg-violet-50/45",
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
