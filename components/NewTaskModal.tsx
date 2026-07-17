"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  Clock3,
  FilePenLine,
  Flag,
  Gauge,
  HelpCircle,
  Info,
  ListChecks,
  Plus,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { priorities, type AdminId, type NewTaskFormState, type Task } from "../lib/types";
import type { ReferenceRecord } from "../lib/referenceData";
import { computeSlotHours } from "../lib/projectedWorkUtils";
import { taskFormSchema, type TaskFormValues, type TaskFormValuesWithSubtasks, type PendingSubtask } from "../lib/validation/taskSchema";
import { normalizeProjectName } from "../lib/normalize";
import { ensureCurrentUserTeamMember, resolveFallbackAssigneeName } from "../lib/ensureCurrentTeamMember";
import { resolveDefaultSubtaskAssignee, teamAdminNameForUser } from "../lib/taskConcernsUser";
import type { CurrentUser } from "../lib/useCurrentUser";
import CustomFieldInputs from "./CustomFieldInputs";
import NewTaskPlanningCalendar, { type ExistingSlot, type PlanningSlot } from "./NewTaskPlanningCalendar";
import { ensureDefaultBoard } from "../lib/v2/boardColumns";
import { getSupabaseBrowser } from "../lib/supabaseBrowser";
import { useBranding } from "../lib/brandingContext";
import { toastError, toastSuccess } from "../lib/toast";
import { useTranslation } from "../lib/i18n/useTranslation";
import { useBoardFields } from "../lib/v2/boardFields";
import {
  attachCustomFieldsAfterCreate,
  type CustomFieldsMap,
  useTaskCustomFields,
} from "../lib/v2/customFieldValues";
import "./onboarding/first-task-tutorial.css";

type WizardStep = 0 | 1 | 2 | 3;

function RequiredStar() {
  return <span className="ml-1 text-[var(--danger)]">*</span>;
}

function FieldHint({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <HelpCircle className="h-3.5 w-3.5 text-[color:var(--foreground)]/40" aria-hidden />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 w-52 -translate-x-1/2 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 text-[10px] font-normal leading-snug text-[color:var(--foreground)]/75 opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-within:opacity-100">
        {text}
      </span>
      <span className="sr-only">{text}</span>
    </span>
  );
}

function hoursFromEstimate(hoursStr: string, daysStr: string, unit: "hours" | "days"): number {
  if (unit === "days") {
    const days = parseFloat(daysStr || "0") || 0;
    return days > 0 ? days * 7 : 0;
  }
  return parseFloat(hoursStr || "0") || 0;
}

function existingSlotsFromTasks(tasks: Task[], excludeId: string | null, untitled: string): ExistingSlot[] {
  const result: ExistingSlot[] = [];
  for (const task of tasks) {
    if (excludeId && task.id === excludeId) continue;
    for (const item of task.projectedWork ?? []) {
      const hours = computeSlotHours(item);
      if (!item.date || hours <= 0) continue;
      result.push({
        date: item.date,
        hours,
        title: task.projectName || untitled,
      });
    }
  }
  return result;
}

export default function NewTaskModal(props: {
  open: boolean;
  editingTaskId: string | null;
  initialValues: NewTaskFormState;
  admins: ReferenceRecord[];
  companies: ReferenceRecord[];
  domains: ReferenceRecord[];
  tasks?: Task[];
  currentUserName?: string | null;
  currentUser?: Pick<CurrentUser, "teamMemberName" | "displayName" | "email" | "id" | "teamMemberId" | "avatarUrl" | "organizationId"> | null;
  tutorialMode?: boolean;
  onCancel: () => void;
  onSubmit: (values: TaskFormValuesWithSubtasks) => Promise<void> | void;
}) {
  const { open, editingTaskId, initialValues, admins, domains, onCancel, tutorialMode = false, tasks = [] } = props;
  const { t } = useTranslation();
  const { branding } = useBranding();
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const [extraDomains, setExtraDomains] = useState<ReferenceRecord[]>([]);
  const [showNewDomain, setShowNewDomain] = useState(false);
  const [newDomainLabel, setNewDomainLabel] = useState("");
  const [addingDomain, setAddingDomain] = useState(false);

  const domainOptions = useMemo(() => {
    const byName = new Map(domains.map((d) => [d.name, d]));
    for (const domain of extraDomains) byName.set(domain.name, domain);
    return Array.from(byName.values());
  }, [domains, extraDomains]);

  const onSubmit = async (values: TaskFormValues) => {
    await props.onSubmit({
      ...values,
      projectName: normalizeProjectName(values.projectName),
      isClientRequest: false,
      clientName: "",
      subtasks: pendingSubtasks,
    } as TaskFormValuesWithSubtasks);

    if (!editingTaskId && Object.keys(customFieldsDraft).length > 0) {
      await attachCustomFieldsAfterCreate({
        projectName: normalizeProjectName(values.projectName),
        company: values.company,
        fields: customFieldsDraft,
      });
    }

    setShowSuccess(true);
    window.setTimeout(() => {
      setShowSuccess(false);
    }, 1600);
  };
  const titleId = useId();
  const prefix = useId();
  const [timeUnit, setTimeUnit] = useState<"hours" | "days">("hours");
  const [step, setStep] = useState<WizardStep>(0);
  const [pendingSubtasks, setPendingSubtasks] = useState<PendingSubtask[]>([]);
  const [newSubName, setNewSubName] = useState("");
  const [newSubDeadline, setNewSubDeadline] = useState("");
  const [newSubAdmin, setNewSubAdmin] = useState("");
  const [boardId, setBoardId] = useState<string | null>(null);
  const [customFieldsDraft, setCustomFieldsDraft] = useState<CustomFieldsMap>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const { fields: boardFields } = useBoardFields(boardId);
  const { values: editingCustomFields, updateValue: updateEditingCustomField } =
    useTaskCustomFields(editingTaskId);

  const defaultValues = useMemo(
    () => initialValues as unknown as TaskFormValues,
    [initialValues],
  );

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    trigger,
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues,
  });

  const createDomain = useCallback(
    async (label: string) => {
      const trimmed = label.trim();
      if (!trimmed || addingDomain) return false;
      setAddingDomain(true);
      const name = `🖥️ ${trimmed}`.trim();
      const { data, error } = await supabase
        .from("domains")
        .insert({ name, color: branding.primaryColor, is_active: true })
        .select("id, name")
        .single();
      if (error || !data) {
        toastError(`Ajout impossible : ${error?.message ?? "erreur"}`);
        setAddingDomain(false);
        return false;
      }
      const created = { id: String(data.id), name: String(data.name) };
      setExtraDomains((prev) => [...prev, created]);
      setValue("domain", created.name, { shouldValidate: true });
      setNewDomainLabel("");
      setShowNewDomain(false);
      setAddingDomain(false);
      toastSuccess(t("newTaskModal.domainAdded"));
      return true;
    },
    [addingDomain, branding.primaryColor, setValue, supabase, t],
  );

  const { replace } = useFieldArray({
    control,
    name: "projectedWork",
  });

  const watchedAdminsRaw = useWatch({ control, name: "admins" });
  const watchedAdmins = useMemo(() => watchedAdminsRaw ?? [], [watchedAdminsRaw]);

  const assigneeOptions = useMemo(() => {
    const byName = new Map<string, ReferenceRecord>();
    for (const admin of admins) {
      if (admin.name.trim()) byName.set(admin.name, admin);
    }
    const fallbackName = resolveFallbackAssigneeName(props.currentUser ?? null);
    if (fallbackName && !byName.has(fallbackName)) {
      byName.set(fallbackName, {
        id: props.currentUser?.teamMemberId ?? `self-${props.currentUser?.id ?? "me"}`,
        name: fallbackName,
        avatarUrl: props.currentUser?.avatarUrl ?? null,
      });
    }
    return Array.from(byName.values());
  }, [admins, props.currentUser]);

  const defaultSubtaskAdmin = useMemo(
    () =>
      resolveDefaultSubtaskAssignee(
        assigneeOptions.map((a) => a.name),
        {
          currentUser: props.currentUser ?? null,
          parentTaskAdmins: watchedAdmins,
        },
      ),
    [assigneeOptions, props.currentUser, watchedAdmins],
  );

  const effectiveSubAdmin = newSubAdmin || defaultSubtaskAdmin;
  const estimatedHoursStr = useWatch({ control, name: "estimatedHours" }) ?? "";
  const estimatedDaysStr = useWatch({ control, name: "estimatedDays" }) ?? "";
  const estimateError = errors.estimatedHours?.message || errors.estimatedDays?.message;
  const projectedWorkWatch = useWatch({ control, name: "projectedWork" }) ?? [];
  const estimatedHoursTotal = hoursFromEstimate(estimatedHoursStr, estimatedDaysStr, timeUnit);
  const existingSlots = useMemo(
    () => existingSlotsFromTasks(tasks, editingTaskId, t("newTaskModal.untitled")),
    [tasks, editingTaskId, t],
  );

  const openSessionRef = useRef<string | null>(null);
  const openSessionKey = `${open}:${editingTaskId ?? "new"}`;

  useEffect(() => {
    if (!open) {
      openSessionRef.current = null;
      return;
    }
    if (openSessionRef.current === openSessionKey) return;
    openSessionRef.current = openSessionKey;

    const timeoutId = window.setTimeout(() => {
      reset(defaultValues);
      setStep(0);
      setPendingSubtasks([]);
      setNewSubName("");
      setNewSubDeadline("");
      setNewSubAdmin("");
      setCustomFieldsDraft({});
      setShowSuccess(false);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [open, openSessionKey, reset, defaultValues]);

  useEffect(() => {
    if (!open) return;
    const timeoutId = window.setTimeout(() => {
      if (watchedAdmins.length > 0) return;
      const fallback =
        teamAdminNameForUser(assigneeOptions.map((a) => a.name), props.currentUser ?? null) ||
        resolveFallbackAssigneeName(props.currentUser ?? null);
      if (!fallback) return;
      setValue("admins", [fallback as AdminId], { shouldValidate: true });
    }, 60);
    return () => window.clearTimeout(timeoutId);
  }, [open, assigneeOptions, props.currentUser, setValue, watchedAdmins.length]);

  useEffect(() => {
    if (!open || !props.currentUser) return;
    if (admins.length > 0) return;
    void ensureCurrentUserTeamMember(getSupabaseBrowser(), props.currentUser);
  }, [open, admins.length, props.currentUser]);

  useEffect(() => {
    if (!open) return;
    void ensureDefaultBoard()
      .then((id) => setBoardId(id))
      .catch(() => setBoardId(null));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const daysNum = parseFloat(initialValues.estimatedDays || "0") || 0;
    const timeoutId = window.setTimeout(() => {
      setTimeUnit(daysNum > 0 ? "days" : "hours");
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [open, initialValues.estimatedDays]);

  useEffect(() => {
    if (!open) return;
    // Petite gestion d'a11y: mettre le focus sur le premier champ.
    const t = window.setTimeout(() => {
      const el = document.getElementById(`${prefix}-project-name`) as HTMLInputElement | null;
      el?.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [open, prefix]);

  useEffect(() => {
    if (!open || !tutorialMode) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, tutorialMode]);

  useEffect(() => {
    if (!open || tutorialMode) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel, tutorialMode]);

  const adminsError = errors.admins?.message;
  const stepFields: Record<WizardStep, Array<keyof TaskFormValues>> = {
    0: ["projectName", "domain", "priority", "admins"],
    1: ["deadline", "estimatedHours", "estimatedDays"],
    2: [],
    3: [],
  };

  const handleNextStep = async () => {
    const valid = await trigger(stepFields[step]);
    if (!valid) return;
    if (step === 1) {
      const hours = hoursFromEstimate(estimatedHoursStr, estimatedDaysStr, timeUnit);
      const current = (projectedWorkWatch as PlanningSlot[]) ?? [];
      if (hours > 0 && current.length === 0) {
        const today = new Date();
        const day = today.getDay();
        const offset = day === 0 ? 1 : day === 6 ? 2 : 0;
        today.setDate(today.getDate() + offset);
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        replace([{ date: `${yyyy}-${mm}-${dd}`, hours: Math.min(hours, 8) }]);
      }
    }
    setStep((prev) => Math.min(prev + 1, 3) as WizardStep);
  };

  const submitTask = handleSubmit(onSubmit);

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (!editingTaskId && step < 3) {
      event.preventDefault();
      void handleNextStep();
      return;
    }
    void submitTask(event);
  };

  const handleStepKeyDown = (event: ReactKeyboardEvent<HTMLFormElement>) => {
    if (event.key !== "Enter" || step >= 3) return;
    const target = event.target as HTMLElement;
    const tagName = target.tagName.toLowerCase();
    if (tagName === "textarea") return;
    event.preventDefault();
    void handleNextStep();
  };

  const syncProjectedWork = (next: PlanningSlot[]) => {
    replace(
      next.map((slot) => ({
        date: slot.date,
        hours: slot.hours,
        ...(slot.startTime ? { startTime: slot.startTime } : {}),
        ...(slot.endTime ? { endTime: slot.endTime } : {}),
      })),
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={[
            "ui-modal-overlay py-8",
            tutorialMode ? "z-[150]" : "z-40",
          ].join(" ")}
          onClick={tutorialMode ? undefined : onCancel}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            data-tutorial="new-task-modal"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-3xl rounded-3xl border border-[var(--line)] bg-[var(--surface)]/95 p-6 shadow-[0_34px_90px_rgba(20,17,13,0.2)] ring-1 ring-[color:var(--line)]/60 backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id={titleId} className="ui-heading text-2xl font-semibold text-[var(--foreground)]">
                {tutorialMode
                  ? t("newTaskModal.firstProjectTitle")
                  : editingTaskId
                    ? t("newTaskModal.editTitle")
                    : t("newTaskModal.newTitle")}
              </h2>
              {!tutorialMode ? (
              <button
                type="button"
                onClick={onCancel}
                className="ui-transition rounded-full border border-transparent p-1.5 text-[color:var(--foreground)]/55 hover:border-[var(--line)] hover:bg-[var(--surface-soft)] hover:text-[color:var(--foreground)]/75"
              >
                <span className="sr-only">{t("newTaskModal.close")}</span>
                <X className="h-4 w-4" />
              </button>
              ) : null}
            </div>

            <form className="space-y-4" onSubmit={handleFormSubmit} onKeyDown={handleStepKeyDown}>
              <input type="hidden" {...register("company")} />
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 0 as WizardStep, label: t("newTaskModal.steps.info"), icon: Info },
                  { id: 1 as WizardStep, label: t("newTaskModal.steps.estimate"), icon: Gauge },
                  { id: 2 as WizardStep, label: t("newTaskModal.steps.planning"), icon: CalendarDays },
                  { id: 3 as WizardStep, label: t("newTaskModal.steps.details"), icon: FilePenLine },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      if (tutorialMode && s.id > step) return;
                      setStep(s.id);
                    }}
                    disabled={tutorialMode && s.id > step}
                    aria-current={step === s.id ? "step" : undefined}
                    className={[
                      "inline-flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-semibold transition",
                      step === s.id
                        ? "border-[var(--line-strong)] bg-[var(--surface-soft)] text-[color:var(--foreground)]/75"
                        : "border-[var(--line)] bg-[var(--surface)] text-[color:var(--foreground)]/65 hover:bg-[var(--surface-soft)]",
                    ].join(" ")}
                  >
                    <s.icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-[color:var(--foreground)]/55">
                {tutorialMode
                  ? step === 0
                    ? t("newTaskModal.tutorialHints.step0")
                    : step === 1
                      ? t("newTaskModal.tutorialHints.step1")
                      : step === 2
                        ? t("newTaskModal.tutorialHints.step2")
                        : t("newTaskModal.tutorialHints.step3")
                  : t("newTaskModal.stepHint", { step: step + 1 })}
              </p>

              {step === 0 && <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="inline-flex items-center gap-1 text-xs font-medium text-[color:var(--foreground)]/75">
                    <Building2 className="h-3.5 w-3.5 text-[color:var(--foreground)]/50" />
                    {t("newTaskModal.projectName")}
                    <RequiredStar />
                    <FieldHint text={t("newTaskModal.projectNameHint")} />
                  </label>
                  <input
                    id={`${prefix}-project-name`}
                    type="text"
                    {...register("projectName")}
                    className={[
                      "ui-focus-ring w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm focus:outline-none",
                      tutorialMode ? "first-task-tutorial__highlight-field" : "",
                    ].join(" ")}
                    placeholder={t("newTaskModal.projectNamePlaceholder")}
                  />
                  {errors.projectName?.message && (
                    <p className="text-[11px] text-[var(--danger)]">{errors.projectName.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor={`${prefix}-domain`} className="inline-flex items-center gap-1 text-xs font-medium text-[color:var(--foreground)]/75">
                    <Info className="h-3.5 w-3.5 text-[color:var(--foreground)]/50" />
                    {t("newTaskModal.domain")}
                    <RequiredStar />
                    <FieldHint text={t("newTaskModal.domainHint")} />
                  </label>
                  <select
                    id={`${prefix}-domain`}
                    {...register("domain")}
                    className="ui-focus-ring w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm focus:outline-none"
                  >
                    {domainOptions.map((domain) => (
                      <option key={domain.id} value={domain.name}>
                        {domain.name}
                      </option>
                    ))}
                  </select>
                  {!showNewDomain ? (
                    <button
                      type="button"
                      onClick={() => setShowNewDomain(true)}
                      className="ui-transition inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--brand-primary)] hover:underline"
                    >
                      <Plus className="h-3 w-3" />
                      {t("newTaskModal.addDomain")}
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newDomainLabel}
                        onChange={(e) => setNewDomainLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void createDomain(newDomainLabel);
                          }
                        }}
                        placeholder={t("newTaskModal.domainPlaceholder")}
                        className="ui-focus-ring min-w-0 flex-1 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs"
                      />
                      <button
                        type="button"
                        disabled={addingDomain || !newDomainLabel.trim()}
                        onClick={() => void createDomain(newDomainLabel)}
                        className="ui-btn ui-btn-primary shrink-0 px-3 py-1.5 text-xs disabled:opacity-50"
                      >
                        {addingDomain ? "…" : "OK"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewDomain(false);
                          setNewDomainLabel("");
                        }}
                        className="ui-transition rounded-lg border border-[var(--line)] px-2 py-1.5 text-xs text-[color:var(--foreground)]/60 hover:bg-[var(--surface-soft)]"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  {errors.domain?.message && (
                    <p className="text-[11px] text-[var(--danger)]">{errors.domain.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor={`${prefix}-priority`} className="inline-flex items-center gap-1 text-xs font-medium text-[color:var(--foreground)]/75">
                    <Flag className="h-3.5 w-3.5 text-[var(--danger)]" />
                    {t("newTaskModal.priority")}
                    <RequiredStar />
                  </label>
                  <select
                    id={`${prefix}-priority`}
                    {...register("priority")}
                    className="ui-focus-ring w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm focus:outline-none"
                  >
                    {priorities.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  {errors.priority?.message && (
                    <p className="text-[11px] text-[var(--danger)]">{errors.priority.message}</p>
                  )}
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="inline-flex items-center gap-1 text-xs font-medium text-[color:var(--foreground)]/75">
                    <Users className="h-3.5 w-3.5 text-[var(--accent-strong)]" />
                    {t("newTaskModal.assignees")}
                    <RequiredStar />
                    <FieldHint text={t("newTaskModal.assigneesHint")} />
                  </label>
                  <fieldset className="grid grid-cols-2 gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2 text-xs text-[var(--foreground)] shadow-sm">
                    <legend className="sr-only">{t("newTaskModal.assigneesLegend")}</legend>
                    {assigneeOptions.length === 0 ? (
                      <p className="col-span-2 px-1 py-2 text-[11px] text-[color:var(--foreground)]/55">
                        {t("newTaskModal.loadingProfile")}
                      </p>
                    ) : (
                    assigneeOptions.map((adminOption) => {
                      const admin = adminOption.name;
                      const checked = watchedAdmins.includes(admin as AdminId);
                      return (
                        <label
                          key={admin}
                          className={`flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 transition ${
                            checked ? "bg-[var(--foreground)] text-[var(--accent-contrast)]" : "hover:bg-[var(--surface-soft)]"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...watchedAdmins, admin]
                                : watchedAdmins.filter((a) => a !== admin);
                              setValue("admins", next as AdminId[], { shouldValidate: true });
                            }}
                            className="h-3 w-3 rounded border-[var(--line-strong)] text-[color:var(--foreground)]/50 focus:ring-[var(--ring)]"
                          />
                          <span>{admin}</span>
                        </label>
                      );
                    })
                    )}
                  </fieldset>
                  {assigneeOptions.length === 1 ? (
                    <p className="text-[10px] text-[color:var(--foreground)]/45">
                      {t("newTaskModal.autoAssignedHint")}
                    </p>
                  ) : null}
                  {adminsError && <p className="text-[11px] text-[var(--danger)]">{adminsError}</p>}
                </div>
              </div>}

              {step === 1 && <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor={`${prefix}-deadline`} className="inline-flex items-center gap-1 text-xs font-medium text-[color:var(--foreground)]/75">
                    <CalendarDays className="h-3.5 w-3.5 text-[var(--warning)]" />
                    {t("newTaskModal.deadline")}
                    <span className="ml-0.5 font-normal text-[color:var(--foreground)]/45">{t("newTaskModal.optional")}</span>
                    <FieldHint text={t("newTaskModal.deadlineHint")} />
                  </label>
                  <input
                    id={`${prefix}-deadline`}
                    type="date"
                    {...register("deadline")}
                    className="ui-focus-ring w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm focus:outline-none"
                  />
                  {errors.deadline?.message && <p className="text-[11px] text-[var(--danger)]">{errors.deadline.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor={`${prefix}-budget`} className="inline-flex items-center gap-1 text-xs font-medium text-[color:var(--foreground)]/75">
                    <Info className="h-3.5 w-3.5 text-[var(--success)]" />
                    {t("newTaskModal.budget")}
                    <FieldHint text={t("newTaskModal.budgetHint")} />
                  </label>
                  <input
                    id={`${prefix}-budget`}
                    type="text"
                    {...register("budget")}
                    className="ui-focus-ring w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm focus:outline-none"
                    placeholder={t("newTaskModal.budgetPlaceholder")}
                  />
                </div>
              </div>}

              {step === 1 && <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
                <div className="space-y-1.5">
                  <label htmlFor={`${prefix}-estimated-time`} className="inline-flex items-center gap-1 text-xs font-medium text-[color:var(--foreground)]/75">
                    <Clock3 className="h-3.5 w-3.5 text-[color:var(--foreground)]/50" />
                    {t("newTaskModal.estimatedWorkload")}
                    <span className="ml-0.5 font-normal text-[color:var(--foreground)]/45">{t("newTaskModal.optional")}</span>
                    <FieldHint text={t("newTaskModal.workloadHint")} />
                  </label>

                  <div className="flex items-center gap-2">
                    <div className="inline-flex rounded-lg border border-[var(--line)] bg-[var(--surface)] p-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          const current = timeUnit === "hours" ? estimatedHoursStr : estimatedDaysStr;
                          setValue("estimatedHours", current, { shouldValidate: true });
                          setValue("estimatedDays", "", { shouldValidate: true });
                          setTimeUnit("hours");
                        }}
                        className={[
                          "rounded-md px-2.5 py-1 text-xs font-medium transition",
                          timeUnit === "hours" ? "bg-[var(--foreground)] text-[var(--accent-contrast)]" : "text-[color:var(--foreground)]/75 hover:bg-[var(--surface-soft)]",
                        ].join(" ")}
                      >
                        {t("newTaskModal.hours")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const current = timeUnit === "hours" ? estimatedHoursStr : estimatedDaysStr;
                          setValue("estimatedDays", current, { shouldValidate: true });
                          setValue("estimatedHours", "", { shouldValidate: true });
                          setTimeUnit("days");
                        }}
                        className={[
                          "rounded-md px-2.5 py-1 text-xs font-medium transition",
                          timeUnit === "days" ? "bg-[var(--foreground)] text-[var(--accent-contrast)]" : "text-[color:var(--foreground)]/75 hover:bg-[var(--surface-soft)]",
                        ].join(" ")}
                      >
                        {t("newTaskModal.days")}
                      </button>
                    </div>

                    <input
                      id={`${prefix}-estimated-time`}
                      type="number"
                      min="0"
                      step="0.5"
                      value={timeUnit === "hours" ? estimatedHoursStr : estimatedDaysStr}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (timeUnit === "hours") {
                          setValue("estimatedHours", v, { shouldValidate: true });
                          setValue("estimatedDays", "", { shouldValidate: true });
                        } else {
                          setValue("estimatedDays", v, { shouldValidate: true });
                          setValue("estimatedHours", "", { shouldValidate: true });
                        }
                      }}
                      className="ui-focus-ring w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm focus:outline-none"
                      placeholder={timeUnit === "hours" ? t("newTaskModal.hoursPlaceholder") : t("newTaskModal.daysPlaceholder")}
                    />
                  </div>

                  <input type="hidden" {...register("estimatedHours")} />
                  <input type="hidden" {...register("estimatedDays")} />
                  <p className="text-[10px] text-[color:var(--foreground)]/50">
                    {timeUnit === "hours"
                      ? t("newTaskModal.hoursVolumeHint")
                      : t("newTaskModal.daysVolumeHint")}
                  </p>

                  {estimateError && <p className="text-[11px] text-[var(--danger)]">{estimateError}</p>}
                </div>
              </div>}

              {step === 2 && (
                <div className="space-y-4">
                  <NewTaskPlanningCalendar
                    estimatedHours={estimatedHoursTotal}
                    slots={(projectedWorkWatch as PlanningSlot[]) ?? []}
                    existingSlots={existingSlots}
                    onChange={syncProjectedWork}
                  />

                  {!editingTaskId ? (
                    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <ListChecks className="h-4 w-4 text-[color:var(--foreground)]/50" />
                        <p className="text-xs font-semibold text-[var(--foreground)]">
                          {t("newTaskModal.subtasks")}
                          {pendingSubtasks.length > 0 && (
                            <span className="ml-1.5 rounded-full bg-[color:var(--foreground)]/12 px-1.5 py-0.5 text-[10px] text-[color:var(--foreground)]/85">
                              {pendingSubtasks.length}
                            </span>
                          )}
                        </p>
                        <FieldHint text={t("newTaskModal.subtasksHint")} />
                      </div>

                      {pendingSubtasks.map((sub, idx) => (
                        <div key={idx} className="flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs">
                          <span className="flex-1 font-medium text-[var(--foreground)] truncate">{sub.name}</span>
                          {sub.deadline && (
                            <span className="text-[color:var(--foreground)]/55 shrink-0">{sub.deadline}</span>
                          )}
                          <span className="text-[color:var(--foreground)]/55 shrink-0">{sub.adminName.split(" ")[0]}</span>
                          <button
                            type="button"
                            onClick={() => setPendingSubtasks((prev) => prev.filter((_, i) => i !== idx))}
                            aria-label={t("newTaskModal.removeSubtask")}
                            className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded text-[color-mix(in_srgb,var(--danger)_65%,var(--foreground))] hover:bg-[color-mix(in_srgb,var(--danger)_8%,var(--surface))] hover:text-[var(--danger)]"
                          >
                            <X className="h-3 w-3" aria-hidden />
                          </button>
                        </div>
                      ))}

                      <div className="flex flex-wrap gap-2">
                        <input
                          type="text"
                          value={newSubName}
                          onChange={(e) => setNewSubName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key !== "Enter") return;
                            e.preventDefault();
                            e.stopPropagation();
                            if (!newSubName.trim()) return;
                            setPendingSubtasks((prev) => [...prev, {
                              name: normalizeProjectName(newSubName),
                              deadline: newSubDeadline,
                              adminName: effectiveSubAdmin,
                            }]);
                            setNewSubName("");
                            setNewSubDeadline("");
                            setNewSubAdmin("");
                          }}
                          placeholder={t("newTaskModal.subtaskNamePlaceholder")}
                          className="ui-focus-ring flex-1 min-w-[160px] rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 text-xs"
                        />
                        <input
                          type="date"
                          value={newSubDeadline}
                          onChange={(e) => setNewSubDeadline(e.target.value)}
                          title={t("newTaskModal.subtaskDeadlineTitle")}
                          className="ui-focus-ring w-36 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 text-xs"
                        />
                        <select
                          value={effectiveSubAdmin}
                          onChange={(e) => setNewSubAdmin(e.target.value)}
                          className="ui-focus-ring rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 text-xs"
                        >
                          {assigneeOptions.map((a) => (
                            <option key={a.id} value={a.name}>{a.name.split(" ")[0]}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            if (!newSubName.trim()) return;
                            setPendingSubtasks((prev) => [...prev, {
                              name: normalizeProjectName(newSubName),
                              deadline: newSubDeadline,
                              adminName: effectiveSubAdmin,
                            }]);
                            setNewSubName("");
                            setNewSubDeadline("");
                            setNewSubAdmin("");
                          }}
                          className="ui-transition flex items-center gap-1 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-semibold text-[color:var(--foreground)]/75 hover:bg-[var(--surface-soft)]"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Ajouter
                        </button>
                      </div>
                      <p className="text-[10px] text-[color:var(--foreground)]/45">
                        Les to-dos seront créées automatiquement avec ce projet comme parent.
                      </p>
                    </div>
                  ) : null}
                </div>
              )}

              {step === 3 && boardFields.length > 0 ? (
                <CustomFieldInputs
                  fields={boardFields}
                  values={editingTaskId ? editingCustomFields : customFieldsDraft}
                  onChange={(field, value) => {
                    if (editingTaskId) {
                      void updateEditingCustomField(field, value);
                      return;
                    }
                    setCustomFieldsDraft((prev) => ({ ...prev, [field.key]: value }));
                  }}
                />
              ) : null}

              {step === 3 && <div className="space-y-1.5">
                <label htmlFor={`${prefix}-description`} className="inline-flex items-center gap-1 text-xs font-medium text-[color:var(--foreground)]/75">
                  {t("newTaskModal.description")}
                  <FieldHint text={t("newTaskModal.descriptionHint")} />
                </label>
                <textarea
                  id={`${prefix}-description`}
                  {...register("description")}
                  className="ui-focus-ring min-h-[80px] w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm focus:outline-none"
                  placeholder={t("newTaskModal.descriptionPlaceholder")}
                />
              </div>}

              <div className="flex items-center justify-end gap-2 pt-2">
                {!tutorialMode ? (
                <button
                  type="button"
                  onClick={onCancel}
                  className="ui-transition inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-medium text-[color:var(--foreground)]/60 hover:bg-[var(--surface-soft)]"
                >
                  <X className="h-3.5 w-3.5" />
                  {t("newTaskModal.cancel")}
                </button>
                ) : null}
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={() => setStep((prev) => Math.max(prev - 1, 0) as WizardStep)}
                    className="ui-transition inline-flex items-center gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[color:var(--foreground)]/80 hover:bg-[var(--surface-soft)]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {t("newTaskModal.back")}
                  </button>
                ) : null}
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      void handleNextStep();
                    }}
                    className={[
                      "ui-transition inline-flex items-center gap-1 rounded-xl px-5 py-2 text-sm font-semibold hover:opacity-90",
                      tutorialMode
                        ? "bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-strong)]"
                        : "bg-[var(--foreground)] text-[var(--accent-contrast)]",
                    ].join(" ")}
                  >
                    <ArrowRight className="h-4 w-4" />
                    {t("newTaskModal.continue")}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || showSuccess}
                    className={[
                      "ui-transition inline-flex items-center gap-1 rounded-xl px-5 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-70",
                      tutorialMode
                        ? "bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[var(--accent-strong)]"
                        : "bg-[var(--foreground)] text-[var(--accent-contrast)]",
                    ].join(" ")}
                  >
                    <Check className="h-4 w-4" />
                    {editingTaskId
                      ? t("newTaskModal.save")
                      : tutorialMode
                        ? t("newTaskModal.createFirstProject")
                        : t("newTaskModal.createTask")}
                  </button>
                )}
              </div>
            </form>

            <AnimatePresence>
              {showSuccess ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 flex items-center justify-center rounded-3xl bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] backdrop-blur-sm"
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 12 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.92, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 320, damping: 22 }}
                    className="flex flex-col items-center gap-3 px-6 text-center"
                  >
                    <motion.span
                      initial={{ scale: 0.4, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 16, delay: 0.05 }}
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[0_12px_40px_color-mix(in_srgb,var(--accent)_45%,transparent)]"
                    >
                      <Sparkles className="h-7 w-7" />
                    </motion.span>
                    <p className="ui-heading text-xl font-semibold text-[var(--foreground)]">
                      {tutorialMode ? t("newTaskModal.successFirstTitle") : t("newTaskModal.successTitle")}
                    </p>
                    <p className="max-w-xs text-sm text-[color:var(--foreground)]/60">
                      {tutorialMode
                        ? t("newTaskModal.successFirstBody")
                        : t("newTaskModal.successBody")}
                    </p>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

