"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import {
  submitPublicIntakeRequest,
  type PublicIntakeFormMeta,
} from "../../../app/actions/intakeForm";
import { orderedIntakeQuestions } from "../../../lib/intake/intakeFormDefinition";
import { validateIntakeAnswers } from "../../../lib/intake/intakeFormAnswers";
import type { SurveyAnswers } from "../../../lib/survey/surveyTypes";
import { toastError } from "../../../lib/toast";
import QuestionField from "../../survey/QuestionField";
import IntakeFormBrandHeader from "./IntakeFormBrandHeader";

type PublicIntakeFormProps = {
  formId: string;
  meta: PublicIntakeFormMeta;
};

export default function PublicIntakeForm({ formId, meta }: PublicIntakeFormProps) {
  const questions = useMemo(
    () => orderedIntakeQuestions(meta.definition),
    [meta.definition],
  );

  const companyOptions = meta.companies.length > 0 ? meta.companies : ["—"];

  const [answers, setAnswers] = useState<SurveyAnswers>(() => {
    const initial: SurveyAnswers = {};
    for (const q of questions) {
      if (q.optionsSource === "companies") {
        initial[q.id] = companyOptions[0] ?? "";
      }
    }
    return initial;
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const setAnswer = (questionId: string, value: SurveyAnswers[string]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const resetForm = () => {
    const initial: SurveyAnswers = {};
    for (const q of questions) {
      if (q.optionsSource === "companies") {
        initial[q.id] = companyOptions[0] ?? "";
      }
    }
    setAnswers(initial);
    setDone(false);
  };

  const validationError = validateIntakeAnswers(meta.definition, answers);
  const canSubmit = !validationError && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      const result = await submitPublicIntakeRequest(formId, { answers });
      if (result.ok) {
        setDone(true);
      } else {
        toastError(result.error);
      }
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-[var(--background)] px-4 py-10">
        <div className="mx-auto max-w-xl">
          <IntakeFormBrandHeader appName={meta.appName} />
          <div className="ui-surface mt-8 rounded-2xl border-l-4 border-l-[var(--accent)] p-8 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-[var(--success)]" />
            <h1 className="mt-3 text-xl font-semibold text-[var(--foreground)]">Demande envoyée</h1>
            <p className="mt-2 text-sm text-[color:var(--foreground)]/60">
              Votre demande a bien été transmise à {meta.appName}. Vous serez recontacté·e prochainement.
            </p>
            <button
              type="button"
              onClick={resetForm}
              className="ui-btn ui-btn-secondary mt-6 text-sm"
            >
              Soumettre une autre demande
            </button>
          </div>
        </div>
      </div>
    );
  }

  const intro = meta.definition.intro;

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-10">
      <div className="mx-auto max-w-xl">
        <IntakeFormBrandHeader appName={meta.appName} />

        <div className="ui-surface mt-8 rounded-2xl border-l-4 border-l-[var(--accent)] p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Formulaire public
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
            {intro.title || meta.title}
          </h1>
          {intro.subtitle ? (
            <p className="mt-2 text-sm text-[color:var(--foreground)]/60">{intro.subtitle}</p>
          ) : meta.welcomeMessage ? (
            <p className="mt-2 text-sm text-[color:var(--foreground)]/60">{meta.welcomeMessage}</p>
          ) : (
            <p className="mt-2 text-sm text-[color:var(--foreground)]/60">
              Décrivez votre besoin. L&apos;équipe {meta.appName} qualifiera votre demande avant de la traiter.
            </p>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
            className="mt-5 space-y-5"
          >
            {questions.map((question) => (
              <QuestionField
                key={question.id}
                question={question}
                value={answers[question.id]}
                onChange={(value) => setAnswer(question.id, value)}
                optionsOverride={
                  question.optionsSource === "companies" ? companyOptions : undefined
                }
              />
            ))}

            <button
              type="submit"
              disabled={!canSubmit}
              className="ui-transition inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--accent)] bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-contrast)] hover:bg-[var(--accent-strong)] disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> Envoyer la demande
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[11px] text-[color:var(--foreground)]/40">
          Accès limité à ce formulaire — vous n&apos;avez pas accès au reste de la plateforme.
        </p>
      </div>
    </div>
  );
}
