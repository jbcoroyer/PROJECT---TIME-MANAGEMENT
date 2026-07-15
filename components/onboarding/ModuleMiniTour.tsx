"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { useTranslation } from "../../lib/i18n/useTranslation";
import { useExplorationTutorialOptional } from "../../lib/onboarding/explorationTutorialContext";
import { MODULE_TOUR_DEFINITIONS } from "../../lib/onboarding/moduleTutorialConfig";
import TutorialSpotlight from "./TutorialSpotlight";
import "./first-task-tutorial.css";

export default function ModuleMiniTour() {
  const { t } = useTranslation({ preferBrowser: true });
  const pathname = usePathname();
  const router = useRouter();
  const exploration = useExplorationTutorialOptional();

  const moduleId = exploration?.activeModuleTour;
  const stepIndex = exploration?.moduleTourStep ?? 0;
  const tourDef = moduleId ? MODULE_TOUR_DEFINITIONS[moduleId] : undefined;
  const step = tourDef?.steps[stepIndex];

  useEffect(() => {
    if (!moduleId || !tourDef) return;
    const onModuleRoute = pathname.startsWith(tourDef.route.split("/").slice(0, 2).join("/") || tourDef.route);
    if (!onModuleRoute && stepIndex === 0) {
      router.push(tourDef.route);
    }
  }, [moduleId, pathname, router, stepIndex, tourDef]);

  if (!exploration || !moduleId || !tourDef || !step) return null;

  const { advanceModuleTour, skipModuleTour } = exploration;
  const isLast = stepIndex >= tourDef.steps.length - 1;
  const progress = Math.round(((stepIndex + 1) / tourDef.steps.length) * 100);

  const cardContent = (
    <>
      <span className="first-task-tutorial__badge">
        <Sparkles className="h-3 w-3" aria-hidden />
        {t("moduleDiscovery.miniTour.badge", {
          module: t(`modules.${moduleId}.name`),
          current: String(stepIndex + 1),
          total: String(tourDef.steps.length),
        })}
      </span>
      <h3 className="mt-2 text-base font-semibold text-[var(--foreground)]">{t(step.titleKey)}</h3>
      <p className="mt-1.5 text-sm text-[color:var(--foreground)]/65">{t(step.bodyKey)}</p>
      <div className="first-task-tutorial__xp-bar">
        <div className="first-task-tutorial__xp-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={skipModuleTour}
          className="ui-transition flex-1 rounded-xl border border-[var(--line)] px-3 py-2 text-xs font-semibold text-[color:var(--foreground)]/60 hover:bg-[var(--surface-soft)]"
        >
          {t("moduleDiscovery.miniTour.skip")}
        </button>
        <button
          type="button"
          onClick={advanceModuleTour}
          className="ui-btn ui-btn-primary inline-flex flex-1 items-center justify-center gap-1 px-3 py-2 text-xs font-semibold"
        >
          {isLast ? t("moduleDiscovery.miniTour.done") : t("moduleDiscovery.miniTour.next")}
          {!isLast ? <ArrowRight className="h-3.5 w-3.5" aria-hidden /> : null}
        </button>
      </div>
      <button
        type="button"
        onClick={skipModuleTour}
        className="mt-2 flex w-full items-center justify-center gap-1 text-[11px] text-[color:var(--foreground)]/45 hover:text-[color:var(--foreground)]/70"
      >
        <X className="h-3 w-3" aria-hidden />
        {t("gamification.tutorials.pause")}
      </button>
    </>
  );

  if (step.floating || !step.targetSelector) {
    return (
      <div className="first-task-tutorial__mini-tour-float" role="dialog" aria-modal="true">
        <div className="first-task-tutorial__card first-task-tutorial__mini-tour-card">{cardContent}</div>
      </div>
    );
  }

  return (
    <TutorialSpotlight targetSelector={step.targetSelector} visible cardPosition={step.cardPosition ?? "auto"}>
      {cardContent}
    </TutorialSpotlight>
  );
}
