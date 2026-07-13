"use client";

import ModuleGlyph from "../modules/ModuleGlyph";
import {
  DEFAULT_ONBOARDING_MODULES,
  MODULE_DISPLAY_ORDER,
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

  return (
    <div className="ob-grid-picker">
      <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
        {t("setup.step3Intro")}
      </p>
      <div className="ob-grid-picker__grid">
        {MODULE_DISPLAY_ORDER.map((moduleId) => {
          const selected = value.includes(moduleId);
          const mod = MODULE_REGISTRY[moduleId];
          const name = t(`modules.${moduleId}.name`);

          return (
            <button
              key={moduleId}
              type="button"
              onClick={() => onChange(toggleModule(value, moduleId, !selected))}
              className={[
                "ob-grid-picker__card",
                selected ? "ob-grid-picker__card--selected" : "",
              ].join(" ")}
              aria-pressed={selected}
            >
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
              {mod.recommended ? (
                <span className="ob-grid-picker__recommended">{t("modules.recommended")}</span>
              ) : null}
            </button>
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
    </div>
  );
}
