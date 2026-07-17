"use client";

import { useMemo, useState } from "react";
import { Check, Plus, Sparkles } from "lucide-react";
import ModuleGlyph from "../modules/ModuleGlyph";
import {
  getCommerciallyAvailableModules,
  MODULE_DISPLAY_ORDER,
  toggleModule,
  type AppModuleId,
} from "../../lib/modules";
import {
  MODULE_QUESTIONNAIRE,
  recommendModulesFromQuiz,
  type ModuleQuestionId,
  type ModuleQuizAnswers,
} from "../../lib/onboarding/moduleQuestionnaire";
import { useTranslation } from "../../lib/i18n/useTranslation";
import "./setup-onboarding.css";

type ModuleQuestionnaireProps = {
  value: AppModuleId[];
  onChange: (modules: AppModuleId[]) => void;
  onPhaseChange?: (phase: "questions" | "recommendation") => void;
};

export default function ModuleQuestionnaire({
  value,
  onChange,
  onPhaseChange,
}: ModuleQuestionnaireProps) {
  const { t } = useTranslation({ preferBrowser: true });
  const [phase, setPhase] = useState<"questions" | "recommendation">("questions");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<ModuleQuizAnswers>({});
  const [recommendedIds, setRecommendedIds] = useState<AppModuleId[]>([]);

  const currentQuestion = MODULE_QUESTIONNAIRE[questionIndex];
  const progressPct = Math.round(((questionIndex + (phase === "recommendation" ? 1 : 0)) / MODULE_QUESTIONNAIRE.length) * 100);

  const optionalModules = useMemo(
    () =>
      MODULE_DISPLAY_ORDER.filter(
        (id) => getCommerciallyAvailableModules().includes(id) && !recommendedIds.includes(id),
      ),
    [recommendedIds],
  );

  function goToRecommendation(nextAnswers: ModuleQuizAnswers) {
    const recommended = recommendModulesFromQuiz(nextAnswers);
    setRecommendedIds(recommended);
    onChange(recommended);
    setPhase("recommendation");
    onPhaseChange?.("recommendation");
  }

  function selectOption(questionId: ModuleQuestionId, optionId: string) {
    const nextAnswers = { ...answers, [questionId]: optionId };
    setAnswers(nextAnswers);

    if (questionIndex < MODULE_QUESTIONNAIRE.length - 1) {
      setQuestionIndex((index) => index + 1);
      return;
    }

    goToRecommendation(nextAnswers);
  }

  function restartQuiz() {
    setAnswers({});
    setQuestionIndex(0);
    setRecommendedIds([]);
    setPhase("questions");
    onPhaseChange?.("questions");
  }

  if (phase === "questions" && currentQuestion) {
    return (
      <div className="ob-quiz">
        <div className="ob-quiz__progress" aria-hidden>
          <span className="ob-quiz__progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="ob-quiz__kicker">
          {t("setup.moduleQuiz.progress", {
            current: questionIndex + 1,
            total: MODULE_QUESTIONNAIRE.length,
          })}
        </p>
        <h3 className="ob-quiz__title">{t(currentQuestion.titleKey)}</h3>
        <p className="ob-quiz__subtitle">{t(currentQuestion.subtitleKey)}</p>

        <div className="ob-quiz__options">
          {currentQuestion.options.map((option) => {
            const selected = answers[currentQuestion.id] === option.id;
            return (
              <button
                key={option.id}
                type="button"
                className={["ob-quiz__option", selected ? "ob-quiz__option--selected" : ""].join(" ")}
                onClick={() => selectOption(currentQuestion.id, option.id)}
              >
                <span className="ob-quiz__option-label">{t(option.labelKey)}</span>
              </button>
            );
          })}
        </div>

        {questionIndex > 0 ? (
          <button
            type="button"
            className="ob-quiz__back-link"
            onClick={() => setQuestionIndex((index) => Math.max(0, index - 1))}
          >
            {t("setup.moduleQuiz.previousQuestion")}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="ob-quiz ob-quiz--result">
      <div className="ob-quiz__result-header">
        <Sparkles className="h-5 w-5 text-[var(--accent)]" aria-hidden />
        <div>
          <p className="ob-quiz__result-kicker">{t("setup.moduleQuiz.resultKicker")}</p>
          <h3 className="ob-quiz__result-title">{t("setup.moduleQuiz.resultTitle")}</h3>
          <p className="ob-quiz__result-body">{t("setup.moduleQuiz.resultBody")}</p>
        </div>
      </div>

      <div className="ob-quiz__modules">
        {value.map((moduleId) => {
          const name = t(`modules.${moduleId}.name`);
          const fromQuiz = recommendedIds.includes(moduleId);
          return (
            <article key={moduleId} className="ob-quiz__module-card">
              <div className="ob-quiz__module-head">
                <ModuleGlyph moduleId={moduleId} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="ob-quiz__module-name">{name}</h4>
                    {fromQuiz ? (
                      <span className="ob-quiz__module-badge">{t("setup.moduleQuiz.recommendedBadge")}</span>
                    ) : null}
                  </div>
                  <p className="ob-quiz__module-tagline">{t(`modules.${moduleId}.tagline`)}</p>
                </div>
                <button
                  type="button"
                  className="ob-quiz__module-toggle ob-quiz__module-toggle--on"
                  aria-label={t("modules.deactivate", { name })}
                  onClick={() => {
                    const next = toggleModule(value, moduleId, false);
                    if (next.length === 0) return;
                    onChange(next);
                  }}
                >
                  <Check className="h-4 w-4" aria-hidden />
                </button>
              </div>
              <p className="ob-quiz__module-desc">{t(`modules.${moduleId}.description`)}</p>
              <ul className="ob-quiz__module-highlights">
                {(["h1", "h2"] as const).map((key) => (
                  <li key={key}>{t(`modules.${moduleId}.highlights.${key}`)}</li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>

      {optionalModules.length > 0 ? (
        <div className="ob-quiz__extras">
          <p className="ob-quiz__extras-title">{t("setup.moduleQuiz.addMoreTitle")}</p>
          <div className="ob-quiz__extras-grid">
            {optionalModules.map((moduleId) => {
              const active = value.includes(moduleId);
              const name = t(`modules.${moduleId}.name`);
              return (
                <button
                  key={moduleId}
                  type="button"
                  className={["ob-quiz__extra", active ? "ob-quiz__extra--active" : ""].join(" ")}
                  onClick={() => onChange(toggleModule(value, moduleId, !active))}
                >
                  <ModuleGlyph moduleId={moduleId} size="sm" />
                  <span>{name}</span>
                  {!active ? <Plus className="h-3.5 w-3.5 opacity-60" aria-hidden /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="ob-quiz__footer">
        <button type="button" className="ob-quiz__back-link" onClick={restartQuiz}>
          {t("setup.moduleQuiz.retake")}
        </button>
        <span className="text-xs text-[var(--ink-muted)]">
          {t("modules.selectedCount", { count: value.length })}
        </span>
      </div>
    </div>
  );
}

export function isModuleQuestionnaireReady(
  phase: "questions" | "recommendation",
): boolean {
  return phase === "recommendation";
}
