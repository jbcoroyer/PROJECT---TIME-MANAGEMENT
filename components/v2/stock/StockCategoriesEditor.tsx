"use client";

import { useMemo, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import {
  STOCK_CATEGORY_SUGGESTION_IDS,
  stockCategoryMeta,
  uniqueStockCategoryValue,
  type StockCategoryOption,
} from "../../../lib/stockCategories";

type StockCategoriesEditorProps = {
  categories: StockCategoryOption[];
  onChange: (next: StockCategoryOption[]) => void;
  itemCounts?: Record<string, number>;
  /** Affiche les suggestions prédéfinies (onboarding + paramètres). */
  showSuggestions?: boolean;
};

export default function StockCategoriesEditor({
  categories,
  onChange,
  itemCounts,
  showSuggestions = true,
}: StockCategoriesEditorProps) {
  const { t } = useTranslation();
  const [customLabel, setCustomLabel] = useState("");

  const suggestionOptions = useMemo(
    () =>
      STOCK_CATEGORY_SUGGESTION_IDS.map((id) => ({
        id,
        label: t(`stock.onboarding.categories.${id}`),
        description: t(`stock.onboarding.categories.${id}Desc`),
      })),
    [t],
  );

  const isSelected = (label: string) =>
    categories.some((c) => c.label.toLowerCase() === label.toLowerCase());

  const toggleSuggestion = (label: string) => {
    if (isSelected(label)) {
      onChange(categories.filter((c) => c.label.toLowerCase() !== label.toLowerCase()));
      return;
    }
    const existing = categories.map((c) => c.value);
    onChange([
      ...categories,
      {
        value: uniqueStockCategoryValue(label, existing),
        label,
      },
    ]);
  };

  const addCustomCategory = () => {
    const label = customLabel.trim();
    if (!label || isSelected(label)) {
      setCustomLabel("");
      return;
    }
    const existing = categories.map((c) => c.value);
    onChange([
      ...categories,
      { value: uniqueStockCategoryValue(label, existing), label },
    ]);
    setCustomLabel("");
  };

  const removeCategory = (value: string) => {
    onChange(categories.filter((c) => c.value !== value));
  };

  const updateCategoryLabel = (value: string, label: string) => {
    onChange(
      categories.map((c) =>
        c.value === value ? { ...c, label: label.trim() || c.label } : c,
      ),
    );
  };

  const tryRemove = (cat: StockCategoryOption) => {
    const count = itemCounts?.[cat.value] ?? 0;
    if (count > 0) return;
    removeCategory(cat.value);
  };

  return (
    <div className="space-y-6">
      {showSuggestions ? (
        <>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--foreground)]/50">
            {t("stock.onboarding.categories.suggestions")}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {suggestionOptions.map((opt, index) => {
              const active = isSelected(opt.label);
              const meta = stockCategoryMeta(index);
              const Icon = meta.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleSuggestion(opt.label)}
                  className={[
                    "ui-transition rounded-xl border p-4 text-left",
                    active
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] ring-2 ring-[var(--accent)]/20"
                      : "border-[var(--line)] hover:border-[var(--accent)]/40",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={[
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                        active ? "bg-[var(--accent)] text-[var(--accent-contrast)]" : meta.chip,
                      ].join(" ")}
                    >
                      {active ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">{opt.label}</p>
                      <p className="mt-0.5 text-xs text-[var(--ink-muted)]">{opt.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      ) : null}

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-[color:var(--foreground)]/65">
          {t("stock.onboarding.categories.customLabel")}
        </label>
        <div className="flex gap-2">
          <input
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomCategory())}
            placeholder={t("stock.onboarding.categories.customPlaceholder")}
            className="ui-focus-ring min-w-0 flex-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm"
          />
          <button
            type="button"
            onClick={addCustomCategory}
            className="ui-btn ui-btn-secondary shrink-0 gap-1.5"
          >
            <Plus className="h-4 w-4" />
            {t("stock.onboarding.categories.add")}
          </button>
        </div>
      </div>

      {categories.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--foreground)]/50">
            {t("stock.onboarding.categories.selected", { count: categories.length })}
          </p>
          <div className="space-y-2">
            {categories.map((cat, index) => {
              const count = itemCounts?.[cat.value] ?? 0;
              const meta = stockCategoryMeta(index);
              const Icon = meta.icon;
              const locked = count > 0;
              return (
                <div
                  key={cat.value}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-2.5 sm:flex-nowrap"
                >
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.chip}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <input
                    value={cat.label}
                    onChange={(e) => updateCategoryLabel(cat.value, e.target.value)}
                    className="ui-focus-ring min-w-0 flex-1 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm font-medium"
                    aria-label={t("stock.settings.categories.renameAria", { label: cat.label })}
                  />
                  {count > 0 ? (
                    <span className="shrink-0 text-xs text-[color:var(--foreground)]/55">
                      {t("stock.settings.categories.itemCount", { count })}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => tryRemove(cat)}
                    disabled={locked}
                    className="ui-transition shrink-0 rounded-lg p-2 text-[color:var(--foreground)]/50 hover:bg-[var(--surface)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label={t("stock.onboarding.categories.remove", { label: cat.label })}
                    title={
                      locked
                        ? t("stock.settings.categories.cannotRemoveHint", { count })
                        : undefined
                    }
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-[color:var(--foreground)]/55">
            {t("stock.settings.categories.renameHint")}
          </p>
        </div>
      ) : null}
    </div>
  );
}
