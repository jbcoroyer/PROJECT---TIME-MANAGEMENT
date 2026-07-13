"use client";

import {
  Check,
  ChevronDown,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import ModuleToggle from "../modules/ModuleToggle";
import ModuleIllustration, { ModuleIllustrationStage } from "../modules/ModuleIllustration";
import OnboardingModulePicker from "./OnboardingModulePicker";
import {
  DEFAULT_ONBOARDING_MODULES,
  getModulesByCategory,
  MODULE_CATEGORY_ORDER,
  toggleModule,
  type AppModuleDefinition,
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

function OnboardingModuleCatalog({
  value,
  onChange,
  showIntro = true,
}: ModuleCatalogProps) {
  const { t } = useTranslation({ preferBrowser: true });
  const grouped = getModulesByCategory();
  let cardIndex = 0;

  return (
    <div className="space-y-6">
      {showIntro ? (
        <div className="rounded-2xl border border-[color:var(--brand-primary)]/15 bg-gradient-to-br from-[color:var(--brand-primary)]/[0.07] via-[var(--surface)] to-[var(--surface-soft)] px-5 py-5 text-center sm:px-6">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--brand-primary)]/12 text-[var(--brand-primary)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <p className="text-base font-semibold text-[var(--foreground)]">{t("setup.step3HeroTitle")}</p>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-[color:var(--foreground)]/65">
            {t("setup.step3Intro")}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)]/60 px-4 py-3">
        <p className="text-sm font-medium text-[color:var(--foreground)]/70">
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

      <div className="space-y-8">
        {MODULE_CATEGORY_ORDER.map((category) => {
          const modules = grouped[category];
          if (modules.length === 0) return null;

          const activeInCategory = modules.filter((m) => value.includes(m.id)).length;

          return (
            <section key={category} className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-2 px-1">
                <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[color:var(--foreground)]/50">
                  {t(`modules.categories.${category}`)}
                </h3>
                <span className="text-xs font-medium text-[color:var(--foreground)]/45">
                  {t("modules.categoryActive", { active: activeInCategory, total: modules.length })}
                </span>
              </div>

              <div className="space-y-4">
                {modules.map((mod) => {
                  const idx = cardIndex++;
                  return (
                    <OnboardingModuleCard
                      key={mod.id}
                      mod={mod}
                      active={value.includes(mod.id)}
                      index={idx}
                      value={value}
                      onChange={onChange}
                    />
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

function OnboardingModuleCard({
  mod,
  active,
  index,
  value,
  onChange,
}: {
  mod: AppModuleDefinition;
  active: boolean;
  index: number;
  value: AppModuleId[];
  onChange: (modules: AppModuleId[]) => void;
}) {
  const { t } = useTranslation({ preferBrowser: true });
  const moduleName = t(`modules.${mod.id}.name`);

  return (
    <article
      className={[
        "mc-onboard-card ui-transition group overflow-hidden rounded-2xl border shadow-sm",
        active
          ? "border-[color:var(--brand-primary)]/45 bg-[var(--surface)] ring-2 ring-[color:var(--brand-primary)]/12"
          : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)] hover:shadow-md",
      ].join(" ")}
      style={{ animationDelay: `${index * 70}ms` }}
      onClick={() => onChange(toggleModule(value, mod.id, !active))}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onChange(toggleModule(value, mod.id, !active));
        }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={active}
    >
      <ModuleIllustrationStage moduleId={mod.id} active={active} size="lg" />

      <div className="space-y-3 px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-base font-semibold text-[var(--foreground)]">{moduleName}</h4>
              {mod.recommended ? (
                <span className="rounded-full bg-[color:var(--brand-primary)]/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--brand-primary)]">
                  {t("modules.recommended")}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-[color:var(--foreground)]/55">{t(`modules.${mod.id}.tagline`)}</p>
          </div>
          <ModuleToggle
            active={active}
            label={t(active ? "modules.deactivate" : "modules.activate", { name: moduleName })}
            onChange={(next) => onChange(toggleModule(value, mod.id, next))}
          />
        </div>

        <p className="text-sm leading-relaxed text-[color:var(--foreground)]/72">
          {t(`modules.${mod.id}.description`)}
        </p>

        <ul className="grid gap-2 sm:grid-cols-1">
          {(["h1", "h2", "h3"] as const).map((key) => (
            <li
              key={key}
              className="flex items-start gap-2.5 rounded-lg bg-[var(--surface-soft)]/80 px-3 py-2 text-sm leading-snug text-[color:var(--foreground)]/70"
            >
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-primary)]" />
              <span>{t(`modules.${mod.id}.highlights.${key}`)}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
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
                          ? "border-[color:var(--brand-primary)]/40 bg-[color:var(--brand-primary)]/[0.05]"
                          : "border-[var(--line)] bg-[var(--surface-soft)]/40 hover:border-[var(--line-strong)]",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-3 p-3.5 pb-2">
                        <div
                          className={[
                            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border p-1.5",
                            active
                              ? "border-[color:var(--brand-primary)]/25 bg-[color:var(--brand-primary)]/8 text-[var(--brand-primary)]"
                              : "border-[var(--line)] bg-[var(--surface)] text-[color:var(--foreground)]/50",
                          ].join(" ")}
                        >
                          <ModuleIllustration moduleId={mod.id} active={active} size="sm" />
                        </div>

                        <div className="min-w-0 flex-1 pt-0.5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <h4 className="text-sm font-semibold leading-tight text-[var(--foreground)]">
                                  {moduleName}
                                </h4>
                                {mod.recommended ? (
                                  <span className="rounded bg-[color:var(--brand-primary)]/10 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-[var(--brand-primary)]">
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
                                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--brand-primary)]" />
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
