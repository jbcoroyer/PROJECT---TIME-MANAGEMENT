"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownUp,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  LayoutGrid,
  Loader2,
  Minus,
  Package,
  Pencil,
  Plus,
  RefreshCcw,
  Rows3,
  Search,
  Sparkles,
  Trash2,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import InventoryGoodiesModal from "../../InventoryGoodiesModal";
import InventoryPlvModal from "../../InventoryPlvModal";
import InventoryPrintModal from "../../InventoryPrintModal";
import InventoryReorderModal from "../../InventoryReorderModal";
import StockMovementModal from "../../StockMovementModal";
import StockVisualPreview from "../../stock/StockVisualPreview";
import { useConfirm } from "../../ui/ConfirmDialog";
import EmptyState from "../../ui/EmptyState";
import { toastError, toastSuccess } from "../../../lib/toast";
import { useCurrentUser } from "../../../lib/useCurrentUser";
import {
  inventoryCategories,
  inventoryItemValue,
  isLowStock,
  type InventoryCategory,
  type InventoryItem,
  type InventoryItemDraft,
} from "../../../lib/inventoryTypes";
import { getInventoryErrorMessage, useInventory } from "../../../lib/useInventory";
import { useStockProjects } from "../../../lib/useStockProjects";
import { formatCurrency, formatNumber } from "../../../lib/stockUtils";
import { uploadStockVisual } from "../../../lib/stockVisualUpload";
import { isPdfFile, isPdfUrl, STOCK_VISUAL_ACCEPT, stockVisualFileError } from "../../../lib/stockVisualUtils";
import { useBranding } from "../../../lib/brandingContext";
import { getIntlLocale } from "../../../lib/i18n/dateFnsLocale";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import { getPrintSpeciesVisual } from "../../../lib/printSpeciesStyles";
import { printSpeciesLabel } from "../../../lib/taxonomies";
import {
  CATEGORY_META,
  GAUGE_TONE,
  getPrintMeta,
  itemSearchHaystack,
  itemSubtitle,
  stockGauge,
  type CategoryFilter,
  type DisplaySection,
  type SortKey,
  type SpeciesFilter,
  type ViewMode,
} from "./stockBoutiqueUtils";

export default function V2StockBoutique({ basePath = "/stock" }: { basePath?: string }) {
  const { t, locale } = useTranslation();
  const intlLocale = useMemo(() => getIntlLocale(locale), [locale]);
  const { branding } = useBranding();
  const printSpeciesOptions = branding.printSpecies;
  const { user: currentUser } = useCurrentUser();
  const {
    items,
    loading,
    loadItems,
    createItem,
    updateItem,
    updateLastQuoteInfo,
    recordMovement,
    deleteItem,
  } = useInventory();
  const { projects } = useStockProjects();
  const confirm = useConfirm();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [speciesFilter, setSpeciesFilter] = useState<SpeciesFilter>("all");
  const [alertOnly, setAlertOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("alert");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);
  const [lightbox, setLightbox] = useState<{ url: string; name: string } | null>(null);

  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [goodiesModalOpen, setGoodiesModalOpen] = useState(false);
  const [plvModalOpen, setPlvModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [reorderItem, setReorderItem] = useState<InventoryItem | null>(null);
  const [movementItem, setMovementItem] = useState<InventoryItem | null>(null);
  const [movementMode, setMovementMode] = useState<"add" | "remove">("remove");
  const [photoUploading, setPhotoUploading] = useState(false);

  const categoryLabel = (category: InventoryCategory) => {
    const keys: Record<InventoryCategory, string> = {
      Print: "stock.boutique.category.print",
      Goodies: "stock.boutique.category.goodies",
      PLV: "stock.boutique.category.plv",
    };
    return t(keys[category]);
  };

  const sortOptions: { key: SortKey; label: string }[] = useMemo(
    () => [
      { key: "alert", label: t("stock.boutique.sort.alert") },
      { key: "name", label: t("stock.boutique.sort.name") },
      { key: "quantity", label: t("stock.boutique.sort.quantity") },
      { key: "value", label: t("stock.boutique.sort.value") },
    ],
    [t],
  );

  const detail = useMemo(
    () => (detailItem ? items.find((it) => it.id === detailItem.id) ?? detailItem : null),
    [detailItem, items],
  );

  const totalValue = useMemo(() => items.reduce((sum, it) => sum + inventoryItemValue(it), 0), [items]);
  const alertCount = useMemo(() => items.filter((it) => isLowStock(it)).length, [items]);

  const categoryCounts = useMemo(() => {
    const base: Record<CategoryFilter, number> = { all: items.length, Print: 0, Goodies: 0, PLV: 0 };
    for (const it of items) base[it.category] += 1;
    return base;
  }, [items]);

  const showSpeciesFilters = categoryFilter === "all" || categoryFilter === "Print";

  const speciesCounts = useMemo(() => {
    const printItems = items.filter(
      (it) => it.category === "Print" && (categoryFilter === "all" || categoryFilter === "Print"),
    );
    const counts: Record<string, number> = { all: printItems.length };
    for (const opt of printSpeciesOptions) counts[opt.value] = 0;
    for (const item of printItems) {
      const species = getPrintMeta(item, printSpeciesOptions).species;
      counts[species] = (counts[species] ?? 0) + 1;
    }
    return counts as Record<SpeciesFilter, number>;
  }, [items, categoryFilter, printSpeciesOptions]);

  const visibleItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const list = items.filter((item) => {
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      if (speciesFilter !== "all") {
        if (item.category !== "Print" || getPrintMeta(item, printSpeciesOptions).species !== speciesFilter) return false;
      }
      if (alertOnly && !isLowStock(item)) return false;
      if (!query) return true;
      return itemSearchHaystack(item, printSpeciesOptions).toLowerCase().includes(query);
    });
    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sortKey) {
        case "quantity":
          return b.quantity - a.quantity;
        case "value":
          return inventoryItemValue(b) - inventoryItemValue(a);
        case "alert": {
          const la = isLowStock(a) ? 0 : 1;
          const lb = isLowStock(b) ? 0 : 1;
          if (la !== lb) return la - lb;
          return a.name.localeCompare(b.name, intlLocale);
        }
        default:
          return a.name.localeCompare(b.name, intlLocale);
      }
    });
    return sorted;
  }, [items, searchQuery, categoryFilter, speciesFilter, alertOnly, sortKey, printSpeciesOptions, intlLocale]);

  const displaySections = useMemo((): DisplaySection[] => {
    const groupBySpecies =
      showSpeciesFilters && speciesFilter === "all" && visibleItems.some((it) => it.category === "Print");

    if (!groupBySpecies) {
      return [{ id: "all", title: null, items: visibleItems }];
    }

    const sections: DisplaySection[] = [];
    const printItems = visibleItems.filter((it) => it.category === "Print");
    const otherItems = visibleItems.filter((it) => it.category !== "Print");

    for (const opt of printSpeciesOptions) {
      const group = printItems.filter((it) => getPrintMeta(it, printSpeciesOptions).species === opt.value);
      if (group.length === 0) continue;
      sections.push({
        id: `species-${opt.value}`,
        title: opt.label,
        chipClass: getPrintSpeciesVisual(printSpeciesOptions, opt.value).badgeClass,
        items: group,
      });
    }

    if (otherItems.length > 0) {
      const goodies = otherItems.filter((it) => it.category === "Goodies");
      const plv = otherItems.filter((it) => it.category === "PLV");
      if (goodies.length > 0) {
        sections.push({
          id: "goodies",
          title: t("stock.boutique.category.goodies"),
          chipClass: CATEGORY_META.Goodies.chip,
          items: goodies,
        });
      }
      if (plv.length > 0) {
        sections.push({
          id: "plv",
          title: t("stock.boutique.category.plv"),
          chipClass: CATEGORY_META.PLV.chip,
          items: plv,
        });
      }
    }

    return sections.length > 0 ? sections : [{ id: "all", title: null, items: visibleItems }];
  }, [visibleItems, showSpeciesFilters, speciesFilter, printSpeciesOptions, t]);

  const openCreate = (category: InventoryCategory) => {
    setEditingItem(null);
    setAddMenuOpen(false);
    if (category === "Print") setPrintModalOpen(true);
    else if (category === "PLV") setPlvModalOpen(true);
    else setGoodiesModalOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setDetailItem(null);
    setEditingItem(item);
    if (item.category === "Print") setPrintModalOpen(true);
    else if (item.category === "PLV") setPlvModalOpen(true);
    else setGoodiesModalOpen(true);
  };

  const openReorder = (item: InventoryItem) => {
    setDetailItem(null);
    setReorderItem(item);
  };

  const handleSaveItem = async (draft: InventoryItemDraft) => {
    try {
      if (draft.id) {
        const { id, ...payload } = draft;
        await updateItem(id, payload);
        toastSuccess(t("stock.boutique.toast.itemUpdated"));
        return;
      }
      await createItem(draft);
      toastSuccess(t("stock.boutique.toast.itemCreated"));
    } catch (error) {
      toastError(getInventoryErrorMessage(error, t("stock.boutique.toast.saveItemError")));
    }
  };

  const handleSavePrintMany = async (drafts: InventoryItemDraft[]) => {
    try {
      for (const draft of drafts) await createItem(draft);
      toastSuccess(
        drafts.length > 1
          ? t("stock.boutique.toast.multipleItemsCreated", { count: drafts.length })
          : t("stock.boutique.toast.itemCreated"),
      );
    } catch (error) {
      toastError(getInventoryErrorMessage(error, t("stock.boutique.toast.saveItemsError")));
    }
  };

  const handleDeleteItem = async (item: InventoryItem) => {
    const confirmed = await confirm({
      title: t("stock.boutique.delete.title"),
      description: t("stock.boutique.delete.description", { name: item.name }),
      confirmLabel: t("common.delete"),
      variant: "destructive",
    });
    if (!confirmed) return;
    try {
      await deleteItem(item.id);
      toastSuccess(t("stock.boutique.toast.itemDeleted"));
      setPrintModalOpen(false);
      setGoodiesModalOpen(false);
      setPlvModalOpen(false);
      setEditingItem(null);
      setDetailItem(null);
    } catch (error) {
      toastError(getInventoryErrorMessage(error, t("stock.boutique.toast.deleteItemError")));
    }
  };

  const handleRecordMovement = async (
    item: InventoryItem,
    payload: { changeAmount: number; projectId: string | null; reason: string | null; userName: string },
  ) => {
    try {
      await recordMovement({
        itemId: item.id,
        changeAmount: payload.changeAmount,
        projectId: payload.projectId,
        reason: payload.reason,
        userName: payload.userName,
      });
      toastSuccess(
        payload.changeAmount > 0
          ? t("stock.boutique.toast.stockEntryRecorded")
          : t("stock.boutique.toast.stockExitRecorded"),
      );
    } catch (error) {
      toastError(getInventoryErrorMessage(error, t("stock.boutique.toast.movementError")));
    }
  };

  const handleSaveQuoteInfo = async (value: string) => {
    if (!reorderItem) return;
    try {
      await updateLastQuoteInfo(reorderItem.id, value);
      toastSuccess(t("stock.boutique.toast.infoSaved"));
    } catch (error) {
      toastError(getInventoryErrorMessage(error, t("stock.boutique.toast.infoSaveError")));
    }
  };

  const startMovement = (item: InventoryItem, mode: "add" | "remove") => {
    setDetailItem(null);
    setMovementItem(item);
    setMovementMode(mode);
  };

  const visualUploadFolder = (category: InventoryCategory): "print" | "goodies" | "plv" => {
    if (category === "Print") return "print";
    if (category === "PLV") return "plv";
    return "goodies";
  };

  const handleDetailPhotoUpload = async (file: File) => {
    if (!detail) return;
    const formatError = stockVisualFileError(file);
    if (formatError) {
      toastError(formatError);
      return;
    }
    setPhotoUploading(true);
    try {
      const { path, error } = await uploadStockVisual(file, visualUploadFolder(detail.category));
      if (error || !path) {
        toastError(error ? t("stock.boutique.toast.uploadFailedWithError", { error }) : t("stock.boutique.toast.uploadFailed"));
        return;
      }
      await updateItem(detail.id, {
        category: detail.category,
        itemType: detail.itemType,
        name: detail.name,
        quantity: detail.quantity,
        unitPrice: detail.unitPrice,
        alertThreshold: detail.alertThreshold,
        language: detail.language,
        visualUrl: path,
      });
      toastSuccess(isPdfFile(file) ? t("stock.boutique.toast.pdfSaved") : t("stock.boutique.toast.photoSaved"));
    } catch (err) {
      toastError(getInventoryErrorMessage(err, t("stock.boutique.toast.photoSaveError")));
    } finally {
      setPhotoUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const renderDetailPreview = (item: InventoryItem) => {
    const meta = CATEGORY_META[item.category];
    const Icon = meta.icon;
    const hasVisual = Boolean(item.visualUrl);
    const isPdf = hasVisual && isPdfUrl(item.visualUrl!);
    return (
      <div className={`relative w-full ${isPdf ? "h-72" : "h-56"}`}>
        <input
          ref={photoInputRef}
          type="file"
          accept={STOCK_VISUAL_ACCEPT}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleDetailPhotoUpload(file);
          }}
        />
        {hasVisual ? (
          <div className="relative h-full w-full overflow-hidden bg-white">
            <StockVisualPreview url={item.visualUrl!} name={item.name} mode="detail" className="h-full" />
            <button
              type="button"
              disabled={photoUploading}
              onClick={() => photoInputRef.current?.click()}
              className="ui-transition absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-[var(--foreground)]/55 py-2 text-xs font-semibold text-white hover:bg-[var(--foreground)]/70"
            >
              <Upload className="h-3.5 w-3.5" />
              {isPdf ? t("stock.boutique.visual.replacePdf") : t("stock.boutique.visual.changePhoto")}
            </button>
            {!isPdf ? (
              <button
                type="button"
                onClick={() => setLightbox({ url: item.visualUrl!, name: item.name })}
                className="ui-transition absolute bottom-10 left-3 rounded-lg border border-[var(--line)] bg-[var(--surface)]/90 px-2.5 py-1.5 text-[11px] font-semibold text-[color:var(--foreground)]/75 backdrop-blur hover:bg-[var(--surface)]"
              >
                {t("stock.boutique.actions.enlarge")}
              </button>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            disabled={photoUploading}
            onClick={() => photoInputRef.current?.click()}
            className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br ${meta.gradient}`}
            title={t("stock.boutique.visual.addVisualTitle")}
          >
            <Icon className="h-12 w-12 text-[color:var(--foreground)]/25" />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)]/90 px-3 py-1.5 text-xs font-semibold text-[color:var(--foreground)]/70 shadow-sm">
              <Upload className="h-3.5 w-3.5" />
              {t("stock.boutique.visual.imageOrPdf")}
            </span>
          </button>
        )}
        {photoUploading ? (
          <span className="absolute inset-0 flex items-center justify-center bg-[var(--surface)]/80">
            <Loader2 className="h-8 w-8 animate-spin text-[color:var(--foreground)]/50" />
          </span>
        ) : null}
      </div>
    );
  };

  const renderVisual = (item: InventoryItem, height: string) => {
    const meta = CATEGORY_META[item.category];
    const Icon = meta.icon;
    if (item.visualUrl) {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setLightbox({ url: item.visualUrl!, name: item.name });
          }}
          className={`group/vis relative ${height} w-full overflow-hidden bg-white`}
          title={isPdfUrl(item.visualUrl) ? t("stock.boutique.visual.openPdf") : t("stock.boutique.visual.enlargeVisual")}
        >
          <StockVisualPreview url={item.visualUrl} name={item.name} mode="thumb" />
        </button>
      );
    }
    return (
      <div className={`relative ${height} w-full bg-gradient-to-br ${meta.gradient}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="h-12 w-12 text-[color:var(--foreground)]/25" />
        </div>
      </div>
    );
  };

  const statusPill = (item: InventoryItem, compact = false) => {
    const low = isLowStock(item);
    return (
      <span
        className={[
          "inline-flex items-center gap-1 rounded-full border font-semibold",
          compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
          low
            ? "ui-pill ui-pill-danger"
            : "ui-pill ui-pill-success",
        ].join(" ")}
      >
        {low ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
        {low ? t("stock.boutique.status.reorder") : t("stock.boutique.status.inStock")}
      </span>
    );
  };

  const quickActions = (item: InventoryItem) => (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          startMovement(item, "add");
        }}
        className="ui-transition ui-btn ui-btn-outline-success inline-flex flex-1 items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
      >
        <Plus className="h-3.5 w-3.5" />
        {t("stock.boutique.actions.entry")}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          startMovement(item, "remove");
        }}
        className="ui-transition ui-btn ui-btn-outline-warning inline-flex flex-1 items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
      >
        <Minus className="h-3.5 w-3.5" />
        {t("stock.boutique.actions.exit")}
      </button>
    </div>
  );

  const renderCard = (item: InventoryItem) => {
    const meta = CATEGORY_META[item.category];
    const Icon = meta.icon;
    const gauge = stockGauge(item);
    const printMeta = item.category === "Print" ? getPrintMeta(item, printSpeciesOptions) : null;
    return (
      <article
        key={item.id}
        onClick={() => setDetailItem(item)}
        className="group ui-transition flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-lg"
      >
        <div className="relative">
          {renderVisual(item, "h-40")}
          <span
            className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.chip}`}
          >
            <Icon className="h-3 w-3" />
            {categoryLabel(item.category)}
          </span>
          {printMeta && printMeta.species !== "general" ? (
            <span
              className={`absolute bottom-3 left-3 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${printMeta.chipClass}`}
            >
              {printMeta.speciesLabel}
            </span>
          ) : null}
          {isLowStock(item) ? (
            <span className="absolute right-3 top-3">{statusPill(item, true)}</span>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="min-h-[2.5rem]">
            <h3 className="line-clamp-1 font-semibold text-[var(--foreground)]">{item.name}</h3>
            <p className="line-clamp-1 text-xs text-[color:var(--foreground)]/55">{itemSubtitle(item, printSpeciesOptions)}</p>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-semibold leading-none text-[var(--foreground)]">
                {formatNumber(item.quantity, intlLocale)}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[color:var(--foreground)]/45">
                {t("stock.boutique.card.inStock")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-[var(--foreground)]">{formatCurrency(item.unitPrice, intlLocale)}</p>
              <p className="mt-0.5 text-[11px] text-[color:var(--foreground)]/45">{t("stock.boutique.card.perUnit")}</p>
            </div>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-soft)]">
            <div className={`h-full rounded-full ${GAUGE_TONE[gauge.tone]}`} style={{ width: `${gauge.pct}%` }} />
          </div>

          {quickActions(item)}
        </div>
      </article>
    );
  };

  const renderRow = (item: InventoryItem) => {
    const meta = CATEGORY_META[item.category];
    const Icon = meta.icon;
    const printMeta = item.category === "Print" ? getPrintMeta(item, printSpeciesOptions) : null;
    return (
      <div
        key={item.id}
        onClick={() => setDetailItem(item)}
        className="group ui-transition flex cursor-pointer items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 hover:border-[var(--line-strong)] hover:shadow-sm"
      >
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[var(--line)]">
          {renderVisual(item, "h-16")}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.chip}`}>
              <Icon className="h-3 w-3" />
              {categoryLabel(item.category)}
            </span>
            {printMeta && printMeta.species !== "general" ? (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${printMeta.chipClass}`}
              >
                {printMeta.speciesLabel}
              </span>
            ) : null}
            {isLowStock(item) ? statusPill(item, true) : null}
          </div>
          <p className="mt-1 line-clamp-1 font-semibold text-[var(--foreground)]">{item.name}</p>
          <p className="line-clamp-1 text-xs text-[color:var(--foreground)]/55">{itemSubtitle(item, printSpeciesOptions)}</p>
        </div>
        <div className="hidden shrink-0 text-right sm:block">
          <p className="text-lg font-semibold text-[var(--foreground)]">{formatNumber(item.quantity, intlLocale)}</p>
          <p className="text-[11px] text-[color:var(--foreground)]/45">{t("stock.boutique.card.units")}</p>
        </div>
        <div className="hidden w-28 shrink-0 text-right md:block">
          <p className="text-sm font-semibold text-[var(--foreground)]">{formatCurrency(inventoryItemValue(item), intlLocale)}</p>
          <p className="text-[11px] text-[color:var(--foreground)]/45">{t("stock.boutique.card.value")}</p>
        </div>
        <div className="w-[180px] shrink-0" onClick={(e) => e.stopPropagation()}>
          {quickActions(item)}
        </div>
      </div>
    );
  };

  const renderCatalog = () => {
    if (displaySections.length === 1 && !displaySections[0]?.title) {
      const sectionItems = displaySections[0]?.items ?? [];
      if (viewMode === "grid") {
        return (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sectionItems.map(renderCard)}
          </div>
        );
      }
      return <div className="flex flex-col gap-2">{sectionItems.map(renderRow)}</div>;
    }

    return (
      <div className="space-y-8">
        {displaySections.map((section) => (
          <section key={section.id}>
            {section.title ? (
              <div className="mb-4 flex items-center gap-3">
                <span
                  className={[
                    "inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold",
                    section.chipClass ?? "border border-[var(--line)] bg-[var(--surface-soft)]",
                  ].join(" ")}
                >
                  {section.title}
                </span>
                <span className="text-sm text-[color:var(--foreground)]/50">
                  {t("stock.boutique.card.refsCount", { count: formatNumber(section.items.length, intlLocale) })}
                </span>
                <div className="h-px flex-1 bg-[var(--line)]" />
              </div>
            ) : null}
            {viewMode === "grid" ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {section.items.map(renderCard)}
              </div>
            ) : (
              <div className="flex flex-col gap-2">{section.items.map(renderRow)}</div>
            )}
          </section>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* En-tête + KPIs */}
      <div className="overflow-hidden rounded-[28px] border border-[var(--line)] bg-gradient-to-br from-[var(--surface)] to-[var(--surface-soft)]">
        <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--foreground)]/70">
              <Sparkles className="h-3.5 w-3.5" />
              {t("stock.boutique.badge")}
            </div>
            <h1 className="ui-heading mt-3 text-3xl font-semibold text-[var(--foreground)]">
              {t("stock.boutique.title")}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-[color:var(--foreground)]/60">
              {t("stock.boutique.subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground)]/45">
                <Wallet className="h-3.5 w-3.5" /> {t("stock.boutique.kpi.value")}
              </div>
              <p className="mt-1.5 text-xl font-semibold text-[var(--foreground)]">{formatCurrency(totalValue, intlLocale)}</p>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground)]/45">
                <Package className="h-3.5 w-3.5" /> {t("stock.boutique.kpi.refs")}
              </div>
              <p className="mt-1.5 text-xl font-semibold text-[var(--foreground)]">{formatNumber(items.length, intlLocale)}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setAlertOnly(true);
                setCategoryFilter("all");
              }}
              className={[
                "ui-transition rounded-2xl border px-4 py-3 text-left",
                alertCount > 0
                  ? "border-[color-mix(in_srgb,var(--danger)_22%,var(--line))] bg-[color-mix(in_srgb,var(--danger)_8%,var(--surface))] hover:bg-[color-mix(in_srgb,var(--danger)_14%,var(--surface))]"
                  : "border-[var(--line)] bg-[var(--surface)]",
              ].join(" ")}
            >
              <div
                className={[
                  "flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]",
                  alertCount > 0 ? "text-[var(--danger)]" : "text-[color:var(--foreground)]/45",
                ].join(" ")}
              >
                <AlertTriangle className="h-3.5 w-3.5" /> {t("stock.boutique.kpi.alerts")}
              </div>
              <p
                className={[
                  "mt-1.5 text-xl font-semibold",
                  alertCount > 0 ? "text-[var(--danger)]" : "text-[var(--foreground)]",
                ].join(" ")}
              >
                {formatNumber(alertCount, intlLocale)}
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Barre d'outils */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="flex min-w-[240px] flex-1 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2">
            <Search className="h-4 w-4 text-[color:var(--foreground)]/45" />
            <input
              type="text"
              placeholder={t("stock.boutique.search.placeholder")}
              aria-label={t("stock.boutique.search.ariaLabel")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ui-focus-ring w-full bg-transparent text-sm text-[var(--foreground)] placeholder:text-[color:var(--foreground)]/45 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadItems().catch(() => undefined)}
              className="ui-transition inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[color:var(--foreground)]/70 hover:bg-[var(--surface-soft)]"
              title={t("stock.boutique.toolbar.refresh")}
              aria-label={t("stock.boutique.toolbar.refresh")}
            >
              <RefreshCcw className="h-4 w-4" />
            </button>
            <div className="relative">
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                aria-label={t("stock.boutique.toolbar.sort")}
                className="ui-focus-ring h-10 appearance-none rounded-xl border border-[var(--line)] bg-[var(--surface)] pl-9 pr-8 text-sm font-medium text-[color:var(--foreground)]/80 hover:bg-[var(--surface-soft)]"
              >
                {sortOptions.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ArrowDownUp className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--foreground)]/45" />
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--foreground)]/45" />
            </div>
            <div className="flex items-center rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={[
                  "ui-transition inline-flex h-8 w-8 items-center justify-center rounded-lg",
                  viewMode === "grid"
                    ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                    : "text-[color:var(--foreground)]/55 hover:bg-[var(--surface-soft)]",
                ].join(" ")}
                title={t("stock.boutique.toolbar.viewGrid")}
                aria-label={t("stock.boutique.toolbar.viewGrid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={[
                  "ui-transition inline-flex h-8 w-8 items-center justify-center rounded-lg",
                  viewMode === "list"
                    ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                    : "text-[color:var(--foreground)]/55 hover:bg-[var(--surface-soft)]",
                ].join(" ")}
                title={t("stock.boutique.toolbar.viewList")}
                aria-label={t("stock.boutique.toolbar.viewList")}
              >
                <Rows3 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`${basePath}/history`}
            className="ui-transition inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[color:var(--foreground)]/75 hover:bg-[var(--surface-soft)]"
          >
            <ClipboardList className="h-4 w-4" />
            {t("stock.boutique.toolbar.history")}
          </Link>
          <Link
            href={`${basePath}/dashboard`}
            className="ui-transition inline-flex items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[color:var(--foreground)]/75 hover:bg-[var(--surface-soft)]"
          >
            <BarChart3 className="h-4 w-4" />
            {t("stock.boutique.toolbar.dashboard")}
          </Link>
          <div className="relative">
            <button
              type="button"
              onClick={() => setAddMenuOpen((v) => !v)}
              className="ui-transition inline-flex items-center gap-1.5 rounded-xl bg-[var(--foreground)] px-3.5 py-2 text-sm font-semibold text-[var(--accent-contrast)] shadow-sm hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              {t("stock.boutique.toolbar.add")}
              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </button>
            {addMenuOpen ? (
              <>
                <button
                  type="button"
                  aria-hidden
                  tabIndex={-1}
                  className="fixed inset-0 z-[60] cursor-default"
                  onClick={() => setAddMenuOpen(false)}
                />
                <div className="absolute right-0 z-[61] mt-2 w-56 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-1.5 shadow-xl">
                  {inventoryCategories.map((cat) => {
                    const meta = CATEGORY_META[cat];
                    const Icon = meta.icon;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => openCreate(cat)}
                        className="ui-transition flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-[color:var(--foreground)]/80 hover:bg-[var(--surface-soft)]"
                      >
                        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${meta.chip}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        {cat === "Print"
                          ? t("stock.boutique.addMenu.printDocument")
                          : cat === "PLV"
                            ? t("stock.boutique.addMenu.plvSupport")
                            : t("stock.boutique.category.goodies")}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Puces de catégorie + filtre alertes */}
      <div className="flex flex-wrap items-center gap-2">
        {(["all", ...inventoryCategories] as CategoryFilter[]).map((cat) => {
          const active = categoryFilter === cat;
          const label = cat === "all" ? t("stock.boutique.filters.all") : categoryLabel(cat as InventoryCategory);
          return (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setCategoryFilter(cat);
                if (cat !== "all" && cat !== "Print") setSpeciesFilter("all");
              }}
              className={[
                "ui-transition inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold",
                active
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]"
                  : "border-[var(--line)] bg-[var(--surface)] text-[color:var(--foreground)]/70 hover:bg-[var(--surface-soft)]",
              ].join(" ")}
            >
              {label}
              <span
                className={[
                  "rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                  active ? "bg-white/25" : "bg-[var(--surface-soft)] text-[color:var(--foreground)]/60",
                ].join(" ")}
              >
                {formatNumber(categoryCounts[cat], intlLocale)}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setAlertOnly((v) => !v)}
          className={[
            "ui-transition inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold",
            alertOnly
              ? "ui-pill ui-pill-danger border-transparent"
              : "border-[var(--line)] bg-[var(--surface)] text-[color:var(--foreground)]/70 hover:bg-[var(--surface-soft)]",
          ].join(" ")}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          {t("stock.boutique.filters.alertsOnly")}
        </button>
      </div>

      {showSpeciesFilters && speciesCounts.all > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)]/60 p-3">
          <span className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--foreground)]/45">
            {t("stock.boutique.filters.species")}
          </span>
          {(["all", ...printSpeciesOptions.map((o) => o.value)] as SpeciesFilter[]).map((sp) => {
            const active = speciesFilter === sp;
            const label = sp === "all" ? t("stock.boutique.filters.allSpecies") : printSpeciesLabel(printSpeciesOptions, sp);
            const count = speciesCounts[sp];
            const speciesChip =
              sp === "all" ? "" : getPrintSpeciesVisual(printSpeciesOptions, sp).badgeClass;
            if (sp !== "all" && count === 0) return null;
            return (
              <button
                key={sp}
                type="button"
                onClick={() => setSpeciesFilter(sp)}
                className={[
                  "ui-transition inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold",
                  active
                    ? sp === "all"
                      ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]"
                      : `border-transparent ${speciesChip} ring-2 ring-[var(--accent)]/30`
                    : sp === "all"
                      ? "border-[var(--line)] bg-[var(--surface)] text-[color:var(--foreground)]/70 hover:bg-[var(--surface-soft)]"
                      : `border-transparent ${speciesChip} opacity-80 hover:opacity-100`,
                ].join(" ")}
              >
                {label}
                <span
                  className={[
                    "rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                    active && sp === "all" ? "bg-white/25" : "bg-black/5",
                  ].join(" ")}
                >
                  {formatNumber(count, intlLocale)}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Contenu */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)]"
            />
          ))}
        </div>
      ) : visibleItems.length === 0 ? (
        <EmptyState
          icon={Package}
          title={
            searchQuery || alertOnly || categoryFilter !== "all" || speciesFilter !== "all"
              ? t("emptyStates.stockBoutiqueFiltered.title")
              : t("emptyStates.stockBoutique.title")
          }
          description={
            searchQuery || alertOnly || categoryFilter !== "all" || speciesFilter !== "all"
              ? t("emptyStates.stockBoutiqueFiltered.body")
              : t("emptyStates.stockBoutique.body")
          }
          actionLabel={
            searchQuery || alertOnly || categoryFilter !== "all" || speciesFilter !== "all"
              ? undefined
              : t("emptyStates.stockBoutique.cta")
          }
          onAction={
            searchQuery || alertOnly || categoryFilter !== "all" || speciesFilter !== "all"
              ? undefined
              : () => setAddMenuOpen(true)
          }
        />
      ) : (
        renderCatalog()
      )}

      {/* Panneau de détail (slide-over) */}
      {detail ? (
        <div className="fixed inset-0 z-[130]" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label={t("stock.boutique.close")}
            className="absolute inset-0 bg-[var(--foreground)]/30 backdrop-blur-sm"
            onClick={() => setDetailItem(null)}
          />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-y-auto bg-[var(--surface)] shadow-2xl">
            <div className="relative">
              {renderDetailPreview(detail)}
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="ui-transition absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)]/90 text-[color:var(--foreground)]/70 backdrop-blur hover:bg-[var(--surface)]"
                aria-label={t("stock.boutique.close")}
              >
                <X className="h-4 w-4" />
              </button>
              <span
                className={`absolute left-4 top-4 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${CATEGORY_META[detail.category].chip}`}
              >
                {categoryLabel(detail.category)}
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-5 p-5">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-xl font-semibold text-[var(--foreground)]">{detail.name}</h2>
                  {statusPill(detail)}
                </div>
                <p className="mt-1 text-sm text-[color:var(--foreground)]/60">{itemSubtitle(detail, printSpeciesOptions)}</p>
                {detail.category === "Print" ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getPrintMeta(detail, printSpeciesOptions).chipClass}`}
                    >
                      {getPrintMeta(detail, printSpeciesOptions).speciesLabel}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-[var(--line)] bg-[var(--surface-soft)] px-2.5 py-1 text-xs font-medium text-[color:var(--foreground)]/70">
                      {getPrintMeta(detail, printSpeciesOptions).docType}
                    </span>
                    {detail.language ? (
                      <span className="inline-flex items-center rounded-full border border-[var(--line)] bg-[var(--surface-soft)] px-2.5 py-1 text-xs font-medium text-[color:var(--foreground)]/70">
                        {detail.language}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground)]/45">
                    {t("stock.boutique.detail.quantity")}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
                    {formatNumber(detail.quantity, intlLocale)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground)]/45">
                    {t("stock.boutique.detail.totalValue")}
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
                    {formatCurrency(inventoryItemValue(detail), intlLocale)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--line)] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground)]/45">
                    {t("stock.boutique.detail.unitPrice")}
                  </p>
                  <p className="mt-1 text-base font-semibold text-[var(--foreground)]">
                    {formatCurrency(detail.unitPrice, intlLocale)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--line)] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground)]/45">
                    {t("stock.boutique.detail.alertThreshold")}
                  </p>
                  <p className="mt-1 text-base font-semibold text-[var(--foreground)]">
                    {formatNumber(detail.alertThreshold, intlLocale)}
                  </p>
                </div>
              </div>

              {detail.lastQuoteInfo ? (
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--foreground)]/45">
                    {t("stock.boutique.detail.lastQuote")}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--foreground)]/75">{detail.lastQuoteInfo}</p>
                </div>
              ) : null}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => startMovement(detail, "add")}
                  className="ui-transition ui-btn ui-btn-outline-success inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold"
                >
                  <Plus className="h-4 w-4" />
                  {t("stock.boutique.actions.entry")}
                </button>
                <button
                  type="button"
                  onClick={() => startMovement(detail, "remove")}
                  className="ui-transition ui-btn ui-btn-outline-warning inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold"
                >
                  <Minus className="h-4 w-4" />
                  {t("stock.boutique.actions.exit")}
                </button>
              </div>

              <div className="mt-auto flex items-center gap-2 border-t border-[var(--line)] pt-4">
                <button
                  type="button"
                  onClick={() => openEdit(detail)}
                  className="ui-transition inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2.5 text-sm font-semibold text-[color:var(--foreground)]/75 hover:bg-[var(--surface)]"
                >
                  <Pencil className="h-4 w-4" />
                  {t("stock.boutique.actions.edit")}
                </button>
                <button
                  type="button"
                  onClick={() => openReorder(detail)}
                  className="ui-transition inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2.5 text-sm font-semibold text-[color:var(--foreground)]/75 hover:bg-[var(--surface)]"
                >
                  {t("stock.boutique.actions.quoteInfo")}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeleteItem(detail)}
                  className="ui-transition ui-btn ui-btn-outline-danger inline-flex items-center justify-center gap-1 rounded-xl px-3 py-2.5 text-sm font-semibold"
                  aria-label={t("stock.boutique.actions.delete")}
                  title={t("stock.boutique.actions.delete")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Lightbox visuel */}
      {lightbox ? (
        <div
          className="fixed inset-0 z-[140] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && setLightbox(null)}
        >
          <div className="relative max-h-[92vh] w-full max-w-5xl rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3">
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="ui-transition absolute right-3 top-3 z-10 rounded-lg border border-[var(--line)] bg-[var(--surface-soft)] p-2 text-[color:var(--foreground)]/70 hover:bg-[var(--surface)]"
              aria-label={t("stock.boutique.visual.closeVisual")}
            >
              <X className="h-4 w-4" />
            </button>
            <p className="mb-2 text-sm font-semibold text-[var(--foreground)]">{lightbox.name}</p>
            <div className="max-h-[80vh] overflow-hidden rounded-xl border border-[var(--line)] bg-white">
              <StockVisualPreview url={lightbox.url} name={lightbox.name} mode="full" />
            </div>
          </div>
        </div>
      ) : null}

      {/* Modales de création / édition */}
      <InventoryPrintModal
        open={printModalOpen}
        initialItem={editingItem?.category === "Print" ? editingItem : null}
        allItems={items}
        onClose={() => {
          setPrintModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleSaveItem}
        onSubmitMany={handleSavePrintMany}
        onDelete={handleDeleteItem}
      />
      <InventoryGoodiesModal
        open={goodiesModalOpen}
        initialItem={editingItem?.category === "Goodies" ? editingItem : null}
        onClose={() => {
          setGoodiesModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleSaveItem}
        onDelete={handleDeleteItem}
      />
      <InventoryPlvModal
        open={plvModalOpen}
        initialItem={editingItem?.category === "PLV" ? editingItem : null}
        allItems={items}
        onClose={() => {
          setPlvModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleSaveItem}
        onDelete={handleDeleteItem}
      />
      <InventoryReorderModal
        open={Boolean(reorderItem)}
        item={reorderItem}
        onClose={() => setReorderItem(null)}
        onSubmit={handleSaveQuoteInfo}
      />
      <StockMovementModal
        open={Boolean(movementItem)}
        item={movementItem}
        mode={movementMode}
        projects={projects}
        defaultUserName={currentUser?.teamMemberName ?? currentUser?.displayName ?? null}
        onClose={() => setMovementItem(null)}
        onSubmit={async (payload) => {
          if (!movementItem) return;
          await handleRecordMovement(movementItem, payload);
        }}
      />
    </div>
  );
}
