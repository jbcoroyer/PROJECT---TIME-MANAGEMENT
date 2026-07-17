import { FileText, Gift, Image as ImageIcon, Package } from "lucide-react";
import { getPrintSpeciesVisual } from "../../../lib/printSpeciesStyles";
import { printSpeciesLabel, type PrintSpeciesOption } from "../../../lib/taxonomies";
import { decodePrintItemType, type PrintSpeciesValue } from "../../../lib/printSpecies";
import {
  isLegacyInventoryCategory,
  stockCategoryMeta,
  type StockCategoryOption,
} from "../../../lib/stockCategories";
import {
  isLowStock,
  type InventoryItem,
} from "../../../lib/inventoryTypes";

export type CategoryFilter = "all" | string;
export type SpeciesFilter = "all" | PrintSpeciesValue;
export type SortKey = "name" | "quantity" | "value" | "alert";
export type ViewMode = "grid" | "list";

export type DisplaySection = {
  id: string;
  title: string | null;
  chipClass?: string;
  items: InventoryItem[];
};

/** Rétro-compat affichage legacy Print / Goodies / PLV. */
export const LEGACY_CATEGORY_META: Record<
  string,
  { label: string; icon: typeof Package; gradient: string; chip: string }
> = {
  Print: {
    label: "Print",
    icon: FileText,
    gradient: "from-[var(--surface-soft)] via-[var(--surface)] to-white",
    chip: "ui-pill ui-pill-neutral",
  },
  Goodies: {
    label: "Goodies",
    icon: Gift,
    gradient: "from-[color-mix(in_srgb,var(--brand-primary)_6%,var(--surface))] via-[var(--surface)] to-white",
    chip: "ui-pill ui-pill-brand",
  },
  PLV: {
    label: "PLV",
    icon: ImageIcon,
    gradient: "from-[var(--surface-soft)] via-[var(--surface)] to-white",
    chip: "ui-pill ui-pill-neutral",
  },
};

export function getCategoryDisplayMeta(
  categoryValue: string,
  categories: StockCategoryOption[],
  index = 0,
) {
  if (isLegacyInventoryCategory(categoryValue) && LEGACY_CATEGORY_META[categoryValue]) {
    return LEGACY_CATEGORY_META[categoryValue]!;
  }
  const configured = categories.find((c) => c.value === categoryValue);
  const meta = stockCategoryMeta(index);
  return {
    label: configured?.label ?? categoryValue,
    icon: meta.icon,
    gradient: meta.gradient,
    chip: meta.chip,
  };
}

export function getPrintMeta(item: InventoryItem, options: PrintSpeciesOption[]) {
  const decoded = decodePrintItemType(item.itemType ?? "");
  const visual = getPrintSpeciesVisual(options, decoded.species);
  return {
    docType: decoded.docType,
    species: decoded.species,
    speciesLabel: printSpeciesLabel(options, decoded.species),
    chipClass: visual.badgeClass,
  };
}

export function stockGauge(item: InventoryItem): { pct: number; tone: "ok" | "warn" | "low" } {
  const low = isLowStock(item);
  if (low) return { pct: item.quantity <= 0 ? 6 : 22, tone: "low" };
  if (item.alertThreshold > 0) {
    const ratio = item.quantity / (item.alertThreshold * 2);
    if (ratio <= 0.75) return { pct: Math.max(40, Math.min(70, ratio * 100)), tone: "warn" };
    return { pct: Math.min(100, ratio * 100), tone: "ok" };
  }
  return { pct: 100, tone: "ok" };
}

export const GAUGE_TONE: Record<"ok" | "warn" | "low", string> = {
  ok: "bg-[var(--success)]",
  warn: "bg-[var(--warning)]",
  low: "bg-[var(--danger)]",
};

export function itemSubtitle(
  item: InventoryItem,
  printSpeciesOptions: PrintSpeciesOption[],
  categories: StockCategoryOption[],
): string {
  if (item.category === "Print") {
    const { docType } = getPrintMeta(item, printSpeciesOptions);
    const lang = item.language?.trim();
    return lang ? `${docType} · ${lang}` : docType;
  }
  if (item.itemType?.trim()) return item.itemType.trim();
  const configured = categories.find((c) => c.value === item.category);
  return configured?.label ?? item.category;
}

export function itemSearchHaystack(
  item: InventoryItem,
  printSpeciesOptions: PrintSpeciesOption[],
  categories: StockCategoryOption[],
): string {
  if (item.category === "Print") {
    const { docType, speciesLabel } = getPrintMeta(item, printSpeciesOptions);
    return [item.name, docType, speciesLabel, item.language, item.lastQuoteInfo].filter(Boolean).join(" ");
  }
  const catLabel = categories.find((c) => c.value === item.category)?.label ?? item.category;
  return [item.name, item.itemType, catLabel, item.lastQuoteInfo].filter(Boolean).join(" ");
}
