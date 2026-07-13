"use client";

import {
  Check,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import { useState } from "react";
import ModuleToggle from "../modules/ModuleToggle";
import ModuleGlyph from "../modules/ModuleGlyph";
import OnboardingModulePicker from "./OnboardingModulePicker";
import {
  DEFAULT_ONBOARDING_MODULES,
  getModulesByCategory,
  MODULE_CATEGORY_ORDER,
  toggleModule,
  type AppModuleId,
} from "../../lib/modules";
import { useTranslation } from "../../lib/i18n/useTranslation";

type ModuleCatalogProps = {
  value: AppModuleId[];
  onChange: (modules: AppModuleId[]) => void;
  showIntro?: boolean;
  variant?: "onboarding" | "settings";
};

export default function ModuleCatalog(props: ModuleCatalogProps) {
  if (props.variant === "onboarding") {
    return <OnboardingModulePicker value={props.value} onChange={props.onChange} />;
  }
  return <SettingsModuleCatalog {...props} />;
}

function SettingsModuleCatalog({
  value,
  onChange,
  showIntro = true,
}: ModuleCatalogProps) {
  const { t } = useTranslation({ preferBrowser: true });
  const grouped = getModulesByCategory();
  const [expanded, setExpanded] = useState<AppModuleId | null>(null);
  const enabledCount = value.length;

  return (
    <div className="space-y-5">
      {showIntro ? (
        <p className="text-sm leading-relaxed text-[color:var(--foreground)]/70">{t("setup.step3Intro")}</p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[color:var(--foreground)]/60">
          {t("modules.selectedCount", { count: enabledCount })}
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

      <div className="space-y-4">
        {MODULE_CATEGORY_ORDER.map((category) => {
          const modules = grouped[category];
          if (modules.length === 0) return null;

          const activeInCategory = modules.filter((m) => value.includes(m.id)).length;

          return (
            <section
              key={category}
              className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]"
            >
              <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] bg-[var(--surface-soft)]/80 px-4 py-3">
                <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--foreground)]/55">
                  {t(`modules.categories.${category}`)}
                </h3>
                <span className="rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-[11px] font-semibold text-[color:var(--foreground)]/55 ring-1 ring-[var(--line)]">
                  {t("modules.categoryActive", { active: activeInCategory, total: modules.length })}
                </span>
              </header>

              <div className="grid gap-3 p-3 sm:grid-cols-2">
                {modules.map((mod) => {
                  const active = value.includes(mod.id);
                  const isExpanded = expanded === mod.id;
                  const moduleName = t(`modules.${mod.id}.name`);

                  return (
                    <article
                      key={mod.id}
                      className={[
                        "flex flex-col rounded-xl border transition",
                        active
                          ? "border-[var(--ink)] bg-[var(--background)]"
                          : "border-[var(--line)] bg-[var(--surface-soft)]/40 hover:border-[var(--line-strong)]",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-3 p-3.5 pb-2">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center">
                          <ModuleGlyph moduleId={mod.id} size="lg" />
                        </div>

                        <div className="min-w-0 flex-1 pt-0.5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <h4 className="text-sm font-semibold leading-tight text-[var(--foreground)]">
                                  {moduleName}
                                </h4>
                                {mod.recommended ? (
                                  <span className="rounded bg-[var(--accent-soft)] px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-[var(--accent-strong)]">
                                    {t("modules.recommended")}
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-1 text-xs leading-snug text-[color:var(--foreground)]/55">
                                {t(`modules.${mod.id}.tagline`)}
                              </p>
                            </div>

                            <ModuleToggle
                              active={active}
                              label={t(active ? "modules.deactivate" : "modules.activate", {
                                name: moduleName,
                              })}
                              onChange={(next) => onChange(toggleModule(value, mod.id, next))}
                            />
                          </div>
                        </div>
                      </div>

                      <p className="px-3.5 pb-2 text-xs leading-relaxed text-[color:var(--foreground)]/65 line-clamp-2">
                        {t(`modules.${mod.id}.description`)}
                      </p>

                      <div className="mt-auto border-t border-[var(--line)]/70">
                        <button
                          type="button"
                          onClick={() => setExpanded(isExpanded ? null : mod.id)}
                          aria-expanded={isExpanded}
                          className="ui-transition flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-xs font-semibold text-[color:var(--foreground)]/60 hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
                        >
                          <span>{t("modules.learnMore")}</span>
                          <ChevronDown
                            className={[
                              "h-4 w-4 shrink-0 transition-transform",
                              isExpanded ? "rotate-180" : "",
                            ].join(" ")}
                          />
                        </button>

                        {isExpanded ? (
                          <ul className="space-y-2 border-t border-[var(--line)]/60 bg-[var(--surface-soft)]/50 px-3.5 py-3">
                            {(["h1", "h2", "h3"] as const).map((key) => (
                              <li
                                key={key}
                                className="flex items-start gap-2 text-xs leading-relaxed text-[color:var(--foreground)]/70"
                              >
                                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
                                <span>{t(`modules.${mod.id}.highlights.${key}`)}</span>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
