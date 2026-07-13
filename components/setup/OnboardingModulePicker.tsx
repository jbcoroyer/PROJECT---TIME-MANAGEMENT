"use client";

import { useMemo, useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import ModuleToggle from "../modules/ModuleToggle";
import { ModuleIllustrationStage } from "../modules/ModuleIllustration";
import {
  ALL_MODULE_IDS,
  DEFAULT_ONBOARDING_MODULES,
  getModulesByCategory,
  MODULE_CATEGORY_ORDER,
  MODULE_REGISTRY,
  toggleModule,
  type AppModuleId,
  type ModuleCategory,
} from "../../lib/modules";
import { useTranslation } from "../../lib/i18n/useTranslation";
import "./setup-onboarding.css";

type OnboardingModulePickerProps = {
  value: AppModuleId[];
  onChange: (modules: AppModuleId[]) => void;
};

export default function OnboardingModulePicker({ value, onChange }: OnboardingModulePickerProps) {
  const { t } = useTranslation({ preferBrowser: true });
  const grouped = getModulesByCategory();
  const [category, setCategory] = useState<ModuleCategory>("pilotage");
  const [focused, setFocused] = useState<AppModuleId>("dashboard");

  const modulesInCategory = grouped[category];
  const focusedActive = value.includes(focused);
  const progress = value.length / ALL_MODULE_IDS.length;

  const ringOffset = useMemo(() => {
    const circumference = 2 * Math.PI * 14;
    return circumference * (1 - progress);
  }, [progress]);

  return (
    <div className="ob-picker">
      <div className="ob-picker__toolbar">
        <div className="ob-picker__summary">
          <div className="ob-counter__ring" aria-hidden>
            <svg viewBox="0 0 36 36">
              <circle className="ob-counter__ring-bg" cx="18" cy="18" r="14" />
              <circle
                className="ob-counter__ring-fg"
                cx="18"
                cy="18"
                r="14"
                strokeDasharray={2 * Math.PI * 14}
                strokeDashoffset={ringOffset}
              />
            </svg>
            <span className="ob-counter__value">{value.length}</span>
          </div>
          <div className="min-w-0">
            <p className="ob-picker__title">{t("setup.step3HeroTitle")}</p>
            <p className="ob-picker__subtitle">{t("modules.selectedCount", { count: value.length })}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange([...DEFAULT_ONBOARDING_MODULES])}
          className="ob-picker__reset"
        >
          <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">{t("modules.resetRecommended")}</span>
        </button>
      </div>

      <nav className="ob-tabs" aria-label={t("setup.step3Title")}>
        {MODULE_CATEGORY_ORDER.map((cat) => {
          const count = grouped[cat].filter((m) => value.includes(m.id)).length;
          const total = grouped[cat].length;
          return (
            <button
              key={cat}
              type="button"
              className={["ob-tab", category === cat ? "ob-tab--active" : ""].join(" ")}
              onClick={() => {
                setCategory(cat);
                const first = grouped[cat][0];
                if (first) setFocused(first.id);
              }}
            >
              {t(`modules.categories.${cat}`)}
              {count > 0 ? ` · ${count}/${total}` : ""}
            </button>
          );
        })}
      </nav>

      <ModuleDetailCard
        moduleId={focused}
        active={focusedActive}
        onToggle={() => onChange(toggleModule(value, focused, !focusedActive))}
      />

      <ul className="ob-module-list" role="listbox" aria-label={t("setup.step3Title")}>
        {modulesInCategory.map((mod) => {
          const active = value.includes(mod.id);
          const isFocused = focused === mod.id;
          const name = t(`modules.${mod.id}.name`);

          return (
            <li key={mod.id} role="presentation">
              <div
                className={[
                  "ob-module-row",
                  active ? "ob-module-row--active" : "",
                  isFocused ? "ob-module-row--focused" : "",
                ].join(" ")}
              >
                <button
                  type="button"
                  className="ob-module-row__main"
                  role="option"
                  aria-selected={isFocused}
                  onClick={() => setFocused(mod.id)}
                >
                  <span className="ob-module-row__icon">
                    <ModuleIllustrationStage moduleId={mod.id} active={active} size="sm" />
                  </span>
                  <span className="ob-module-row__text">
                    <span className="ob-module-row__name">{name}</span>
                    {mod.recommended ? (
                      <span className="ob-module-row__badge">{t("modules.recommended")}</span>
                    ) : (
                      <span className="ob-module-row__tagline">{t(`modules.${mod.id}.tagline`)}</span>
                    )}
                  </span>
                </button>
                <ModuleToggle
                  active={active}
                  label={t(active ? "modules.deactivate" : "modules.activate", { name })}
                  onChange={(next) => onChange(toggleModule(value, mod.id, next))}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ModuleDetailCard({
  moduleId,
  active,
  onToggle,
}: {
  moduleId: AppModuleId;
  active: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation({ preferBrowser: true });
  const mod = MODULE_REGISTRY[moduleId];
  const name = t(`modules.${moduleId}.name`);

  return (
    <article className="ob-detail" key={moduleId}>
      <div className="ob-detail__illus ob-detail-enter">
        <ModuleIllustrationStage moduleId={moduleId} active={active} size="lg" />
      </div>
      <div className="ob-detail__body">
        <div className="ob-detail__head">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="ob-detail__title">{name}</h3>
              {mod.recommended ? (
                <span className="ob-detail__recommended">{t("modules.recommended")}</span>
              ) : null}
            </div>
            <p className="ob-detail__tagline">{t(`modules.${moduleId}.tagline`)}</p>
          </div>
          <ModuleToggle
            active={active}
            label={t(active ? "modules.deactivate" : "modules.activate", { name })}
            onChange={() => onToggle()}
          />
        </div>
        <p className="ob-detail__desc">{t(`modules.${moduleId}.description`)}</p>
        <ul className="ob-highlights ob-highlights--inline">
          {(["h1", "h2", "h3"] as const).map((key) => (
            <li key={key} className="ob-highlights__item">
              <Check className="ob-highlights__icon" aria-hidden />
              <span>{t(`modules.${moduleId}.highlights.${key}`)}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
