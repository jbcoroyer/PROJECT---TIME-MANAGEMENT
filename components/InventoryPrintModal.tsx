"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Upload, X } from "lucide-react";
import { useBranding } from "../lib/brandingContext";
import { printDocumentTypeOptions } from "../lib/printDocumentTypes";
import { PRINT_LANGUAGES_FR, PRINT_LANGUAGES_FEATURED_FR } from "../lib/printLanguages";
import type { InventoryItem, InventoryItemDraft } from "../lib/inventoryTypes";
import {
  decodePrintItemType,
  encodePrintItemType,
  type PrintSpeciesValue,
} from "../lib/printSpecies";
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
  /** Création : plusieurs lignes (une par langue) en une fois. */
  onSubmitMany?: (drafts: InventoryItemDraft[]) => Promise<void> | void;
  onDelete?: (item: InventoryItem) => Promise<void> | void;
};

const OTHER_DOC = "__autre__";

type LangRow = {
  key: string;
  language: string;
  quantity: string;
  unitPrice: string;
  alertThreshold: string;
};

function newLangRow(partial?: Partial<LangRow>): LangRow {
  return {
    key: typeof crypto !== "undefined" ? crypto.randomUUID() : `row-${Date.now()}-${Math.random()}`,
    language: partial?.language ?? "Français",
    quantity: partial?.quantity ?? "0",
    unitPrice: partial?.unitPrice ?? "0",
    alertThreshold: partial?.alertThreshold ?? "0",
  };
}

export default function InventoryPrintModal(props: Props) {
  const { t } = useTranslation();
  const { open, initialItem, allItems, onClose, onSubmit, onSubmitMany, onDelete } = props;
  const { branding } = useBranding();
  const printSpeciesOptions = branding.printSpecies;
  const isEditing = Boolean(initialItem?.id);

  const docOptions = useMemo(() => printDocumentTypeOptions(allItems), [allItems]);
  const restLang = useMemo(() => {
    const featured = new Set<string>(PRINT_LANGUAGES_FEATURED_FR);
    return PRINT_LANGUAGES_FR.filter((l) => !featured.has(l));
  }, []);

  const [docSelect, setDocSelect] = useState("");
  const [customDocType, setCustomDocType] = useState("");
  const [species, setSpecies] = useState<PrintSpeciesValue>("general");
  const [language, setLanguage] = useState("Français");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [unitPrice, setUnitPrice] = useState("0");
  const [alertThreshold, setAlertThreshold] = useState("0");
  const [visualUrl, setVisualUrl] = useState("");
  const [visualFile, setVisualFile] = useState<File | null>(null);
  const [visualPreviewUrl, setVisualPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [langRows, setLangRows] = useState<LangRow[]>(() => [newLangRow()]);

  useEffect(() => {
    return () => {
      if (visualPreviewUrl) URL.revokeObjectURL(visualPreviewUrl);
    };
  }, [visualPreviewUrl]);

  useEffect(() => {
    if (!open) return;
    const source = initialItem;
    if (source) {
      const decoded = decodePrintItemType(source.itemType ?? "");
      const t = decoded.docType.trim();
      const inList = docOptions.includes(t);
      setDocSelect(inList ? t : OTHER_DOC);
      setCustomDocType(inList ? "" : t);
      setSpecies(decoded.species);
      setLanguage(source.language?.trim() || "Français");
      setName(source.name);
      setQuantity(String(source.quantity));
      setUnitPrice(String(source.unitPrice));
      setAlertThreshold(String(source.alertThreshold));
      setVisualUrl(source.visualUrl ?? "");
      setVisualFile(null);
      setVisualPreviewUrl(null);
    } else {
      setDocSelect(docOptions[0] ?? "Fiches Commerciales");
      setCustomDocType("");
      setSpecies("general");
      setLanguage("Français");
      setName("");
      setQuantity("0");
      setUnitPrice("0");
      setAlertThreshold("0");
      setVisualUrl("");
      setVisualFile(null);
      setVisualPreviewUrl(null);
      setLangRows([newLangRow()]);
    }
  }, [open, initialItem, docOptions]);

  if (!open) return null;

  const resolvedDocType = (): string => {
    if (docSelect === OTHER_DOC) return customDocType.trim();
    return docSelect.trim();
  };

  const parsePrice = (v: string) => Math.max(0, Number(v.replace(",", ".")) || 0);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const doc = resolvedDocType();
    if (!doc) {
      toastError(t("inventory.print.docTypeRequired"));
      return;
    }
    if (!name.trim()) {
      toastError(t("inventory.print.nameRequired"));
      return;
    }

    const encodedType = encodePrintItemType(doc, species);

    setSubmitting(true);
    try {
      let resolvedVisualUrl = visualUrl.trim() || null;
      if (visualFile) {
        const { path, url, error } = await uploadStockVisual(visualFile, "print");
        if (error || !path) {
          toastError(t("inventory.print.uploadError", { error: error ?? "" }));
          return;
        }
        if (url) setVisualPreviewUrl(url);
        resolvedVisualUrl = path;
      }

    if (isEditing) {
      if (!language.trim()) {
        toastError(t("inventory.print.languageRequired"));
        return;
      }
        await onSubmit({
          id: initialItem?.id,
          category: "Print",
          itemType: encodedType,
          name: name.trim(),
          quantity: Math.max(0, Math.round(Number(quantity) || 0)),
          unitPrice: parsePrice(unitPrice),
          alertThreshold: Math.max(0, Math.round(Number(alertThreshold) || 0)),
          language: language.trim(),
          visualUrl: resolvedVisualUrl,
        });
        onClose();
      return;
    }

    const drafts: InventoryItemDraft[] = [];
    const seenLang = new Set<string>();
    for (const row of langRows) {
      const lang = row.language.trim();
      if (!lang) continue;
      const key = lang.toLowerCase();
      if (seenLang.has(key)) {
        toastError(t("inventory.print.duplicateLanguage", { lang }));
        return;
      }
      seenLang.add(key);
      drafts.push({
        category: "Print",
        itemType: encodedType,
        name: name.trim(),
        quantity: Math.max(0, Math.round(Number(row.quantity) || 0)),
        unitPrice: parsePrice(row.unitPrice),
        alertThreshold: Math.max(0, Math.round(Number(row.alertThreshold) || 0)),
        language: lang,
        visualUrl: resolvedVisualUrl,
      });
    }
    if (drafts.length === 0) {
      toastError(t("inventory.print.addLanguageRow"));
      return;
    }

      if (drafts.length > 1 && onSubmitMany) {
        await onSubmitMany(drafts);
      } else {
        await onSubmit(drafts[0]!);
      }
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--foreground)]/50">{t("inventory.print.badge")}</p>
            <h2 className="ui-heading mt-1 text-2xl font-semibold text-[var(--foreground)]">
              {isEditing ? t("inventory.print.editTitle") : t("inventory.print.addTitle")}
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
              <label className="mb-1 block text-xs font-semibold text-[color:var(--foreground)]/65">
                {t("inventory.print.docType")}
              </label>
              <select
                value={docSelect}
                onChange={(e) => setDocSelect(e.target.value)}
                className="ui-focus-ring mb-2 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm"
              >
                {docOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
                <option value={OTHER_DOC}>{t("inventory.print.otherOption")}</option>
              </select>
              {docSelect === OTHER_DOC && (
                <input
                  value={customDocType}
                  onChange={(e) => setCustomDocType(e.target.value)}
                  className="ui-focus-ring w-full rounded-xl border border-[var(--line)]/85 bg-[var(--surface-soft)] px-3 py-2.5 text-sm"
                  placeholder={t("inventory.print.customTypePlaceholder")}
                />
              )}
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-[color:var(--foreground)]/65">{t("inventory.print.species")}</label>
              <select
                value={species}
                onChange={(e) => setSpecies(e.target.value as PrintSpeciesValue)}
                className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm"
              >
                {printSpeciesOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-[color:var(--foreground)]/65">{t("inventory.print.docName")}</label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                placeholder={t("inventory.print.namePlaceholder")}
              />
            </div>

            {isEditing ? (
              <>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-[color:var(--foreground)]/65">{t("inventory.common.language")}</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                  >
                    <optgroup label={t("inventory.common.featuredLanguages")}>
                      {PRINT_LANGUAGES_FEATURED_FR.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label={t("inventory.common.otherLanguages")}>
                      {restLang.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[color:var(--foreground)]/65">{t("inventory.common.quantity")}</label>
                  <input
                    type="number"
                    min="0"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
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
                  <label className="mb-1 block text-xs font-semibold text-[color:var(--foreground)]/65">{t("inventory.common.alertThreshold")}</label>
                  <input
                    type="number"
                    min="0"
                    value={alertThreshold}
                    onChange={(event) => setAlertThreshold(event.target.value)}
                    className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                  />
                </div>
              </>
            ) : (
              <div className="md:col-span-2 space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <label className="block text-xs font-semibold text-[color:var(--foreground)]/65">
                    {t("inventory.print.langRowsTitle")}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const base = langRows[0];
                      setLangRows((rows) => [
                        ...rows,
                        newLangRow({
                          unitPrice: base?.unitPrice ?? "0",
                          alertThreshold: base?.alertThreshold ?? "0",
                          language: "Anglais",
                        }),
                      ]);
                    }}
                    className="ui-transition inline-flex items-center gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs font-semibold text-[color:var(--foreground)]/75 hover:bg-[var(--surface)]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {t("inventory.print.addLanguage")}
                  </button>
                </div>
                <div className="space-y-3 rounded-[20px] border border-[var(--line)] bg-[var(--surface-soft)]/40 p-4">
                  {langRows.map((row) => (
                    <div
                      key={row.key}
                      className="grid gap-3 border-b border-[var(--line)] pb-3 last:border-b-0 last:pb-0 md:grid-cols-12 md:items-end"
                    >
                      <div className="md:col-span-4">
                        <label className="mb-1 block text-[11px] font-semibold text-[color:var(--foreground)]/55">{t("inventory.common.language")}</label>
                        <select
                          value={row.language}
                          onChange={(e) => {
                            const v = e.target.value;
                            setLangRows((rows) => rows.map((r) => (r.key === row.key ? { ...r, language: v } : r)));
                          }}
                          className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
                        >
                          <optgroup label={t("inventory.common.featuredLanguages")}>
                            {PRINT_LANGUAGES_FEATURED_FR.map((l) => (
                              <option key={l} value={l}>
                                {l}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label={t("inventory.common.otherLanguages")}>
                            {restLang.map((l) => (
                              <option key={l} value={l}>
                                {l}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-[11px] font-semibold text-[color:var(--foreground)]/55">{t("inventory.print.qtyShort")}</label>
                        <input
                          type="number"
                          min="0"
                          value={row.quantity}
                          onChange={(e) => {
                            const v = e.target.value;
                            setLangRows((rows) => rows.map((r) => (r.key === row.key ? { ...r, quantity: v } : r)));
                          }}
                          className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-[11px] font-semibold text-[color:var(--foreground)]/55">{t("inventory.print.priceShort")}</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.unitPrice}
                          onChange={(e) => {
                            const v = e.target.value;
                            setLangRows((rows) => rows.map((r) => (r.key === row.key ? { ...r, unitPrice: v } : r)));
                          }}
                          className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-[11px] font-semibold text-[color:var(--foreground)]/55">{t("inventory.print.thresholdShort")}</label>
                        <input
                          type="number"
                          min="0"
                          value={row.alertThreshold}
                          onChange={(e) => {
                            const v = e.target.value;
                            setLangRows((rows) => rows.map((r) => (r.key === row.key ? { ...r, alertThreshold: v } : r)));
                          }}
                          className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="flex items-end justify-end md:col-span-2">
                        {langRows.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => setLangRows((rows) => rows.filter((r) => r.key !== row.key))}
                            className="ui-transition ui-btn ui-btn-outline-danger rounded-xl px-3 py-2 text-xs font-semibold"
                          >
                            {t("inventory.common.remove")}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[color:var(--foreground)]/65">
                {t("inventory.print.visualUrlOptional")}
              </label>
              <input
                value={visualUrl}
                onChange={(event) => setVisualUrl(event.target.value)}
                className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[color:var(--foreground)]/65">
                {t("inventory.print.uploadLabel")}
              </label>
              <label className="ui-transition flex h-[42px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-soft)] px-3 text-sm font-medium text-[color:var(--foreground)]/70 hover:border-[var(--line-strong)]">
                <Upload className="h-4 w-4" />
                {t("inventory.common.chooseFile")}
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
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground)]/55">
                {t("inventory.common.preview")}
              </p>
              <StockVisualPreview
                url={visualPreviewUrl ?? visualUrl}
                name={t("inventory.print.previewName")}
                mode="detail"
              />
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
                className="ui-transition rounded-xl bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] shadow-sm hover:opacity-90 disabled:opacity-60"
              >
                {submitting
                  ? t("inventory.common.saving")
                  : isEditing
                    ? t("inventory.common.update")
                    : langRows.length > 1
                      ? t("inventory.common.createLanguages", { count: langRows.length })
                      : t("inventory.common.create")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
