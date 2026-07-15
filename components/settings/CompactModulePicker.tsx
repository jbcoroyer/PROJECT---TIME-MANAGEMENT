"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, RotateCcw, Search, X } from "lucide-react";
import ModuleGlyph from "../modules/ModuleGlyph";
import {
  DEFAULT_ONBOARDING_MODULES,
  getModulesByCategory,
  MODULE_CATEGORY_ORDER,
  MODULE_REGISTRY,
  toggleModule,
  type AppModuleId,
} from "../../lib/modules";
import { useTranslation } from "../../lib/i18n/useTranslation";

type CompactModulePickerProps = {
  value: AppModuleId[];
  onChange: (modules: AppModuleId[]) => void;
  maxModules?: number | null;
  onLimitError?: () => void;
  onMinOneError?: () => void;
};

export default function CompactModulePicker({
  value,
  onChange,
  maxModules = null,
  onLimitError,
  onMinOneError,
}: CompactModulePickerProps) {
  const { t } = useTranslation({ preferBrowser: true });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");

  const availableToAdd = useMemo(() => {
    const grouped = getModulesByCategory();
    const inactive: AppModuleId[] = [];
    for (const category of MODULE_CATEGORY_ORDER) {
      for (const mod of grouped[category]) {
        if (!value.includes(mod.id)) inactive.push(mod.id);
      }
    }
    return inactive;
  }, [value]);

  const filteredAvailable = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return availableToAdd;
    return availableToAdd.filter((id) => {
      const name = t(`modules.${id}.name`).toLowerCase();
      const tagline = t(`modules.${id}.tagline`).toLowerCase();
      return name.includes(q) || tagline.includes(q) || id.includes(q);
    });
  }, [availableToAdd, query, t]);

  useEffect(() => {
    if (!pickerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPickerOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [pickerOpen]);

  function tryAdd(moduleId: AppModuleId) {
    if (value.includes(moduleId)) return;
    const next = toggleModule(value, moduleId, true);
    if (maxModules !== null && next.length > maxModules) {
      onLimitError?.();
      return;
    }
    onChange(next);
    setQuery("");
  }

  function tryRemove(moduleId: AppModuleId) {
    if (value.length <= 1) {
      onMinOneError?.();
      return;
    }
    onChange(toggleModule(value, moduleId, false));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[color:var(--foreground)]/60">
          {t("modules.selectedCount", { count: value.length })}
        </p>
        <button
          type="button"
          onClick={() => onChange([...DEFAULT_ONBOARDING_MODULES])}
          className="ui-transition inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[color:var(--foreground)]/75 hover:bg-[var(--surface-soft)]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {t("modules.resetRecommended")}
        </button>
      </div>

      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {value.map((moduleId) => {
            const mod = MODULE_REGISTRY[moduleId];
            const name = t(`modules.${moduleId}.name`);
            return (
              <li
                key={moduleId}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] py-1.5 pl-2 pr-1.5"
              >
                <ModuleGlyph moduleId={moduleId} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--foreground)]">{name}</p>
                  <p className="truncate text-[10px] text-[color:var(--foreground)]/50">
                    {t(`modules.categories.${mod.category}`)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => tryRemove(moduleId)}
                  aria-label={t("modules.deactivate", { name })}
                  className="ui-transition ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[color:var(--foreground)]/45 hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-[var(--line)] px-4 py-6 text-center text-sm text-[color:var(--foreground)]/55">
          Aucun module activé.
        </p>
      )}

      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        disabled={availableToAdd.length === 0}
        className="ui-transition inline-flex items-center gap-2 rounded-xl border border-[color:var(--brand-primary)]/25 bg-[color:var(--brand-primary)]/8 px-4 py-2.5 text-sm font-semibold text-[var(--brand-primary)] hover:bg-[color:var(--brand-primary)]/12 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus className="h-4 w-4" />
        Ajouter un module
        {availableToAdd.length > 0 ? (
          <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 text-[10px] font-bold text-[color:var(--foreground)]/55">
            {availableToAdd.length}
          </span>
        ) : null}
      </button>

      {pickerOpen ? (
        <div
          className="fixed inset-0 z-[180] flex items-end justify-center bg-slate-950/45 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="module-picker-title"
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="flex max-h-[min(85vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
              <div>
                <h3 id="module-picker-title" className="text-lg font-semibold text-[var(--foreground)]">
                  Choisir un module
                </h3>
                <p className="mt-0.5 text-sm text-[color:var(--foreground)]/60">
                  Seuls les modules disponibles sont listés ici.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="ui-transition flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--line)] text-[color:var(--foreground)]/60 hover:bg-[var(--surface-soft)]"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="border-b border-[var(--line)] px-5 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--foreground)]/35" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher un module…"
                  className="ui-focus-ring w-full rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] py-2.5 pl-10 pr-4 text-sm"
                  autoFocus
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
              {filteredAvailable.length === 0 ? (
                <p className="px-2 py-8 text-center text-sm text-[color:var(--foreground)]/55">
                  {availableToAdd.length === 0
                    ? "Tous les modules sont déjà activés."
                    : "Aucun module ne correspond à votre recherche."}
                </p>
              ) : (
                <div className="space-y-4">
                  {MODULE_CATEGORY_ORDER.map((category) => {
                    const ids = filteredAvailable.filter((id) => MODULE_REGISTRY[id].category === category);
                    if (ids.length === 0) return null;
                    return (
                      <section key={category}>
                        <h4 className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--foreground)]/45">
                          {t(`modules.categories.${category}`)}
                        </h4>
                        <ul className="space-y-1">
                          {ids.map((moduleId) => {
                            const mod = MODULE_REGISTRY[moduleId];
                            const name = t(`modules.${moduleId}.name`);
                            return (
                              <li key={moduleId}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const isLastAvailable = availableToAdd.length === 1;
                                    tryAdd(moduleId);
                                    if (isLastAvailable) setPickerOpen(false);
                                  }}
                                  className="ui-transition flex w-full items-center gap-3 rounded-xl border border-transparent px-2 py-2.5 text-left hover:border-[var(--line)] hover:bg-[var(--surface-soft)]"
                                >
                                  <ModuleGlyph moduleId={moduleId} size="md" />
                                  <span className="min-w-0 flex-1">
                                    <span className="flex flex-wrap items-center gap-1.5">
                                      <span className="text-sm font-semibold text-[var(--foreground)]">{name}</span>
                                      {mod.recommended ? (
                                        <span className="rounded bg-[var(--accent-soft)] px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-[var(--accent-strong)]">
                                          {t("modules.recommended")}
                                        </span>
                                      ) : null}
                                    </span>
                                    <span className="mt-0.5 block text-xs text-[color:var(--foreground)]/55 line-clamp-1">
                                      {t(`modules.${moduleId}.tagline`)}
                                    </span>
                                  </span>
                                  <Plus className="h-4 w-4 shrink-0 text-[var(--brand-primary)]" />
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </section>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
