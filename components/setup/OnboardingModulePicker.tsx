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
  const focusedMod = MODULE_REGISTRY[focused];
  const focusedActive = value.includes(focused);
  const progress = value.length / ALL_MODULE_IDS.length;

  const ringOffset = useMemo(() => {
    const circumference = 2 * Math.PI * 14;
    return circumference * (1 - progress);
  }, [progress]);

  return (
    <div className="space-y-5">
      <div className="ob-counter">
        <div className="flex items-center gap-3">
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
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">{t("setup.step3HeroTitle")}</p>
            <p className="mt-0.5 text-xs text-[color:var(--foreground)]/55">
              {t("modules.selectedCount", { count: value.length })}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange([...DEFAULT_ONBOARDING_MODULES])}
          className="ui-transition inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[color:var(--foreground)]/70 hover:bg-[var(--surface-soft)]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {t("modules.resetRecommended")}
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

      <div className="ob-showcase">
        <SpotlightPanel
          moduleId={focused}
          active={focusedActive}
          onToggle={() => onChange(toggleModule(value, focused, !focusedActive))}
        />

        <div className="ob-tiles">
          {modulesInCategory.map((mod) => {
            const active = value.includes(mod.id);
            const isFocused = focused === mod.id;
            return (
              <button
                key={mod.id}
                type="button"
                className={[
                  "ob-tile",
                  active ? "ob-tile--active" : "",
                  isFocused ? "ob-tile--focused" : "",
                ].join(" ")}
                onMouseEnter={() => setFocused(mod.id)}
                onFocus={() => setFocused(mod.id)}
                onClick={() => onChange(toggleModule(value, mod.id, !active))}
              >
                <div className="ob-tile__icon">
                  <ModuleIllustrationStage moduleId={mod.id} active={active} size="sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="ob-tile__name">{t(`modules.${mod.id}.name`)}</p>
                  {mod.recommended ? (
                    <p className="ob-tile__badge">{t("modules.recommended")}</p>
                  ) : (
                    <p className="mt-0.5 truncate text-[11px] text-[color:var(--foreground)]/45">
                      {t(`modules.${mod.id}.tagline`)}
                    </p>
                  )}
                </div>
                <ModuleToggle
                  active={active}
                  label={t(active ? "modules.deactivate" : "modules.activate", {
                    name: t(`modules.${mod.id}.name`),
                  })}
                  onChange={(next) => onChange(toggleModule(value, mod.id, next))}
                />
              </button>
            );
          })}
        </div>
      </div>

      {focusedMod ? (
        <ul className="grid gap-2 sm:grid-cols-3">
          {(["h1", "h2", "h3"] as const).map((key) => (
            <li
              key={key}
              className="flex items-start gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)]/50 px-3 py-2.5 text-xs leading-relaxed text-[color:var(--foreground)]/72"
            >
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--brand-primary)]" />
              <span>{t(`modules.${focused}.highlights.${key}`)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function SpotlightPanel({
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
    <div className="ob-spotlight" key={moduleId}>
      <div className="ob-spotlight__scene ob-spotlight-enter">
        <ModuleIllustrationStage moduleId={moduleId} active={active} size="hero" />
      </div>
      <div className="ob-spotlight__meta">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="ob-spotlight__title">{name}</h3>
              {mod.recommended ? (
                <span className="rounded-full bg-[color:var(--brand-primary)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--brand-primary)]">
                  {t("modules.recommended")}
                </span>
              ) : null}
            </div>
            <p className="ob-spotlight__tagline">{t(`modules.${moduleId}.tagline`)}</p>
            <p className="ob-spotlight__desc">{t(`modules.${moduleId}.description`)}</p>
          </div>
          <ModuleToggle
            active={active}
            label={t(active ? "modules.deactivate" : "modules.activate", { name })}
            onChange={() => onToggle()}
          />
        </div>
      </div>
    </div>
  );
}
