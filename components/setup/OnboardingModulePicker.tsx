"use client";

import { useEffect, useState } from "react";
import { Check, Info, X } from "lucide-react";
import ModuleGlyph from "../modules/ModuleGlyph";
import {
  DEFAULT_ONBOARDING_MODULES,
  getCommerciallyAvailableModules,
  MODULE_REGISTRY,
  toggleModule,
  type AppModuleId,
} from "../../lib/modules";
import { useTranslation } from "../../lib/i18n/useTranslation";
import "./setup-onboarding.css";

type OnboardingModulePickerProps = {
  value: AppModuleId[];
  onChange: (modules: AppModuleId[]) => void;
};

export default function OnboardingModulePicker({ value, onChange }: OnboardingModulePickerProps) {
  const { t } = useTranslation({ preferBrowser: true });
  const [detailModuleId, setDetailModuleId] = useState<AppModuleId | null>(null);

  useEffect(() => {
    if (!detailModuleId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDetailModuleId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [detailModuleId]);

  return (
    <div className="ob-grid-picker">
      <p className="text-sm leading-relaxed text-[var(--ink-muted)]">{t("setup.step3Intro")}</p>
      <div className="ob-grid-picker__grid">
        {getCommerciallyAvailableModules().map((moduleId) => {
          const selected = value.includes(moduleId);
          const mod = MODULE_REGISTRY[moduleId];
          const name = t(`modules.${moduleId}.name`);

          return (
            <div
              key={moduleId}
              role="button"
              tabIndex={0}
              aria-pressed={selected}
              onClick={() => onChange(toggleModule(value, moduleId, !selected))}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onChange(toggleModule(value, moduleId, !selected));
                }
              }}
              className={[
                "ob-grid-picker__card",
                selected ? "ob-grid-picker__card--selected" : "",
              ].join(" ")}
            >
              <button
                type="button"
                className="ob-grid-picker__info"
                aria-label={t("modules.learnMoreAria", { name })}
                onClick={(event) => {
                  event.stopPropagation();
                  setDetailModuleId(moduleId);
                }}
              >
                <Info className="h-3.5 w-3.5" aria-hidden />
              </button>

              <span
                className={[
                  "ob-grid-picker__check",
                  selected ? "ob-grid-picker__check--on" : "",
                ].join(" ")}
                aria-hidden
              >
                {selected ? <span className="ob-grid-picker__check-mark" /> : null}
              </span>

              <ModuleGlyph moduleId={moduleId} size="lg" />
              <p className="ob-grid-picker__name">{name}</p>
              <p className="ob-grid-picker__tagline">{t(`modules.${moduleId}.tagline`)}</p>
              <p className="ob-grid-picker__description">{t(`modules.${moduleId}.description`)}</p>
              {mod.recommended ? (
                <span className="ob-grid-picker__recommended">{t("modules.recommended")}</span>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="ob-grid-picker__footer">
        <button
          type="button"
          onClick={() => onChange([...DEFAULT_ONBOARDING_MODULES])}
          className="text-[13.5px] font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)]"
        >
          {t("modules.resetRecommended")}
        </button>
        <span className="text-xs text-[var(--ink-muted)]">
          {t("modules.selectedCount", { count: value.length })}
        </span>
      </div>

      {detailModuleId ? (
        <ModuleDetailDialog
          moduleId={detailModuleId}
          selected={value.includes(detailModuleId)}
          onClose={() => setDetailModuleId(null)}
          onToggle={() => onChange(toggleModule(value, detailModuleId, !value.includes(detailModuleId)))}
        />
      ) : null}
    </div>
  );
}

function ModuleDetailDialog({
  moduleId,
  selected,
  onClose,
  onToggle,
}: {
  moduleId: AppModuleId;
  selected: boolean;
  onClose: () => void;
  onToggle: () => void;
}) {
  const { t } = useTranslation({ preferBrowser: true });
  const mod = MODULE_REGISTRY[moduleId];
  const name = t(`modules.${moduleId}.name`);

  return (
    <div
      className="ob-module-detail"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ob-module-detail-title"
      onClick={onClose}
    >
      <div className="ob-module-detail__panel" onClick={(event) => event.stopPropagation()}>
        <div className="ob-module-detail__header">
          <div className="ob-module-detail__identity">
            <ModuleGlyph moduleId={moduleId} size="md" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 id="ob-module-detail-title" className="ob-module-detail__title">
                  {name}
                </h3>
                {mod.recommended ? (
                  <span className="ob-grid-picker__recommended">{t("modules.recommended")}</span>
                ) : null}
              </div>
              <p className="ob-module-detail__tagline">{t(`modules.${moduleId}.tagline`)}</p>
            </div>
          </div>
          <button
            type="button"
            className="ob-module-detail__close"
            onClick={onClose}
            aria-label={t("modules.closeDetail")}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <p className="ob-module-detail__description">{t(`modules.${moduleId}.description`)}</p>

        <div className="ob-module-detail__highlights">
          <p className="ob-module-detail__highlights-label">{t("modules.learnMore")}</p>
          <ul className="ob-module-detail__highlights-list">
            {(["h1", "h2", "h3"] as const).map((key) => (
              <li key={key} className="ob-module-detail__highlight">
                <Check className="ob-module-detail__highlight-icon" aria-hidden />
                <span>{t(`modules.${moduleId}.highlights.${key}`)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="ob-module-detail__actions">
          <button type="button" className="ui-btn ui-btn-ghost" onClick={onClose}>
            {t("common.cancel")}
          </button>
          <button type="button" className="ui-btn ui-btn-primary" onClick={onToggle}>
            {t(selected ? "modules.deactivate" : "modules.activate", { name })}
          </button>
        </div>
      </div>
    </div>
  );
}
