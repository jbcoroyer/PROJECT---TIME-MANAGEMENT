"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Copy,
  GripVertical,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import {
  buildEditorSections,
  createBlankQuestion,
  generateQuestionId,
  normalizeQuestionForType,
  sectionsToDefinition,
  type EditorSection,
} from "../../../lib/survey/surveyDefinitionUtils";
import type { Question, QuestionType, SurveyDefinition } from "../../../lib/survey/surveyTypes";
import { toastError, toastSuccess } from "../../../lib/toast";
import { useConfirm } from "../../ui/ConfirmDialog";
import { useTranslation } from "../../../lib/i18n/useTranslation";

type SaveDefinitionResult = { ok: true } | { ok: false; error: string };

type SurveyEditorWorkspaceProps = {
  formId: string;
  title: string;
  initialDefinition: SurveyDefinition;
  onSave: (definition: SurveyDefinition) => Promise<SaveDefinitionResult>;
  backHref: string;
  backLabel?: string;
  successMessage?: string;
  showPrestationRules?: boolean;
  hideBackNav?: boolean;
};

const inputClass =
  "ui-focus-ring w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm font-normal text-[var(--foreground)]";
const labelClass = "flex flex-col gap-1 text-xs font-semibold text-[color:var(--foreground)]/55";
const handleClass =
  "flex h-8 w-6 cursor-grab touch-none items-center justify-center rounded-md text-[color:var(--foreground)]/35 hover:bg-[var(--surface)] hover:text-[color:var(--foreground)]/70 active:cursor-grabbing";

const optionId = (questionId: string, index: number) => `${questionId}::opt::${index}`;

/** Enveloppe sortable pour une question (fournit les props du poignée de drag). */
function SortableQuestion({
  id,
  children,
}: {
  id: string;
  children: (handleProps: Record<string, unknown>) => ReactNode;
}) {
  const { setNodeRef, transform, transition, attributes, listeners, isDragging } = useSortable({
    id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="space-y-3 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-4"
    >
      {children({ ...attributes, ...listeners })}
    </div>
  );
}

/** Enveloppe sortable pour une option de réponse. */
function SortableOption({
  id,
  children,
}: {
  id: string;
  children: (handleProps: Record<string, unknown>) => ReactNode;
}) {
  const { setNodeRef, transform, transition, attributes, listeners, isDragging } = useSortable({
    id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1.5">
      {children({ ...attributes, ...listeners })}
    </div>
  );
}

/** Zone de dépôt d'une section (accepte les questions, même si vide). */
function SectionDropZone({ id, children }: { id: string; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`space-y-3 rounded-xl transition-colors ${
        isOver ? "bg-[var(--accent)]/5 outline-dashed outline-1 outline-[var(--accent)]/40" : ""
      }`}
    >
      {children}
    </div>
  );
}

export default function SurveyEditorWorkspace({
  title,
  initialDefinition,
  onSave,
  backHref,
  backLabel,
  successMessage,
  showPrestationRules = true,
  hideBackNav = false,
}: SurveyEditorWorkspaceProps) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const resolvedBackLabel = backLabel ?? t("survey.common.back");
  const resolvedSuccessMessage = successMessage ?? t("survey.editor.successDefault");

  const questionTypes = useMemo(
    (): { value: QuestionType; label: string }[] => [
      { value: "single", label: t("survey.editor.types.single") },
      { value: "multiple", label: t("survey.editor.types.multiple") },
      { value: "rating", label: t("survey.editor.types.rating") },
      { value: "nps", label: t("survey.editor.types.nps") },
      { value: "open", label: t("survey.editor.types.open") },
      { value: "text", label: t("survey.editor.types.text") },
    ],
    [t],
  );

  const questionTypeLabel = useMemo(
    (): Record<QuestionType, string> => ({
      single: t("survey.editor.typesShort.single"),
      multiple: t("survey.editor.typesShort.multiple"),
      rating: t("survey.editor.typesShort.rating"),
      nps: t("survey.editor.typesShort.nps"),
      open: t("survey.editor.typesShort.open"),
      text: t("survey.editor.typesShort.text"),
    }),
    [t],
  );
  const [intro, setIntro] = useState(() => ({ ...initialDefinition.intro }));
  const [sections, setSections] = useState<EditorSection[]>(() =>
    buildEditorSections(initialDefinition),
  );
  const [saving, setSaving] = useState(false);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const prestationOptions = useMemo(() => {
    for (const s of sections) {
      const q4 = s.questions.find((q) => q.id === "q4");
      if (q4?.options) return q4.options;
    }
    return [];
  }, [sections]);

  const activeQuestion = useMemo(() => {
    if (!activeQuestionId) return null;
    for (const s of sections) {
      const q = s.questions.find((qq) => qq.id === activeQuestionId);
      if (q) return q;
    }
    return null;
  }, [activeQuestionId, sections]);

  // --- Localisation d'une question / section ---
  const findSectionIndexByContainer = (containerId: string) =>
    sections.findIndex((s) => s.key === containerId);

  const findSectionIndexByQuestion = (questionId: string) =>
    sections.findIndex((s) => s.questions.some((q) => q.id === questionId));

  /** Résout l'index de section pour un id (question ou conteneur de section). */
  const resolveSectionIndex = (id: string) => {
    const byContainer = findSectionIndexByContainer(id);
    if (byContainer !== -1) return byContainer;
    return findSectionIndexByQuestion(id);
  };

  // --- Drag & drop des questions (inter-écrans) ---
  const handleQuestionDragStart = (event: DragStartEvent) => {
    setActiveQuestionId(String(event.active.id));
  };

  const handleQuestionDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const fromIndex = findSectionIndexByQuestion(activeId);
    const toIndex = resolveSectionIndex(overId);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

    setSections((prev) => {
      const from = prev[fromIndex];
      const to = prev[toIndex];
      const moving = from.questions.find((q) => q.id === activeId);
      if (!moving) return prev;

      const overQuestionIndex = to.questions.findIndex((q) => q.id === overId);
      const insertAt = overQuestionIndex === -1 ? to.questions.length : overQuestionIndex;

      const next = [...prev];
      next[fromIndex] = {
        ...from,
        questions: from.questions.filter((q) => q.id !== activeId),
      };
      const toQuestions = [...to.questions];
      toQuestions.splice(insertAt, 0, moving);
      next[toIndex] = { ...to, questions: toQuestions };
      return next;
    });
  };

  const handleQuestionDragEnd = (event: DragEndEvent) => {
    setActiveQuestionId(null);
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const sectionIndex = findSectionIndexByQuestion(activeId);
    if (sectionIndex === -1) return;

    setSections((prev) => {
      const section = prev[sectionIndex];
      const oldIndex = section.questions.findIndex((q) => q.id === activeId);
      const overIndex = section.questions.findIndex((q) => q.id === overId);
      const newIndex = overIndex === -1 ? section.questions.length - 1 : overIndex;
      if (oldIndex === -1 || oldIndex === newIndex) return prev;
      const next = [...prev];
      next[sectionIndex] = {
        ...section,
        questions: arrayMove(section.questions, oldIndex, newIndex),
      };
      return next;
    });
  };

  const handleOptionDragEnd = (sectionIndex: number, questionIndex: number) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = Number(String(active.id).split("::").pop());
    const to = Number(String(over.id).split("::").pop());
    if (Number.isNaN(from) || Number.isNaN(to)) return;
    setSections((prev) =>
      prev.map((s, i) => {
        if (i !== sectionIndex) return s;
        return {
          ...s,
          questions: s.questions.map((q, qi) =>
            qi === questionIndex
              ? { ...q, options: arrayMove([...(q.options ?? [])], from, to) }
              : q,
          ),
        };
      }),
    );
  };

  // --- Mutations ---
  const mutateSection = (index: number, patch: Partial<EditorSection>) => {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const mutateQuestion = (sectionIndex: number, questionIndex: number, patch: Partial<Question>) => {
    setSections((prev) =>
      prev.map((s, i) => {
        if (i !== sectionIndex) return s;
        return {
          ...s,
          questions: s.questions.map((q, qi) => (qi === questionIndex ? { ...q, ...patch } : q)),
        };
      }),
    );
  };

  const changeQuestionType = (sectionIndex: number, questionIndex: number, type: QuestionType) => {
    setSections((prev) =>
      prev.map((s, i) => {
        if (i !== sectionIndex) return s;
        return {
          ...s,
          questions: s.questions.map((q, qi) =>
            qi === questionIndex ? normalizeQuestionForType(q, type) : q,
          ),
        };
      }),
    );
  };

  const addQuestion = (sectionIndex: number) => {
    setSections((prev) =>
      prev.map((s, i) =>
        i === sectionIndex
          ? { ...s, questions: [...s.questions, createBlankQuestion("single", i + 1)] }
          : s,
      ),
    );
  };

  const duplicateQuestion = (sectionIndex: number, questionIndex: number) => {
    setSections((prev) =>
      prev.map((s, i) => {
        if (i !== sectionIndex) return s;
        const source = s.questions[questionIndex];
        const copy: Question = {
          ...source,
          id: generateQuestionId(),
          label: `${source.label}${t("survey.editor.copySuffix")}`,
        };
        const next = [...s.questions];
        next.splice(questionIndex + 1, 0, copy);
        return { ...s, questions: next };
      }),
    );
  };

  const removeQuestion = async (sectionIndex: number, questionIndex: number) => {
    const ok = await confirm({
      title: t("survey.editor.deleteQuestionTitle"),
      description: t("survey.editor.deleteQuestionDescription"),
      confirmLabel: t("survey.common.delete"),
      variant: "destructive",
    });
    if (!ok) return;
    setSections((prev) =>
      prev.map((s, i) =>
        i === sectionIndex
          ? { ...s, questions: s.questions.filter((_, qi) => qi !== questionIndex) }
          : s,
      ),
    );
  };

  const moveSection = (sectionIndex: number, dir: -1 | 1) => {
    setSections((prev) => {
      const target = sectionIndex + dir;
      if (target < 0 || target >= prev.length) return prev;
      return arrayMove(prev, sectionIndex, target);
    });
  };

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      {
        key: `section-${Date.now()}`,
        title: t("survey.editor.sectionDefault", { n: prev.length + 1 }),
        subtitle: "",
        questions: [],
      },
    ]);
  };

  const removeSection = async (sectionIndex: number) => {
    const ok = await confirm({
      title: t("survey.editor.deleteScreenTitle"),
      description: t("survey.editor.deleteScreenDescription"),
      confirmLabel: t("survey.common.delete"),
      variant: "destructive",
    });
    if (!ok) return;
    setSections((prev) => prev.filter((_, i) => i !== sectionIndex));
  };

  const setOption = (sectionIndex: number, questionIndex: number, optIndex: number, value: string) => {
    setSections((prev) =>
      prev.map((s, i) => {
        if (i !== sectionIndex) return s;
        return {
          ...s,
          questions: s.questions.map((q, qi) => {
            if (qi !== questionIndex) return q;
            const options = [...(q.options ?? [])];
            options[optIndex] = value;
            return { ...q, options };
          }),
        };
      }),
    );
  };

  const addOption = (sectionIndex: number, questionIndex: number) => {
    setSections((prev) =>
      prev.map((s, i) => {
        if (i !== sectionIndex) return s;
        return {
          ...s,
          questions: s.questions.map((q, qi) =>
            qi === questionIndex
              ? { ...q, options: [...(q.options ?? []), t("survey.editor.optionDefault", { n: (q.options?.length ?? 0) + 1 })] }
              : q,
          ),
        };
      }),
    );
  };

  const removeOption = (sectionIndex: number, questionIndex: number, optIndex: number) => {
    setSections((prev) =>
      prev.map((s, i) => {
        if (i !== sectionIndex) return s;
        return {
          ...s,
          questions: s.questions.map((q, qi) =>
            qi === questionIndex
              ? { ...q, options: (q.options ?? []).filter((_, oi) => oi !== optIndex) }
              : q,
          ),
        };
      }),
    );
  };

  const handleSave = async () => {
    const hasEmptyLabel = sections.some((s) => s.questions.some((q) => !q.label.trim()));
    if (hasEmptyLabel) {
      toastError(t("survey.editor.labelRequired"));
      return;
    }
    setSaving(true);
    const definition = sectionsToDefinition({ ...initialDefinition, intro }, sections);
    const result = await onSave(definition);
    setSaving(false);
    if (!result.ok) {
      toastError(result.error);
      return;
    }
    toastSuccess(resolvedSuccessMessage);
  };

  const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0);

  return (
    <div className="space-y-5">
      <header className="ui-surface sticky top-2 z-20 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5">
        <div>
          {!hideBackNav ? (
            <Link
              href={backHref}
              className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--foreground)]/50 hover:text-[var(--foreground)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {resolvedBackLabel}
            </Link>
          ) : null}
          <h1 className="ui-display text-2xl text-[var(--foreground)]">{t("survey.editor.title")}</h1>
          <p className="mt-1 text-sm text-[color:var(--foreground)]/60">
            {title} · {t("survey.editor.screenCount", { count: sections.length })} ·{" "}
            {t("survey.editor.questionCount", { count: totalQuestions })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="ui-btn ui-btn-primary gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? t("survey.common.saving") : t("survey.common.save")}
        </button>
      </header>

      <section className="ui-surface space-y-4 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">{t("survey.editor.welcomeScreen")}</h2>
        <label className={labelClass}>
          {t("survey.editor.introTitle")}
          <input
            value={intro.title}
            onChange={(e) => setIntro((prev) => ({ ...prev, title: e.target.value }))}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          {t("survey.editor.introSubtitleLabel")}
          <textarea
            value={intro.subtitle}
            onChange={(e) => setIntro((prev) => ({ ...prev, subtitle: e.target.value }))}
            rows={2}
            className={`${inputClass} resize-y`}
          />
        </label>
      </section>

      <p className="flex items-center gap-1.5 text-xs text-[color:var(--foreground)]/50">
        <GripVertical className="h-3.5 w-3.5" />
        {t("survey.editor.dragHint")}
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleQuestionDragStart}
        onDragOver={handleQuestionDragOver}
        onDragEnd={handleQuestionDragEnd}
      >
        {sections.map((section, sectionIndex) => (
          <section key={section.key} className="ui-surface mb-5 space-y-4 rounded-2xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] pb-4">
              <div className="flex-1 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--foreground)]/40">
                  {t("survey.editor.screenLabel", { n: sectionIndex + 1 })}
                </span>
                <input
                  value={section.title}
                  onChange={(e) => mutateSection(sectionIndex, { title: e.target.value })}
                  placeholder={t("survey.editor.screenTitlePlaceholder")}
                  className={`${inputClass} font-semibold`}
                />
                <input
                  value={section.subtitle}
                  onChange={(e) => mutateSection(sectionIndex, { subtitle: e.target.value })}
                  placeholder={t("survey.editor.screenSubtitlePlaceholder")}
                  className={inputClass}
                />
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveSection(sectionIndex, -1)}
                  disabled={sectionIndex === 0}
                  className="ui-btn ui-btn-ghost h-8 w-8 p-0 disabled:opacity-30"
                  aria-label={t("survey.editor.moveScreenUp")}
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveSection(sectionIndex, 1)}
                  disabled={sectionIndex === sections.length - 1}
                  className="ui-btn ui-btn-ghost h-8 w-8 p-0 disabled:opacity-30"
                  aria-label={t("survey.editor.moveScreenDown")}
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void removeSection(sectionIndex)}
                  className="ui-btn ui-btn-ghost h-8 w-8 p-0 text-[var(--danger)]"
                  aria-label={t("survey.editor.deleteScreen")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <SortableContext
              items={section.questions.map((q) => q.id)}
              strategy={verticalListSortingStrategy}
            >
              <SectionDropZone id={section.key}>
                {section.questions.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-[var(--line)] py-6 text-center text-xs text-[color:var(--foreground)]/40">
                    {t("survey.editor.emptySection")}
                  </p>
                ) : null}
                {section.questions.map((question, questionIndex) => (
                  <SortableQuestion key={question.id} id={question.id}>
                    {(handleProps) => (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              className={handleClass}
                              aria-label={t("survey.editor.moveQuestion")}
                              {...handleProps}
                            >
                              <GripVertical className="h-4 w-4" />
                            </button>
                            <select
                              value={question.type}
                              onChange={(e) =>
                                changeQuestionType(
                                  sectionIndex,
                                  questionIndex,
                                  e.target.value as QuestionType,
                                )
                              }
                              className="ui-focus-ring rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)]"
                            >
                              {questionTypes.map((qt) => (
                                <option key={qt.value} value={qt.value}>
                                  {qt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => duplicateQuestion(sectionIndex, questionIndex)}
                              className="ui-btn ui-btn-ghost h-8 w-8 p-0"
                              aria-label={t("survey.editor.duplicateQuestionAria")}
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void removeQuestion(sectionIndex, questionIndex)}
                              className="ui-btn ui-btn-ghost h-8 w-8 p-0 text-[var(--danger)]"
                              aria-label={t("survey.editor.deleteQuestion")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <label className={labelClass}>
                          {t("survey.editor.questionLabel")}
                          <input
                            value={question.label}
                            onChange={(e) =>
                              mutateQuestion(sectionIndex, questionIndex, { label: e.target.value })
                            }
                            className={inputClass}
                          />
                        </label>

                        <label className={labelClass}>
                          {t("survey.editor.helpOptional")}
                          <input
                            value={question.help ?? ""}
                            onChange={(e) =>
                              mutateQuestion(sectionIndex, questionIndex, {
                                help: e.target.value || undefined,
                              })
                            }
                            className={inputClass}
                          />
                        </label>

                        {(question.type === "single" || question.type === "multiple") && (
                          <div className="space-y-2">
                            <span className="text-xs font-semibold text-[color:var(--foreground)]/55">
                              {t("survey.editor.answerOptions")}
                            </span>
                            <DndContext
                              sensors={sensors}
                              collisionDetection={closestCorners}
                              onDragEnd={handleOptionDragEnd(sectionIndex, questionIndex)}
                            >
                              <SortableContext
                                items={(question.options ?? []).map((_, oi) =>
                                  optionId(question.id, oi),
                                )}
                                strategy={verticalListSortingStrategy}
                              >
                                <div className="space-y-2">
                                  {(question.options ?? []).map((opt, optIndex) => (
                                    <SortableOption
                                      key={optionId(question.id, optIndex)}
                                      id={optionId(question.id, optIndex)}
                                    >
                                      {(optHandleProps) => (
                                        <>
                                          <button
                                            type="button"
                                            className={handleClass}
                                            aria-label={t("survey.editor.moveOption")}
                                            {...optHandleProps}
                                          >
                                            <GripVertical className="h-3.5 w-3.5" />
                                          </button>
                                          <input
                                            value={opt}
                                            onChange={(e) =>
                                              setOption(
                                                sectionIndex,
                                                questionIndex,
                                                optIndex,
                                                e.target.value,
                                              )
                                            }
                                            className={inputClass}
                                          />
                                          <button
                                            type="button"
                                            onClick={() =>
                                              removeOption(sectionIndex, questionIndex, optIndex)
                                            }
                                            className="ui-btn ui-btn-ghost h-9 w-9 shrink-0 p-0 text-[var(--danger)]"
                                            aria-label={t("survey.editor.deleteOption")}
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                        </>
                                      )}
                                    </SortableOption>
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                            <button
                              type="button"
                              onClick={() => addOption(sectionIndex, questionIndex)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:underline"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              {t("survey.editor.addOption")}
                            </button>
                          </div>
                        )}

                        {(question.type === "rating" || question.type === "nps") && (
                          <div className="flex flex-wrap gap-3">
                            <label className={labelClass}>
                              {t("survey.editor.minimum")}
                              <input
                                type="number"
                                value={question.scale?.min ?? 0}
                                onChange={(e) =>
                                  mutateQuestion(sectionIndex, questionIndex, {
                                    scale: {
                                      min: Number(e.target.value),
                                      max: question.scale?.max ?? 5,
                                    },
                                  })
                                }
                                className={`${inputClass} w-24`}
                              />
                            </label>
                            <label className={labelClass}>
                              {t("survey.editor.maximum")}
                              <input
                                type="number"
                                value={question.scale?.max ?? 5}
                                onChange={(e) =>
                                  mutateQuestion(sectionIndex, questionIndex, {
                                    scale: {
                                      min: question.scale?.min ?? 0,
                                      max: Number(e.target.value),
                                    },
                                  })
                                }
                                className={`${inputClass} w-24`}
                              />
                            </label>
                          </div>
                        )}

                        {(question.type === "open" || question.type === "text") && (
                          <label className={labelClass}>
                            {t("survey.editor.placeholderOptional")}
                            <input
                              value={question.placeholder ?? ""}
                              onChange={(e) =>
                                mutateQuestion(sectionIndex, questionIndex, {
                                  placeholder: e.target.value || undefined,
                                })
                              }
                              className={inputClass}
                            />
                          </label>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-3">
                          <label className="inline-flex items-center gap-2 text-sm text-[var(--foreground)]">
                            <input
                              type="checkbox"
                              checked={Boolean(question.required)}
                              onChange={(e) =>
                                mutateQuestion(sectionIndex, questionIndex, {
                                  required: e.target.checked,
                                })
                              }
                              className="ui-focus-ring h-4 w-4 rounded border-[var(--line)]"
                            />
                            {t("survey.editor.required")}
                          </label>

                          {showPrestationRules && prestationOptions.length > 0 && question.id !== "q4" ? (
                            <label className="inline-flex items-center gap-2 text-xs font-semibold text-[color:var(--foreground)]/55">
                              {t("survey.editor.showIfPrestation")}
                              <select
                                value={question.showIfPrestation ?? ""}
                                onChange={(e) =>
                                  mutateQuestion(sectionIndex, questionIndex, {
                                    showIfPrestation: e.target.value || undefined,
                                  })
                                }
                                className="ui-focus-ring rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2 py-1.5 text-xs text-[var(--foreground)]"
                              >
                                <option value="">{t("survey.editor.always")}</option>
                                {prestationOptions.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </label>
                          ) : null}
                        </div>
                      </>
                    )}
                  </SortableQuestion>
                ))}
              </SectionDropZone>
            </SortableContext>

            <button
              type="button"
              onClick={() => addQuestion(sectionIndex)}
              className="ui-btn ui-btn-secondary w-full justify-center gap-2 text-xs"
            >
              <Plus className="h-4 w-4" />
              {t("survey.editor.addQuestion")}
            </button>
          </section>
        ))}

        <DragOverlay>
          {activeQuestion ? (
            <div className="flex items-center gap-2 rounded-xl border border-[var(--accent)]/40 bg-[var(--surface)] p-4 shadow-[var(--shadow-2)]">
              <GripVertical className="h-4 w-4 text-[color:var(--foreground)]/40" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                  {activeQuestion.label || t("survey.editor.questionFallback")}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--foreground)]/45">
                  {questionTypeLabel[activeQuestion.type]}
                </p>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <button
        type="button"
        onClick={addSection}
        className="ui-btn ui-btn-secondary w-full justify-center gap-2"
      >
        <Plus className="h-4 w-4" />
        {t("survey.editor.addScreen")}
      </button>
    </div>
  );
}
