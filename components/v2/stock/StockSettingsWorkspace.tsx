"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Settings2 } from "lucide-react";
import { updateStockCategories } from "../../../app/actions/stockSettings";
import { useBranding } from "../../../lib/brandingContext";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import type { StockCategoryOption } from "../../../lib/stockCategories";
import { useInventory } from "../../../lib/useInventory";
import { toastError, toastSuccess } from "../../../lib/toast";
import StockCategoriesEditor from "./StockCategoriesEditor";

function categoriesEqual(a: StockCategoryOption[], b: StockCategoryOption[]) {
  if (a.length !== b.length) return false;
  return a.every(
    (cat, index) => cat.value === b[index]?.value && cat.label === b[index]?.label,
  );
}

export default function StockSettingsWorkspace() {
  const { t } = useTranslation();
  const { branding, patchBranding } = useBranding();
  const { items } = useInventory();
  const [draft, setDraft] = useState<StockCategoryOption[]>(branding.inventoryCategories);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(branding.inventoryCategories);
  }, [branding.inventoryCategories]);

  const itemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      counts[item.category] = (counts[item.category] ?? 0) + 1;
    }
    return counts;
  }, [items]);

  const dirty = !categoriesEqual(draft, branding.inventoryCategories);

  const handleSave = async () => {
    if (draft.length === 0) {
      toastError(t("stock.onboarding.categories.minOne"));
      return;
    }

    const removed = branding.inventoryCategories.filter(
      (cat) => !draft.some((d) => d.value === cat.value),
    );
    for (const cat of removed) {
      const count = itemCounts[cat.value] ?? 0;
      if (count > 0) {
        toastError(
          t("stock.settings.categories.cannotRemove", { label: cat.label, count }),
        );
        return;
      }
    }

    setSaving(true);
    try {
      const result = await updateStockCategories(draft);
      if (!result.ok) {
        toastError(result.error);
        return;
      }
      patchBranding({ inventoryCategories: draft });
      toastSuccess(t("stock.settings.categories.saved"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--surface-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--foreground)]/75">
          <Settings2 className="h-3.5 w-3.5" />
          {t("stock.settings.badge")}
        </div>
        <h1 className="ui-heading text-3xl font-semibold text-[var(--foreground)]">
          {t("stock.settings.title")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[color:var(--foreground)]/65">
          {t("stock.settings.subtitle")}
        </p>
      </div>

      <div className="ui-surface rounded-3xl p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          {t("stock.settings.categories.title")}
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          {t("stock.settings.categories.description")}
        </p>

        <div className="mt-6">
          <StockCategoriesEditor
            categories={draft}
            onChange={setDraft}
            itemCounts={itemCounts}
          />
        </div>
      </div>

      {dirty ? (
        <div className="sticky bottom-4 z-20 flex justify-end">
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 shadow-lg">
            <span className="text-sm text-[color:var(--foreground)]/65">
              {t("stock.settings.unsaved")}
            </span>
            <button
              type="button"
              onClick={() => setDraft(branding.inventoryCategories)}
              className="ui-btn ui-btn-secondary py-2 text-sm"
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="ui-btn ui-btn-primary gap-2 py-2 text-sm"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t("common.save")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
