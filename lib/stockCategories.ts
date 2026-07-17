import type { LucideIcon } from "lucide-react";
import { Boxes, FileText, Gift, Image as ImageIcon, Package, Wrench } from "lucide-react";
import type { InventoryItem } from "./inventoryTypes";

export type StockCategoryOption = {
  /** Slug stable stocké en base (inventory_items.category). */
  value: string;
  /** Libellé affiché dans l'UI. */
  label: string;
};

/** Anciennes catégories figées — rétro-compat données existantes. */
export const LEGACY_INVENTORY_CATEGORIES = ["Print", "Goodies", "PLV"] as const;
export type LegacyInventoryCategory = (typeof LEGACY_INVENTORY_CATEGORIES)[number];

export function isLegacyInventoryCategory(value: string): value is LegacyInventoryCategory {
  return (LEGACY_INVENTORY_CATEGORIES as readonly string[]).includes(value);
}

const CATEGORY_ICONS: LucideIcon[] = [Package, FileText, Gift, ImageIcon, Boxes, Wrench];

const CATEGORY_GRADIENTS = [
  "from-[var(--surface-soft)] via-[var(--surface)] to-white",
  "from-[color-mix(in_srgb,var(--brand-primary)_6%,var(--surface))] via-[var(--surface)] to-white",
  "from-[var(--surface-soft)] via-[var(--surface)] to-[color-mix(in_srgb,var(--brand-primary)_4%,white)]",
];

const CATEGORY_CHIPS = [
  "ui-pill ui-pill-neutral",
  "ui-pill ui-pill-brand",
  "ui-pill ui-pill-neutral",
];

export function slugifyStockCategory(label: string): string {
  const base = label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "categorie";
}

export function uniqueStockCategoryValue(label: string, existing: string[]): string {
  const slug = slugifyStockCategory(label);
  if (!existing.includes(slug)) return slug;
  let n = 2;
  while (existing.includes(`${slug}-${n}`)) n += 1;
  return `${slug}-${n}`;
}

function isStockCategoryOption(value: unknown): value is StockCategoryOption {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return typeof row.value === "string" && row.value.trim() !== "" && typeof row.label === "string";
}

export function parseInventoryCategories(raw: unknown): StockCategoryOption[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(isStockCategoryOption)
    .map((item) => ({
      value: item.value.trim(),
      label: item.label.trim() || item.value.trim(),
    }))
    .filter((item) => item.value.length > 0);
}

/** Suggestions proposées à l'onboarding (libellés via i18n). */
export const STOCK_CATEGORY_SUGGESTION_IDS = [
  "documents",
  "promotional",
  "signage",
  "event_material",
  "supplies",
  "services",
] as const;

export type StockCategorySuggestionId = (typeof STOCK_CATEGORY_SUGGESTION_IDS)[number];

export function stockCategoryMeta(index: number): {
  icon: LucideIcon;
  gradient: string;
  chip: string;
} {
  const i = Math.abs(index) % CATEGORY_ICONS.length;
  return {
    icon: CATEGORY_ICONS[i]!,
    gradient: CATEGORY_GRADIENTS[i % CATEGORY_GRADIENTS.length]!,
    chip: CATEGORY_CHIPS[i % CATEGORY_CHIPS.length]!,
  };
}

export function stockCategoryLabel(
  categories: StockCategoryOption[],
  value: string,
): string {
  return categories.find((c) => c.value === value)?.label ?? value;
}

/** Résout les catégories actives : config org, sinon inventaire existant, sinon legacy. */
export function resolveStockCategories(
  configured: StockCategoryOption[],
  items: Pick<InventoryItem, "category">[],
): StockCategoryOption[] {
  if (configured.length > 0) return configured;

  const fromItems = [...new Set(items.map((i) => i.category).filter(Boolean))];
  if (fromItems.length > 0) {
    return fromItems.map((value) => ({
      value,
      label: isLegacyInventoryCategory(value)
        ? value === "PLV"
          ? "PLV"
          : value
        : value.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    }));
  }

  return LEGACY_INVENTORY_CATEGORIES.map((value) => ({
    value,
    label: value === "PLV" ? "PLV & signalétique" : value,
  }));
}
