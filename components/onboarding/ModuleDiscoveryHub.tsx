"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { Check, Compass, Sparkles, Star, X } from "lucide-react";
import { useTranslation } from "../../lib/i18n/useTranslation";
import { useExplorationTutorialOptional } from "../../lib/onboarding/explorationTutorialContext";
import { MODULE_REGISTRY } from "../../lib/modules";
import type { AppModuleId } from "../../lib/modules/types";
import { MODULE_TOUR_DEFINITIONS } from "../../lib/onboarding/moduleTutorialConfig";
import "./first-task-tutorial.css";

export default function ModuleDiscoveryHub() {
  const { t } = useTranslation({ preferBrowser: true });
  const exploration = useExplorationTutorialOptional();

  if (!exploration?.moduleHubOpen) return null;

  const {
    availableModules,
    completedModuleTours,
    startModuleTour,
    skipModuleDiscovery,
    finishModuleDiscovery,
    closeModuleHub,
  } = exploration;

  const allDone =
    availableModules.length > 0 &&
    availableModules.every((id) => completedModuleTours.includes(id));

  return createPortal(
    <div className="first-task-tutorial__module-hub" role="dialog" aria-modal="true">
      <div className="first-task-tutorial__module-hub-card">
        <button
          type="button"
          onClick={closeModuleHub}
          className="absolute right-3 top-3 rounded-lg p-1 text-[color:var(--foreground)]/40 hover:bg-[var(--surface-soft)]"
          aria-label={t("moduleDiscovery.hub.close")}
        >
          <X className="h-4 w-4" />
        </button>

        <span className="first-task-tutorial__badge">
          <Compass className="h-3 w-3" aria-hidden />
          {t("moduleDiscovery.hub.badge")}
        </span>
        <h2 className="mt-2 pr-8 text-xl font-bold text-[var(--foreground)]">
          {t("moduleDiscovery.hub.title")}
        </h2>
        <p className="mt-1.5 text-sm text-[color:var(--foreground)]/65">
          {t("moduleDiscovery.hub.body")}
        </p>

        <div className="mt-4 max-h-[min(52vh,420px)] space-y-2 overflow-y-auto pr-1">
          {availableModules.length === 0 ? (
            <p className="rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[color:var(--foreground)]/60">
              {t("moduleDiscovery.hub.noModules")}
            </p>
          ) : (
            availableModules.map((moduleId) => (
              <ModuleRow
                key={moduleId}
                moduleId={moduleId}
                done={completedModuleTours.includes(moduleId)}
                onGuide={() => startModuleTour(moduleId)}
              />
            ))
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void skipModuleDiscovery()}
            className="ui-transition flex-1 rounded-xl border border-[var(--line)] px-3 py-2 text-sm font-semibold text-[color:var(--foreground)]/70 hover:bg-[var(--surface-soft)]"
          >
            {t("moduleDiscovery.hub.exploreAlone")}
          </button>
          <button
            type="button"
            onClick={() => void finishModuleDiscovery()}
            className="ui-btn ui-btn-primary flex-1 px-3 py-2 text-sm font-semibold"
          >
            {allDone ? t("moduleDiscovery.hub.finish") : t("moduleDiscovery.hub.finishPartial")}
          </button>
        </div>

        {completedModuleTours.length > 0 ? (
          <p className="mt-2 flex items-center justify-center gap-1 text-[11px] font-semibold text-[var(--accent)]">
            <Star className="h-3 w-3 fill-[var(--accent)]" aria-hidden />
            {t("moduleDiscovery.hub.progress", {
              done: String(completedModuleTours.length),
              total: String(availableModules.length),
            })}
          </p>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

function ModuleRow(props: {
  moduleId: AppModuleId;
  done: boolean;
  onGuide: () => void;
}) {
  const { t } = useTranslation({ preferBrowser: true });
  const def = MODULE_TOUR_DEFINITIONS[props.moduleId];
  const route = def?.route ?? MODULE_REGISTRY[props.moduleId]?.defaultRoute ?? "/dashboard/kanban";
  const nameKey = `modules.${props.moduleId}.name`;

  return (
    <div className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)]/80 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--foreground)]">{t(nameKey)}</p>
        <p className="text-[11px] text-[color:var(--foreground)]/50">
          {t(`moduleDiscovery.hub.moduleHint.${props.moduleId}`)}
        </p>
      </div>
      {props.done ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface))] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--accent)]">
          <Check className="h-3 w-3" aria-hidden />
          OK
        </span>
      ) : (
        <>
          <Link
            href={route}
            className="ui-transition rounded-lg border border-[var(--line)] px-2.5 py-1 text-[11px] font-semibold text-[color:var(--foreground)]/70 hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            {t("moduleDiscovery.hub.visit")}
          </Link>
          <button
            type="button"
            onClick={props.onGuide}
            className="ui-transition inline-flex items-center gap-1 rounded-lg bg-[var(--accent)] px-2.5 py-1 text-[11px] font-semibold text-[var(--accent-contrast)] hover:opacity-90"
          >
            <Sparkles className="h-3 w-3" aria-hidden />
            {t("moduleDiscovery.hub.guide")}
          </button>
        </>
      )}
    </div>
  );
}
