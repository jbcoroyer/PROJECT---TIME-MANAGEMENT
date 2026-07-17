"use client";

import { useEffect, useMemo, useState } from "react";
import { Trash2, Upload, X } from "lucide-react";
import type { InventoryItem, InventoryItemDraft } from "../lib/inventoryTypes";
import { uploadStockVisual } from "../lib/stockVisualUpload";
import { STOCK_VISUAL_ACCEPT, stockVisualFileError } from "../lib/stockVisualUtils";
import { toastError } from "../lib/toast";
import StockVisualPreview from "./stock/StockVisualPreview";
import { useTranslation } from "../lib/i18n/useTranslation";

type Props = {
  open: boolean;
  category: string;
  categoryLabel: string;
  initialItem: InventoryItem | null;
  onClose: () => void;
  onSubmit: (draft: InventoryItemDraft) => Promise<void> | void;
  onDelete?: (item: InventoryItem) => Promise<void> | void;
};

export default function InventoryGenericModal({
  open,
  category,
  categoryLabel,
  initialItem,
  onClose,
  onSubmit,
  onDelete,
}: Props) {
  const { t } = useTranslation();
  const isEditing = Boolean(initialItem?.id);

  const defaultDraft = useMemo<InventoryItemDraft>(
    () => ({
      category,
      itemType: "",
      name: "",
      quantity: 0,
      unitPrice: 0,
      alertThreshold: 0,
      language: null,
    }),
    [category],
  );

  const [itemType, setItemType] = useState("");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [unitPrice, setUnitPrice] = useState("0");
  const [alertThreshold, setAlertThreshold] = useState("0");
  const [visualUrl, setVisualUrl] = useState("");
  const [visualFile, setVisualFile] = useState<File | null>(null);
  const [visualPreviewUrl, setVisualPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const source = initialItem ?? defaultDraft;
    setItemType(source.itemType);
    setName(source.name);
    setQuantity(String(source.quantity));
    setUnitPrice(String(source.unitPrice));
    setAlertThreshold(String(source.alertThreshold));
    setVisualUrl(initialItem?.visualUrl ?? "");
    setVisualFile(null);
    setVisualPreviewUrl(null);
  }, [open, initialItem, defaultDraft]);

  useEffect(() => {
    return () => {
      if (visualPreviewUrl) URL.revokeObjectURL(visualPreviewUrl);
    };
  }, [visualPreviewUrl]);

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      toastError(t("stock.genericModal.nameRequired"));
      return;
    }

    setSubmitting(true);
    try {
      let resolvedVisualUrl = visualUrl.trim() || null;
      if (visualFile) {
        const { path, url, error } = await uploadStockVisual(visualFile, category);
        if (error || !path) {
          toastError(t("stock.genericModal.uploadFailed", { error: error ?? "" }));
          return;
        }
        if (url) setVisualPreviewUrl(url);
        resolvedVisualUrl = path;
      }

      await onSubmit({
        id: initialItem?.id,
        category,
        itemType: itemType.trim(),
        name: name.trim(),
        quantity: Math.max(0, Math.round(Number(quantity) || 0)),
        unitPrice: Math.max(0, Number(unitPrice.replace(",", ".")) || 0),
        alertThreshold: Math.max(0, Math.round(Number(alertThreshold) || 0)),
        language: null,
        visualUrl: resolvedVisualUrl,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="ui-modal-overlay"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="ui-surface max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--foreground)]/50">
              {categoryLabel}
            </p>
            <h2 className="ui-heading mt-1 text-2xl font-semibold text-[var(--foreground)]">
              {isEditing ? t("stock.genericModal.editTitle") : t("stock.genericModal.addTitle")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ui-transition rounded-xl border border-[var(--line)] bg-[var(--surface)] p-2 text-[color:var(--foreground)]/60 hover:bg-[var(--surface-soft)]"
            aria-label={t("stock.boutique.close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-[color:var(--foreground)]/65">
                {t("stock.genericModal.typeLabel")}
              </label>
              <input
                value={itemType}
                onChange={(event) => setItemType(event.target.value)}
                className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                placeholder={t("stock.genericModal.typePlaceholder")}
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-[color:var(--foreground)]/65">
                {t("stock.genericModal.nameLabel")}
              </label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                placeholder={t("stock.genericModal.namePlaceholder")}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[color:var(--foreground)]/65">
                {t("inventory.common.quantity")}
              </label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[color:var(--foreground)]/65">
                {t("stock.genericModal.unitPrice")}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={unitPrice}
                onChange={(event) => setUnitPrice(event.target.value)}
                className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[color:var(--foreground)]/65">
                {t("stock.genericModal.alertThreshold")}
              </label>
              <input
                type="number"
                min="0"
                value={alertThreshold}
                onChange={(event) => setAlertThreshold(event.target.value)}
                className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-[color:var(--foreground)]/65">
              {t("stock.genericModal.visualLabel")}
            </label>
            <div className="flex flex-wrap items-center gap-3">
              {(visualPreviewUrl || visualUrl) && (
                <div className="h-20 w-20 overflow-hidden rounded-xl border border-[var(--line)]">
                  <StockVisualPreview
                    url={visualPreviewUrl ?? visualUrl}
                    name={name || categoryLabel}
                    mode="thumb"
                  />
                </div>
              )}
              <label className="ui-transition inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-sm font-medium text-[color:var(--foreground)]/70 hover:border-[var(--accent)]">
                <Upload className="h-4 w-4" />
                {t("stock.genericModal.addVisual")}
                <input
                  type="file"
                  accept={STOCK_VISUAL_ACCEPT}
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const err = stockVisualFileError(file);
                    if (err) {
                      toastError(err);
                      return;
                    }
                    setVisualFile(file);
                    setVisualPreviewUrl(URL.createObjectURL(file));
                  }}
                />
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-5">
            {isEditing && onDelete && initialItem ? (
              <button
                type="button"
                onClick={() => onDelete(initialItem)}
                className="ui-transition inline-flex items-center gap-2 rounded-xl border border-[var(--danger)]/30 px-3 py-2 text-sm font-semibold text-[var(--danger)] hover:bg-[color-mix(in_srgb,var(--danger)_8%,var(--surface))]"
              >
                <Trash2 className="h-4 w-4" />
                {t("common.delete")}
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="ui-btn ui-btn-secondary">
                {t("common.cancel")}
              </button>
              <button type="submit" disabled={submitting} className="ui-btn ui-btn-primary">
                {submitting ? t("common.saving") : isEditing ? t("common.save") : t("stock.genericModal.create")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
