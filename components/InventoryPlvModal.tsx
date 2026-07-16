"use client";

import { useEffect, useMemo, useState } from "react";
import { Image as ImageIcon, Trash2, Upload, X } from "lucide-react";
import type { InventoryItem, InventoryItemDraft } from "../lib/inventoryTypes";
import { uploadStockVisual } from "../lib/stockVisualUpload";
import { STOCK_VISUAL_ACCEPT, stockVisualFileError } from "../lib/stockVisualUtils";
import { toastError } from "../lib/toast";
import StockVisualPreview from "./stock/StockVisualPreview";
import { useTranslation } from "../lib/i18n/useTranslation";

type Props = {
  open: boolean;
  initialItem: InventoryItem | null;
  allItems: InventoryItem[];
  onClose: () => void;
  onSubmit: (draft: InventoryItemDraft) => Promise<void> | void;
  onDelete?: (item: InventoryItem) => Promise<void> | void;
};

const OTHER_TYPE = "__autre__";

export default function InventoryPlvModal(props: Props) {
  const { t } = useTranslation();
  const { open, initialItem, allItems, onClose, onSubmit, onDelete } = props;
  const isEditing = Boolean(initialItem?.id);
  const typeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          allItems
            .filter((item) => item.category === "PLV")
            .map((item) => item.itemType.trim())
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b, "fr")),
    [allItems],
  );

  const [typeSelect, setTypeSelect] = useState("");
  const [customType, setCustomType] = useState("");
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
    const source = initialItem;
    const sourceType = source?.itemType?.trim() ?? "";
    const inList = sourceType.length > 0 && typeOptions.includes(sourceType);
    if (sourceType) {
      setTypeSelect(inList ? sourceType : OTHER_TYPE);
      setCustomType(inList ? "" : sourceType);
    } else {
      setTypeSelect(typeOptions[0] ?? OTHER_TYPE);
      setCustomType("");
    }
    setName(source?.name ?? "");
    setQuantity(String(source?.quantity ?? 0));
    setUnitPrice(String(source?.unitPrice ?? 0));
    setAlertThreshold(String(source?.alertThreshold ?? 0));
    setVisualUrl(source?.visualUrl ?? "");
    setVisualFile(null);
    setVisualPreviewUrl(null);
  }, [open, initialItem, typeOptions]);

  useEffect(() => {
    return () => {
      if (visualPreviewUrl) URL.revokeObjectURL(visualPreviewUrl);
    };
  }, [visualPreviewUrl]);

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      toastError(t("inventory.plv.nameRequired"));
      return;
    }
    const resolvedType = (typeSelect === OTHER_TYPE ? customType : typeSelect).trim();
    if (!resolvedType) {
      toastError(t("inventory.plv.typeRequired"));
      return;
    }

    setSubmitting(true);
    try {
      let resolvedVisualUrl = visualUrl.trim() || null;
      if (visualFile) {
        const { path, url, error } = await uploadStockVisual(visualFile, "plv");
        if (error || !path) {
          toastError(t("inventory.plv.uploadError", { error: error ?? "" }));
          return;
        }
        if (url) setVisualPreviewUrl(url);
        resolvedVisualUrl = path;
      }

      await onSubmit({
        id: initialItem?.id,
        category: "PLV",
        itemType: resolvedType,
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
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="ui-surface max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[28px] p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--foreground)]/50">{t("inventory.plv.badge")}</p>
            <h2 className="ui-heading mt-1 text-2xl font-semibold text-[var(--foreground)]">
              {isEditing ? t("inventory.plv.editTitle") : t("inventory.plv.addTitle")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ui-transition rounded-xl border border-[var(--line)] bg-[var(--surface)] p-2 text-[color:var(--foreground)]/60 hover:bg-[var(--surface-soft)]"
            aria-label={t("inventory.common.close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-[color:var(--foreground)]/65">{t("inventory.plv.supportType")}</label>
              <select
                value={typeSelect}
                onChange={(event) => setTypeSelect(event.target.value)}
                className="ui-focus-ring mb-2 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm"
              >
                {typeOptions.map((typeName) => (
                  <option key={typeName} value={typeName}>
                    {typeName}
                  </option>
                ))}
                <option value={OTHER_TYPE}>{t("inventory.plv.otherOption")}</option>
              </select>
              {typeSelect === OTHER_TYPE && (
                <input
                  value={customType}
                  onChange={(event) => setCustomType(event.target.value)}
                  className="ui-focus-ring w-full rounded-xl border border-[var(--line)]/85 bg-[var(--surface-soft)] px-3 py-2.5 text-sm"
                  placeholder={t("inventory.plv.customTypePlaceholder")}
                />
              )}
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-[color:var(--foreground)]/65">{t("inventory.plv.name")}</label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                placeholder={t("inventory.plv.namePlaceholder")}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[color:var(--foreground)]/65">{t("inventory.plv.quantity")}</label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[color:var(--foreground)]/65">{t("inventory.common.alertThreshold")}</label>
              <input
                type="number"
                min="0"
                value={alertThreshold}
                onChange={(event) => setAlertThreshold(event.target.value)}
                className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[color:var(--foreground)]/65">{t("inventory.common.unitPrice")}</label>
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
              <label className="mb-1 block text-xs font-semibold text-[color:var(--foreground)]/65">{t("inventory.plv.visualUrlOptional")}</label>
              <input
                value={visualUrl}
                onChange={(event) => setVisualUrl(event.target.value)}
                className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                placeholder="https://..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-[color:var(--foreground)]/65">{t("inventory.plv.uploadLabel")}</label>
              <label className="ui-transition flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-soft)] px-3 py-4 text-sm font-medium text-[color:var(--foreground)]/70 hover:border-[var(--line-strong)]">
                <Upload className="h-4 w-4" />
                {t("inventory.plv.chooseFile")}
                <input
                  type="file"
                  accept={STOCK_VISUAL_ACCEPT}
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    const err = file ? stockVisualFileError(file) : null;
                    if (err) {
                      toastError(err);
                      event.target.value = "";
                      return;
                    }
                    if (visualPreviewUrl) URL.revokeObjectURL(visualPreviewUrl);
                    setVisualFile(file);
                    setVisualPreviewUrl(file ? URL.createObjectURL(file) : null);
                  }}
                />
              </label>
            </div>
          </div>

          {(visualPreviewUrl || visualUrl) && (
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground)]/55">{t("inventory.plv.visualPreviewLabel")}</p>
              <StockVisualPreview url={visualPreviewUrl ?? visualUrl} name={t("inventory.plv.previewName")} mode="detail" />
            </div>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
            <div>
              {isEditing && initialItem && onDelete && (
                <button
                  type="button"
                  onClick={() => void onDelete(initialItem)}
                  className="ui-transition ui-btn ui-btn-outline-danger inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold"
                >
                  <Trash2 className="h-4 w-4" />
                  {t("inventory.common.delete")}
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="ui-transition rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[color:var(--foreground)]/75 hover:bg-[var(--surface-soft)]"
              >
                {t("inventory.common.cancel")}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="ui-transition inline-flex items-center gap-2 rounded-xl bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] shadow-sm hover:opacity-90 disabled:opacity-60"
              >
                <ImageIcon className="h-4 w-4" />
                {submitting ? t("inventory.common.saving") : isEditing ? t("inventory.common.update") : t("inventory.common.create")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
