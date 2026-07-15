"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import {
  Archive,
  BarChart3,
  CalendarDays,
  ClipboardList,
  Command as CommandIcon,
  KanbanSquare,
  LayoutTemplate,
  Plus,
  Search,
  Table2,
  Users,
} from "lucide-react";
import { toastError, toastSuccess } from "../../../lib/toast";
import { V2ShellSlotSetter } from "../../../lib/v2/shellSlotsContext";
import { AdminAvatarContext } from "../../../lib/adminAvatarContext";
import {
  priorities,
  type ColumnId,
  type Priority,
  type Task,
  type NewTaskFormState,
  initialFormState,
} from "../../../lib/types";
import { useNowInterval } from "../../../lib/useNowInterval";
import { useReferenceData } from "../../../lib/useReferenceData";
import { useTasks } from "../../../lib/useTasks";
import { useEvents } from "../../../lib/useEvents";
import { useCurrentUser } from "../../../lib/useCurrentUser";
import { useBranding } from "../../../lib/brandingContext";
import { teamAdminNameForUser } from "../../../lib/taskConcernsUser";
import {
  ensureCurrentUserTeamMember,
  resolveFallbackAssigneeName,
} from "../../../lib/ensureCurrentTeamMember";
import { getSupabaseBrowser } from "../../../lib/supabaseBrowser";
import { useTaskManager } from "../../../lib/useTaskManager";
import { DONE_COLUMN_NAME } from "../../../lib/workflowConstants";
import { syncAdminColorAssignments } from "../../../lib/adminColorAssignments";
import { getAdminColorPaletteSize } from "../../../lib/kanbanStyles";
import { mapTaskRow } from "../../../lib/taskMappers";
import { completedAtIsoForNewTaskInColumn } from "../../../lib/completedAt";
import { markTaskMutatedLocally, markTasksMutatedLocally } from "../../../lib/taskMutatedLocally";
import { normalizeProjectName } from "../../../lib/normalize";
import { useAppShortcuts } from "../../../lib/v2/useAppShortcuts";
import { useAutoArchiveHours } from "../../../lib/v2/v2Preferences";
import { getTemplateById, TASK_TEMPLATES } from "../../../lib/v2/taskTemplates";
import { resolveColumnRefs } from "../../../lib/v2/boardColumns";
import { canAccessTeamWorkload } from "../../../lib/billing/plans";
import { useBillingPlan } from "../../../lib/billing/useBillingPlan";
import DashboardNotificationBell from "../../DashboardNotificationBell";
import V2CommandPalette, { type PaletteAction } from "./V2CommandPalette";
import V2QuickAddTask from "./V2QuickAddTask";
import { useFirstTaskTutorialOptional } from "../../../lib/onboarding/firstTaskTutorialContext";
import { useExplorationTutorialOptional } from "../../../lib/onboarding/explorationTutorialContext";
import { useGamificationOptional } from "../../../lib/gamification/gamificationContext";

const V2ListView = dynamic(() => import("../list/V2ListView"));

const KanbanBoardView = dynamic(() => import("../../KanbanBoardView"), {
  loading: () => (
    <div className="grid gap-4 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-[min(70vh,520px)] animate-pulse rounded-2xl bg-[var(--surface-soft)]" />
      ))}
    </div>
  ),
});

type MainTab =
  | "kanban"
  | "list"
  | "todo"
  | "calendar"
  | "analytics"
  | "archives"
  | "workload";
const MAIN_TAB_SET = new Set<MainTab>([
  "kanban",
  "list",
  "todo",
  "calendar",
  "analytics",
  "archives",
  "workload",
]);

const MAIN_TABS: { id: MainTab; label: string; icon: typeof KanbanSquare }[] = [
  { id: "todo", label: "Mes tâches", icon: ClipboardList },
  { id: "kanban", label: "Tableau Kanban", icon: KanbanSquare },
  { id: "list", label: "Vue liste", icon: Table2 },
  { id: "calendar", label: "Calendrier", icon: CalendarDays },
  { id: "workload", label: "Charge équipe", icon: Users },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "archives", label: "Archives", icon: Archive },
];

const ToDoListView = dynamic(() => import("../../ToDoListView"));
const AnalyticsView = dynamic(() => import("../../AnalyticsView"));
const ArchivesView = dynamic(() => import("../../ArchivesView"));
const CalendarView = dynamic(() => import("../../CalendarView"));
const WorkloadView = dynamic(() => import("../../WorkloadView"));
const TaskDetailPanel = dynamic(() => import("../../TaskDetailPanel"));
const NewTaskModal = dynamic(() => import("../../NewTaskModal"));

export default function V2DashboardHomePage() {
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user: currentUser } = useCurrentUser();
  const { branding } = useBranding();
  const { tasks, setTasks, optimisticUpdate } = useTasks();
  const { events: calendarEvents } = useEvents();
  const {
    admins: adminRecords,
    columns: columnRecords,
    companies: companyRecords,
    domains: domainRecords,
  } = useReferenceData();
  const { plan } = useBillingPlan();

  const teamMemberCount = adminRecords.length;
  const showTeamWorkload = canAccessTeamWorkload(plan, teamMemberCount);
  const visibleMainTabs = useMemo(
    () => MAIN_TABS.filter((tab) => tab.id !== "workload" || showTeamWorkload),
    [showTeamWorkload],
  );
  const [autoArchiveHours] = useAutoArchiveHours();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [newTask, setNewTask] = useState<NewTaskFormState>(initialFormState);
  const [newTaskColumn, setNewTaskColumn] = useState<ColumnId>("À faire");
  const now = useNowInterval(60_000);

  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") ?? "");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const quickAddRef = useRef<HTMLInputElement | null>(null);
  const [quickAddPrefill, setQuickAddPrefill] = useState<string | undefined>();
  const onboardingTaskHandledRef = useRef<string | null>(null);

  const activeTab = useMemo<MainTab>(() => {
    const fromParams = params.tab;
    if (typeof fromParams === "string" && MAIN_TAB_SET.has(fromParams as MainTab)) {
      return fromParams as MainTab;
    }
    const match = pathname.match(/^\/dashboard\/([^/?#]+)/);
    const fromPath = match?.[1];
    if (fromPath && MAIN_TAB_SET.has(fromPath as MainTab)) {
      return fromPath as MainTab;
    }
    return "kanban";
  }, [params.tab, pathname]);

  const navigateToTab = useCallback(
    (tab: MainTab) => {
      const q = searchQuery.trim();
      const next = q ? `/dashboard/${tab}?q=${encodeURIComponent(q)}` : `/dashboard/${tab}`;
      router.push(next);
    },
    [router, searchQuery],
  );

  useEffect(() => {
    if (activeTab !== "workload" || showTeamWorkload) return;
    navigateToTab("kanban");
  }, [activeTab, showTeamWorkload, navigateToTab]);

  useEffect(() => {
    const fromParams = params.tab;
    const fromPath = pathname.match(/^\/dashboard\/([^/?#]+)/)?.[1];
    const tab = typeof fromParams === "string" ? fromParams : fromPath;
    if (tab === "inbox") {
      navigateToTab("todo");
    }
  }, [params.tab, pathname, navigateToTab]);

  const taskCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [lastFocusedTaskId, setLastFocusedTaskId] = useState<string | null>(null);

  const admins = useMemo(() => adminRecords.map((item) => item.name), [adminRecords]);

  const adminNamesForPalette = useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const r of adminRecords) {
      const t = r.name.trim();
      if (t && !seen.has(t)) {
        seen.add(t);
        ordered.push(t);
      }
    }
    const extras: string[] = [];
    for (const t of tasks) {
      for (const a of t.admins) {
        const x = a?.trim();
        if (x && !seen.has(x)) extras.push(x);
      }
    }
    extras.sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
    for (const x of extras) {
      if (!seen.has(x)) {
        seen.add(x);
        ordered.push(x);
      }
    }
    return ordered;
  }, [adminRecords, tasks]);

  useLayoutEffect(() => {
    syncAdminColorAssignments(adminNamesForPalette, getAdminColorPaletteSize());
  }, [adminNamesForPalette]);

  const columns = useMemo(() => columnRecords.map((item) => item.name), [columnRecords]);
  const openTodoColumns = useMemo(
    () =>
      columnRecords
        .filter((col) => !col.isDone && col.name !== "Terminé")
        .map((col) => col.name),
    [columnRecords],
  );
  const companies = useMemo(() => companyRecords.map((item) => item.name), [companyRecords]);

  const adminAvatarMap = useMemo<Record<string, string | null>>(
    () => Object.fromEntries(adminRecords.map((r) => [r.name, r.avatarUrl ?? null])),
    [adminRecords],
  );

  const effectiveUser = useMemo(
    () => teamAdminNameForUser(admins, currentUser),
    [currentUser, admins],
  );

  useEffect(() => {
    const t = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      const normalized = searchQuery.trim();
      if (normalized) {
        next.set("q", normalized);
      } else {
        next.delete("q");
      }
      const current = searchParams.toString();
      const upcoming = next.toString();
      if (current !== upcoming) {
        const target = upcoming ? `${pathname}?${upcoming}` : pathname;
        router.replace(target, { scroll: false });
      }
    }, 400);
    return () => window.clearTimeout(t);
  }, [pathname, router, searchParams, searchQuery]);

  const lastHandledTaskFromUrlRef = useRef<string | null>(null);
  useEffect(() => {
    const taskFromUrl = searchParams.get("task");
    if (!taskFromUrl || tasks.length === 0) return;
    if (lastHandledTaskFromUrlRef.current === taskFromUrl) return;
    if (!tasks.some((t) => t.id === taskFromUrl)) return;
    lastHandledTaskFromUrlRef.current = taskFromUrl;
    queueMicrotask(() => setSelectedTaskId(taskFromUrl));
    const next = new URLSearchParams();
    const q = searchParams.get("q");
    if (q) next.set("q", q);
    const tabSegment = MAIN_TAB_SET.has(activeTab) ? activeTab : "kanban";
    const target =
      next.toString().length > 0
        ? `/dashboard/${tabSegment}?${next.toString()}`
        : `/dashboard/${tabSegment}`;
    if (pathname !== target || searchParams.has("task")) {
      router.replace(target, { scroll: false });
    }
  }, [tasks, searchParams, pathname, router, activeTab]);

  const defaultAdminName = useMemo(() => {
    const matched = teamAdminNameForUser(admins, currentUser);
    if (matched) return matched;
    return resolveFallbackAssigneeName(currentUser) ?? "";
  }, [currentUser, admins]);

  useEffect(() => {
    if (!currentUser?.id) return;
    if (adminRecords.length > 0 && defaultAdminName) return;
    void ensureCurrentUserTeamMember(supabase, currentUser);
  }, [currentUser, adminRecords.length, defaultAdminName, supabase]);

  const tutorial = useFirstTaskTutorialOptional();
  const exploration = useExplorationTutorialOptional();
  const gamification = useGamificationOptional();
  const firstTaskTutorialCompleted = Boolean(
    currentUser?.firstTaskTutorialCompleted ||
      gamification?.profile.firstTaskTutorialCompleted,
  );
  const firstTaskTutorialEligible = tasks.length === 0 && !firstTaskTutorialCompleted;
  const tutorialHighlightButton =
    Boolean(tutorial?.active) && tutorial?.step === "clickNewTask" && firstTaskTutorialEligible;
  const tutorialModalActive =
    Boolean(tutorial?.active) &&
    tutorial?.step === "fillForm" &&
    isFormOpen &&
    firstTaskTutorialEligible;

  const tutorialAutoCompletedRef = useRef(false);
  useEffect(() => {
    if (tutorialAutoCompletedRef.current) return;
    if (tasks.length === 0 || firstTaskTutorialCompleted) return;
    if (
      !tutorial?.active &&
      gamification?.profile.tutorials.first_task?.status !== "in_progress"
    ) {
      return;
    }
    tutorialAutoCompletedRef.current = true;
    tutorial?.finishCelebration();
    void gamification?.completeTutorial("first_task");
  }, [
    tasks.length,
    firstTaskTutorialCompleted,
    tutorial,
    gamification,
  ]);

  useEffect(() => {
    if (!tutorial?.active) return;
    if (exploration?.boardActive) return;
    if (tutorial.step === "celebrate" || tutorial.step === "done") return;
    if (activeTab === "kanban") return;
    tutorial.dismissTutorial();
    if (isFormOpen) queueMicrotask(() => setIsFormOpen(false));
  }, [activeTab, tutorial, isFormOpen, exploration?.boardActive]);

  const handleOpenForm = useCallback((options?: { fromTutorialButton?: boolean }) => {
    if (
      firstTaskTutorialEligible &&
      tutorial?.active &&
      tutorial.step === "clickNewTask" &&
      !options?.fromTutorialButton
    ) {
      return;
    }
    const firstCompany = companyRecords[0]?.name ?? initialFormState.company;
    const firstDomain = domainRecords[0]?.name ?? initialFormState.domain;
    setEditingTaskId(null);
    setNewTask({
      ...initialFormState,
      company: firstCompany,
      domain: firstDomain,
      admins: defaultAdminName ? [defaultAdminName] : [],
    });
    setNewTaskColumn((columns[0] as ColumnId) ?? "À faire");
    setIsFormOpen(true);
    if (firstTaskTutorialEligible) {
      tutorial?.notifyNewTaskClicked();
      tutorial?.notifyFormOpened();
    }
  }, [defaultAdminName, columns, companyRecords, domainRecords, tutorial, firstTaskTutorialEligible]);

  const handleOpenFormForColumn = useCallback(
    (column: ColumnId) => {
      if (
        firstTaskTutorialEligible &&
        tutorial?.active &&
        (tutorial.step === "clickNewTask" || tutorial.step === "fillForm")
      ) {
        return;
      }
      const firstCompany = companyRecords[0]?.name ?? initialFormState.company;
      const firstDomain = domainRecords[0]?.name ?? initialFormState.domain;
      setEditingTaskId(null);
      setNewTask({
        ...initialFormState,
        company: firstCompany,
        domain: firstDomain,
        admins: defaultAdminName ? [defaultAdminName] : [],
      });
      setNewTaskColumn(column);
      setIsFormOpen(true);
    },
    [defaultAdminName, companyRecords, domainRecords, tutorial, firstTaskTutorialEligible],
  );

  const handleCloseForm = useCallback(() => {
    if (tutorialModalActive) return;
    const firstCompany = companyRecords[0]?.name ?? initialFormState.company;
    const firstDomain = domainRecords[0]?.name ?? initialFormState.domain;
    setIsFormOpen(false);
    setNewTask({
      ...initialFormState,
      company: firstCompany,
      domain: firstDomain,
      admins: defaultAdminName ? [defaultAdminName] : [],
    });
    setNewTaskColumn((columns[0] as ColumnId) ?? "À faire");
  }, [companyRecords, domainRecords, defaultAdminName, columns, tutorialModalActive]);

  const handleTaskFormDone = useCallback(() => {
    const firstCompany = companyRecords[0]?.name ?? initialFormState.company;
    const firstDomain = domainRecords[0]?.name ?? initialFormState.domain;
    if (firstTaskTutorialEligible && tutorial?.active && tutorial.step === "fillForm") {
      tutorial.notifyTaskCreated();
    }
    setIsFormOpen(false);
    setNewTask({
      ...initialFormState,
      company: firstCompany,
      domain: firstDomain,
      admins: defaultAdminName ? [defaultAdminName] : [],
    });
    setNewTaskColumn((columns[0] as ColumnId) ?? "À faire");
  }, [companyRecords, domainRecords, defaultAdminName, columns, tutorial, firstTaskTutorialEligible]);

  const openEditForTask = useCallback((task: Task) => {
    setEditingTaskId(task.id);
    setNewTaskColumn(task.column);
    setNewTask({
      projectName: task.projectName,
      company: task.company,
      domain: task.domain,
      admins: task.admins,
      isClientRequest: task.isClientRequest,
      clientName: task.clientName,
      deadline: task.deadline,
      budget: task.budget,
      description: task.description,
      priority: task.priority,
      projectedWork: task.projectedWork?.length ? [...task.projectedWork] : [],
      estimatedHours: task.estimatedHours > 0 ? String(task.estimatedHours) : "",
      estimatedDays: task.estimatedDays > 0 ? String(task.estimatedDays) : "",
    });
    setIsFormOpen(true);
  }, []);

  const {
    handleCreateTask,
    handleArchiveTask,
    handleDeleteTask,
    handlePermanentDelete,
    handleInlineSave,
    handleRestoreTask,
    handleMoveTask,
  } = useTaskManager({
    supabase,
    tasks,
    setTasks,
    optimisticUpdate,
    columns,
    columnRecords,
    newTaskColumn,
    editingTaskId,
    onTaskFormDone: handleTaskFormDone,
  });

  /** Création rapide « <3 s » : titre seul, valeurs par défaut, ajout optimiste + rollback. */
  const handleQuickCreate = useCallback(
    async (rawTitle: string) => {
      const title = normalizeProjectName(rawTitle);
      if (!title) return;
      const column = (columns[0] as ColumnId) ?? "À faire";
      const firstCompany = companyRecords[0]?.name ?? initialFormState.company;
      const firstDomain = domainRecords[0]?.name ?? initialFormState.domain;
      const admins0 = defaultAdminName ? [defaultAdminName] : [];
      const tempId = `temp-${globalThis.crypto?.randomUUID?.() ?? String(Date.now())}`;
      const nowIso = new Date().toISOString();

      const optimisticTask: Task = {
        id: tempId,
        createdAt: nowIso,
        projectName: title,
        company: firstCompany,
        domain: firstDomain,
        admins: admins0,
        isClientRequest: false,
        clientName: "",
        requestDate: nowIso,
        deadline: "",
        budget: "",
        description: "",
        column,
        priority: "Moyenne",
        projectedWork: [],
        elapsedMs: 0,
        isRunning: false,
        isArchived: false,
        estimatedHours: 0,
        estimatedDays: 0,
        completedAt: completedAtIsoForNewTaskInColumn(column) ?? undefined,
      };
      setTasks((prev) => [...prev, optimisticTask]);

      const payload = {
        project_name: title,
        company: firstCompany,
        domain: firstDomain,
        admin: admins0.join(","),
        is_client_request: false,
        client_name: "",
        deadline: null,
        budget: "",
        description: "",
        priority: "Moyenne" as const,
        projected_work: [],
        estimated_hours: 0,
        estimated_days: 0,
        ...resolveColumnRefs(column, columnRecords),
        lane: admins0[0] ?? null,
        elapsed_ms: 0,
        is_running: false,
        last_start_time_ms: null,
        is_archived: false,
        completed_at: completedAtIsoForNewTaskInColumn(column),
      };

      const { data, error } = await supabase.from("tasks").insert(payload).select().single();
      if (error || !data) {
        setTasks((prev) => prev.filter((t) => t.id !== tempId));
        toastError(`Impossible de créer la tâche : ${error?.message ?? "erreur inconnue"}`);
        return;
      }
      const created = mapTaskRow(data);
      markTaskMutatedLocally(created.id);
      setTasks((prev) => {
        const cleaned = prev.filter((t) => t.id !== tempId && t.id !== created.id);
        return [...cleaned, created];
      });
      toastSuccess("Tâche créée");
    },
    [columns, columnRecords, companyRecords, domainRecords, defaultAdminName, setTasks, supabase],
  );

  const clearOnboardingTaskParams = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("taskDraft");
    next.delete("createTask");
    next.delete("quickAdd");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (searchParams.get("quickAdd") !== "1") return;

    const draft = searchParams.get("taskDraft")?.trim() ?? "";
    const shouldCreate = searchParams.get("createTask") === "1";
    const signature = `${shouldCreate ? "create" : "prefill"}:${draft}`;

    // Retirer tout de suite les paramètres d'onboarding pour ne pas bloquer la navigation.
    clearOnboardingTaskParams();

    if (onboardingTaskHandledRef.current === signature) return;
    onboardingTaskHandledRef.current = signature;

    const applyQuickAdd = () => {
      if (shouldCreate && draft) {
        void handleQuickCreate(draft);
        return;
      }
      if (draft) {
        setQuickAddPrefill(draft);
      } else {
        window.setTimeout(() => quickAddRef.current?.focus(), 250);
      }
    };

    if (activeTab !== "kanban") {
      navigateToTab("kanban");
      window.setTimeout(applyQuickAdd, 280);
      return;
    }

    applyQuickAdd();
  }, [
    activeTab,
    clearOnboardingTaskParams,
    handleQuickCreate,
    navigateToTab,
    searchParams,
  ]);

  const handleQuickCreateForColumn = useCallback(
    async (rawTitle: string, targetColumn: ColumnId) => {
      const title = normalizeProjectName(rawTitle);
      if (!title) return;
      const column = targetColumn;
      const firstCompany = companyRecords[0]?.name ?? initialFormState.company;
      const firstDomain = domainRecords[0]?.name ?? initialFormState.domain;
      const admins0 = defaultAdminName ? [defaultAdminName] : [];
      const tempId = `temp-${globalThis.crypto?.randomUUID?.() ?? String(Date.now())}`;
      const nowIso = new Date().toISOString();

      const optimisticTask: Task = {
        id: tempId,
        createdAt: nowIso,
        projectName: title,
        company: firstCompany,
        domain: firstDomain,
        admins: admins0,
        isClientRequest: false,
        clientName: "",
        requestDate: nowIso,
        deadline: "",
        budget: "",
        description: "",
        column,
        priority: "Moyenne",
        projectedWork: [],
        elapsedMs: 0,
        isRunning: false,
        isArchived: false,
        estimatedHours: 0,
        estimatedDays: 0,
        completedAt: completedAtIsoForNewTaskInColumn(column) ?? undefined,
      };
      setTasks((prev) => [...prev, optimisticTask]);

      const payload = {
        project_name: title,
        company: firstCompany,
        domain: firstDomain,
        admin: admins0.join(","),
        is_client_request: false,
        client_name: "",
        deadline: null,
        budget: "",
        description: "",
        priority: "Moyenne" as const,
        projected_work: [],
        estimated_hours: 0,
        estimated_days: 0,
        ...resolveColumnRefs(column, columnRecords),
        lane: admins0[0] ?? null,
        elapsed_ms: 0,
        is_running: false,
        last_start_time_ms: null,
        is_archived: false,
        completed_at: completedAtIsoForNewTaskInColumn(column),
      };

      const { data, error } = await supabase.from("tasks").insert(payload).select().single();
      if (error || !data) {
        setTasks((prev) => prev.filter((t) => t.id !== tempId));
        toastError(`Impossible de créer la tâche : ${error?.message ?? "erreur inconnue"}`);
        return;
      }
      const created = mapTaskRow(data);
      markTaskMutatedLocally(created.id);
      setTasks((prev) => {
        const cleaned = prev.filter((t) => t.id !== tempId && t.id !== created.id);
        return [...cleaned, created];
      });
      toastSuccess("Tâche créée");
    },
    [columnRecords, companyRecords, domainRecords, defaultAdminName, setTasks, supabase],
  );

  const domainNames = useMemo(() => domainRecords.map((d) => d.name), [domainRecords]);

  useEffect(() => {
    const cutoff = Date.now() - autoArchiveHours * 60 * 60 * 1000;
    const toArchive = tasks.filter(
      (t) =>
        t.column === DONE_COLUMN_NAME &&
        !t.isArchived &&
        !t.parentTaskId &&
        t.completedAt &&
        new Date(t.completedAt).getTime() < cutoff,
    );
    for (const t of toArchive) {
      void optimisticUpdate(t.id, { ...t, isArchived: true }, { is_archived: true }).catch(() => {});
    }
  }, [tasks, autoArchiveHours, optimisticUpdate]);

  const insertTaskRow = useCallback(
    async (payload: Record<string, unknown>): Promise<Task | null> => {
      const { data, error } = await supabase.from("tasks").insert(payload).select().single();
      if (error || !data) {
        toastError(`Création impossible : ${error?.message ?? "erreur inconnue"}`);
        return null;
      }
      const created = mapTaskRow(data);
      markTaskMutatedLocally(created.id);
      setTasks((prev) => {
        const cleaned = prev.filter((t) => t.id !== created.id);
        return [...cleaned, created];
      });
      return created;
    },
    [setTasks, supabase],
  );

  const handleApplyTemplate = useCallback(
    async (templateId: string) => {
      const tpl = getTemplateById(templateId);
      if (!tpl) return;
      const column = (columns[0] as ColumnId) ?? "À faire";
      const firstCompany = companyRecords[0]?.name ?? initialFormState.company;
      const domain = domainNames.includes(tpl.domain)
        ? tpl.domain
        : (domainRecords[0]?.name ?? initialFormState.domain);
      const admins0 = defaultAdminName ? [defaultAdminName] : [];
      const parent = await insertTaskRow({
        project_name: tpl.name,
        company: firstCompany,
        domain,
        admin: admins0.join(","),
        is_client_request: false,
        client_name: "",
        deadline: null,
        budget: "",
        description: tpl.description,
        priority: tpl.priority,
        projected_work: [],
        estimated_hours: 0,
        estimated_days: 0,
        ...resolveColumnRefs(column, columnRecords),
        lane: admins0[0] ?? null,
        elapsed_ms: 0,
        is_running: false,
        last_start_time_ms: null,
        is_archived: false,
        completed_at: completedAtIsoForNewTaskInColumn(column),
      });
      if (!parent) return;
      const subRows = tpl.subtasks.map((name) => ({
        project_name: name,
        company: firstCompany,
        domain,
        admin: admins0.join(","),
        lane: admins0[0] ?? null,
        deadline: null,
        ...resolveColumnRefs(column, columnRecords),
        priority: "Moyenne" as const,
        is_archived: false,
        is_client_request: false,
        parent_task_id: parent.id,
        estimated_hours: 0,
        estimated_days: 0,
        elapsed_ms: 0,
        is_running: false,
      }));
      const { data: subData, error: subError } = await supabase.from("tasks").insert(subRows).select();
      if (!subError && subData) {
        const rows = subData as { id: string }[];
        markTasksMutatedLocally(rows.map((r) => r.id).filter(Boolean));
        setTasks((prev) => [...prev, ...subData.map(mapTaskRow)]);
      }
      toastSuccess(`Modèle « ${tpl.name} » appliqué`);
    },
    [columns, columnRecords, companyRecords, defaultAdminName, domainNames, domainRecords, insertTaskRow, setTasks, supabase],
  );

  const activeTasks = useMemo(() => {
    const roots = tasks.filter((task) => !task.isArchived && !task.parentTaskId);
    const subtaskMap = new Map<string, Task[]>();
    for (const t of tasks) {
      if (t.parentTaskId) {
        const arr = subtaskMap.get(t.parentTaskId) ?? [];
        arr.push(t);
        subtaskMap.set(t.parentTaskId, arr);
      }
    }
    return roots.map((t) => ({ ...t, subtasks: subtaskMap.get(t.id) ?? [] }));
  }, [tasks]);

  const archivedTasks = useMemo(
    () => tasks.filter((task) => task.isArchived && !task.parentTaskId),
    [tasks],
  );

  const workloadFlatTasks = useMemo(
    () => tasks.filter((t) => !t.isArchived && t.column !== DONE_COLUMN_NAME),
    [tasks],
  );

  const filteredActiveTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return activeTasks.filter((task) => {
      if (!query) return true;
      const haystack = [
        task.projectName,
        task.company,
        task.domain,
        task.clientName,
        task.description,
        task.admins.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [activeTasks, searchQuery]);

  const analyticsTasks = useMemo(() => [...activeTasks, ...archivedTasks], [activeTasks, archivedTasks]);

  const selectedTask = useMemo(
    () => (selectedTaskId ? (tasks.find((task) => task.id === selectedTaskId) ?? null) : null),
    [selectedTaskId, tasks],
  );

  const closeTaskDetailPanel = useCallback((restoreFocus = true) => {
    const targetTaskId = lastFocusedTaskId;
    setSelectedTaskId(null);
    if (!restoreFocus || !targetTaskId) return;
    window.setTimeout(() => {
      taskCardRefs.current[targetTaskId]?.focus();
    }, 0);
  }, [lastFocusedTaskId]);

  useEffect(() => {
    if (!selectedTaskId) return;
    const exists = tasks.some((task) => task.id === selectedTaskId && !task.isArchived);
    if (!exists) {
      const timeoutId = window.setTimeout(() => {
        closeTaskDetailPanel(false);
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }
  }, [closeTaskDetailPanel, selectedTaskId, tasks]);

  const focusQuickAdd = useCallback(() => {
    if (activeTab !== "kanban") {
      navigateToTab("kanban");
      window.setTimeout(() => quickAddRef.current?.focus(), 200);
      return;
    }
    if (quickAddRef.current) {
      quickAddRef.current.focus();
    } else {
      handleOpenForm();
    }
  }, [activeTab, handleOpenForm, navigateToTab]);

  const focusSearch = useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

  const cycleActiveTaskStatus = useCallback(() => {
    const id = selectedTaskId ?? lastFocusedTaskId;
    if (!id || columns.length === 0) return;
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const idx = columns.indexOf(task.column);
    const nextColumn = columns[(idx + 1) % columns.length] as ColumnId;
    if (nextColumn && nextColumn !== task.column) {
      handleMoveTask(id, nextColumn);
    }
  }, [columns, handleMoveTask, lastFocusedTaskId, selectedTaskId, tasks]);

  const cycleActiveTaskPriority = useCallback(() => {
    const id = selectedTaskId ?? lastFocusedTaskId;
    if (!id) return;
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const idx = priorities.indexOf(task.priority);
    const nextPriority = priorities[(idx + 1) % priorities.length];
    if (nextPriority && nextPriority !== task.priority) {
      void handleInlineSave(id, { priority: nextPriority }, { priority: nextPriority });
    }
  }, [handleInlineSave, lastFocusedTaskId, selectedTaskId, tasks]);

  useAppShortcuts({
    "$mod+k": (event) => {
      event.preventDefault();
      setIsCommandOpen((prev) => !prev);
    },
    "/": (event) => {
      event.preventDefault();
      searchInputRef.current?.focus();
    },
    c: (event) => {
      event.preventDefault();
      focusQuickAdd();
    },
    n: (event) => {
      event.preventDefault();
      handleOpenForm();
    },
    s: (event) => {
      event.preventDefault();
      cycleActiveTaskStatus();
    },
    p: (event) => {
      event.preventDefault();
      cycleActiveTaskPriority();
    },
    "g i": () => navigateToTab("todo"),
    "g k": () => navigateToTab("kanban"),
    "g l": () => navigateToTab("list"),
    "g t": () => navigateToTab("todo"),
    "g c": () => navigateToTab("calendar"),
    ...(showTeamWorkload ? { "g w": () => navigateToTab("workload") } : {}),
    "g a": () => navigateToTab("analytics"),
    "g r": () => navigateToTab("archives"),
    "g d": () => router.push("/asks/triage"),
    Escape: () => {
      if (!isCommandOpen && selectedTaskId) {
        closeTaskDetailPanel();
      }
    },
  });

  const basePaletteActions = useMemo<PaletteAction[]>(
    () => [
      {
        id: "quick-add",
        group: "Actions rapides",
        label: "Création rapide de tâche",
        hint: "C",
        keywords: ["nouvelle", "ajouter", "new"],
        perform: focusQuickAdd,
      },
      {
        id: "new-task",
        group: "Actions rapides",
        label: "Nouvelle tâche (détaillée)",
        hint: "N",
        keywords: ["créer", "formulaire"],
        perform: handleOpenForm,
      },
      {
        id: "focus-search",
        group: "Actions rapides",
        label: "Rechercher une tâche",
        hint: "/",
        keywords: ["filtrer", "chercher"],
        perform: focusSearch,
      },
      { id: "nav-todo", group: "Navigation", label: "Mes tâches", hint: "G T · G I", perform: () => navigateToTab("todo") },
      { id: "nav-kanban", group: "Navigation", label: "Tableau Kanban", hint: "G K", perform: () => navigateToTab("kanban") },
      { id: "nav-list", group: "Navigation", label: "Vue liste", hint: "G L", perform: () => navigateToTab("list") },
      { id: "nav-calendar", group: "Navigation", label: "Calendrier", hint: "G C", perform: () => navigateToTab("calendar") },
      ...(showTeamWorkload
        ? [
            {
              id: "nav-workload",
              group: "Navigation",
              label: "Charge équipe",
              hint: "G W",
              perform: () => navigateToTab("workload"),
            } satisfies PaletteAction,
          ]
        : []),
      { id: "nav-analytics", group: "Navigation", label: "Analytics", hint: "G A", perform: () => navigateToTab("analytics") },
      { id: "nav-archives", group: "Navigation", label: "Archives", hint: "G R", perform: () => navigateToTab("archives") },
      { id: "nav-triage", group: "Navigation", label: "Traiter les demandes", hint: "G D", perform: () => router.push("/asks/triage") },
      { id: "open-asks", group: "Navigation", label: "Espace demandes", keywords: ["asks", "intake", "demande", "formulaire"], perform: () => router.push("/asks") },
      ...TASK_TEMPLATES.map((tpl) => ({
        id: `template-${tpl.id}`,
        group: "Modèles",
        label: `Créer depuis un modèle : ${tpl.name}`,
        keywords: ["template", "bundle", tpl.domain],
        perform: () => void handleApplyTemplate(tpl.id),
      })),
    ],
    [focusQuickAdd, focusSearch, handleApplyTemplate, handleOpenForm, navigateToTab, router, showTeamWorkload],
  );

  const taskPaletteActions = useMemo<PaletteAction[]>(() => {
    const activeId = selectedTaskId ?? lastFocusedTaskId;
    const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;
    if (!activeTask) return [];

    const group = `Tâche : ${activeTask.projectName}`;
    const actions: PaletteAction[] = [];

    for (const col of columns) {
      if (col === activeTask.column) continue;
      actions.push({
        id: `status-${col}`,
        group,
        label: `Statut → ${col}`,
        keywords: ["colonne", "déplacer", "statut"],
        perform: () => handleMoveTask(activeTask.id, col as ColumnId),
      });
    }
    for (const prio of priorities) {
      if (prio === activeTask.priority) continue;
      actions.push({
        id: `prio-${prio}`,
        group,
        label: `Priorité → ${prio}`,
        keywords: ["priorité"],
        perform: () => void handleInlineSave(activeTask.id, { priority: prio }, { priority: prio }),
      });
    }
    actions.push({
      id: "open-active",
      group,
      label: "Ouvrir le détail",
      perform: () => setSelectedTaskId(activeTask.id),
    });
    actions.push({
      id: "archive-active",
      group,
      label: "Archiver la tâche",
      perform: () => void handleArchiveTask(activeTask.id),
    });

    return actions;
  }, [columns, handleArchiveTask, handleInlineSave, handleMoveTask, lastFocusedTaskId, selectedTaskId, tasks]);

  const clientPaletteActions = useMemo<PaletteAction[]>(() => {
    const clients = Array.from(
      new Set(
        tasks.map((task) => task.clientName?.trim()).filter((name): name is string => Boolean(name)),
      ),
    ).slice(0, 8);

    return clients.map((client) => ({
      id: `client-${client}`,
      group: "Recherche",
      label: `Client : ${client}`,
      perform: () => setSearchQuery(client),
    }));
  }, [tasks]);

  const paletteActions = useMemo(
    () => [...basePaletteActions, ...taskPaletteActions, ...clientPaletteActions],
    [basePaletteActions, clientPaletteActions, taskPaletteActions],
  );

  return (
    <AdminAvatarContext.Provider value={adminAvatarMap}>
      <V2ShellSlotSetter
        searchSlot={
          <button
            type="button"
            onClick={() => setIsCommandOpen(true)}
            className="flex w-full items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-left shadow-[var(--shadow-1)] ui-transition hover:border-[var(--line-strong)]"
          >
            <Search className="h-4 w-4 text-[color:var(--foreground)]/45" aria-hidden />
            <span className="flex-1 text-sm text-[color:var(--foreground)]/45">Rechercher ou lancer une commande…</span>
            <kbd className="inline-flex items-center gap-1 rounded-md border border-[var(--line)] bg-[var(--surface-soft)] px-1.5 py-0.5 text-[10px] text-[color:var(--foreground)]/55">
              <CommandIcon className="h-3 w-3" /> K
            </kbd>
          </button>
        }
        toolbarRight={
          <div className="flex shrink-0 items-center gap-2">
            <DashboardNotificationBell />
            <button
              type="button"
              data-tutorial="new-task-button"
              onClick={() => handleOpenForm({ fromTutorialButton: true })}
              title="Nouvelle tâche (N)"
              className={[
                "ui-transition inline-flex items-center gap-2 rounded-xl border border-[var(--accent)] bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-[var(--accent-contrast)] shadow-[var(--shadow-1)] hover:-translate-y-0.5 hover:bg-[var(--accent-strong)]",
                tutorialHighlightButton ? "relative z-[150]" : "",
              ].join(" ")}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/25 text-white">
                <Plus className="h-3.5 w-3.5" />
              </span>
              <span>Nouvelle tâche</span>
            </button>
          </div>
        }
      />
        <div className="space-y-5">
          <header className="ui-surface rounded-2xl border-l-4 border-l-[var(--accent)] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                  {branding.tagline.trim() || branding.appName}
                </p>
                {effectiveUser ? (
                  <h1 className="ui-heading mt-1 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
                    Bonjour, {effectiveUser.split(" ")[0]} 👋
                  </h1>
                ) : (
                  <h1 className="ui-heading mt-1 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
                    Tableau de bord
                  </h1>
                )}
                <p className="mt-1 text-sm text-[color:var(--foreground)]/55">
                  Palette <kbd className="rounded border border-[var(--line)] bg-[var(--surface-soft)] px-1 text-[10px]">⌘K</kbd>
                  {" · "}Créer <kbd className="rounded border border-[var(--line)] bg-[var(--surface-soft)] px-1 text-[10px]">C</kbd>
                  {" · "}Statut <kbd className="rounded border border-[var(--line)] bg-[var(--surface-soft)] px-1 text-[10px]">S</kbd>
                  {" · "}Priorité <kbd className="rounded border border-[var(--line)] bg-[var(--surface-soft)] px-1 text-[10px]">P</kbd>
                  {" · "}Naviguer <kbd className="rounded border border-[var(--line)] bg-[var(--surface-soft)] px-1 text-[10px]">G</kbd>
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span className="rounded-full border border-[var(--line)] bg-[var(--surface-soft)] px-2.5 py-1 text-[11px] font-semibold text-[color:var(--foreground)]/55">
                  {activeTasks.length} tâche{activeTasks.length !== 1 ? "s" : ""} active{activeTasks.length !== 1 ? "s" : ""}
                </span>
                {archivedTasks.length > 0 && (
                  <button
                    type="button"
                    onClick={() => navigateToTab("archives")}
                    className="ui-transition rounded-full border border-dashed border-[var(--line-strong)] bg-[var(--surface-soft)] px-2.5 py-1 text-[11px] font-semibold text-[color:var(--foreground)]/75 hover:bg-[var(--surface-soft)]"
                  >
                    {archivedTasks.length} archivée{archivedTasks.length !== 1 ? "s" : ""}
                  </button>
                )}
              </div>
            </div>
          </header>

          <nav
            className="flex items-center gap-1 overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-1"
            aria-label="Onglets principaux"
          >
            {visibleMainTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const q = searchQuery.trim();
              const href = q
                ? `/dashboard/${tab.id}?q=${encodeURIComponent(q)}`
                : `/dashboard/${tab.id}`;
              return (
                <Link
                  key={tab.id}
                  href={href}
                  data-tutorial={`dashboard-tab-${tab.id}`}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "ui-transition inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold",
                    isActive
                      ? "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[var(--shadow-1)]"
                      : "text-[color:var(--foreground)]/60 hover:bg-[var(--surface)]",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {tab.id === "archives" && archivedTasks.length > 0 && (
                    <span className="rounded-full bg-[color:var(--foreground)]/12 px-1.5 py-0.5 text-[10px] font-semibold text-[color:var(--foreground)]/80">
                      {archivedTasks.length}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {activeTab === "todo" && (
            <ToDoListView
              tasks={activeTasks}
              now={now}
              admins={admins}
              openColumns={openTodoColumns}
              currentUserName={effectiveUser}
              onTaskClick={(task) => setSelectedTaskId(task.id)}
            />
          )}

          {activeTab === "kanban" && (
            <>
              <V2QuickAddTask
                inputRef={quickAddRef}
                onQuickAdd={handleQuickCreate}
                prefill={quickAddPrefill}
                onPrefillApplied={() => setQuickAddPrefill(undefined)}
              />
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--foreground)]/50">
                  <LayoutTemplate className="h-3.5 w-3.5" /> Modèles :
                </span>
                {TASK_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => void handleApplyTemplate(tpl.id)}
                    title={tpl.description}
                    className="ui-transition rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[color:var(--foreground)]/70 hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    {tpl.name}
                  </button>
                ))}
              </div>
              <KanbanBoardView
                tasks={filteredActiveTasks}
                columns={columns}
                admins={admins}
                companies={companies}
                companyRecords={companyRecords}
                now={now}
                currentUserName={effectiveUser}
                onMoveTask={handleMoveTask}
                onOpenTask={setSelectedTaskId}
                onArchiveTask={handleArchiveTask}
                onDeleteTask={(taskId) => void handleDeleteTask(taskId)}
                onEditTask={openEditForTask}
                onAddTaskForColumn={handleOpenFormForColumn}
                onColumnCreated={() => exploration?.notifyColumnAdded()}
                taskCardRefs={taskCardRefs}
                onTaskFocus={setLastFocusedTaskId}
              />
            </>
          )}

          {activeTab === "list" && (
            <V2ListView
              tasks={filteredActiveTasks}
              columns={columns}
              admins={admins}
              companies={companies}
              domains={domainNames}
              companyRecords={companyRecords}
              now={now}
              currentUserName={effectiveUser}
              onOpenTask={setSelectedTaskId}
              onMoveTask={handleMoveTask}
              onInlineSave={handleInlineSave}
              onQuickAdd={handleQuickCreateForColumn}
              onEditTask={openEditForTask}
            />
          )}

          {activeTab === "calendar" && (
            <CalendarView
              tasks={filteredActiveTasks}
              admins={admins}
              currentUserName={currentUser?.teamMemberName ?? null}
              calendarEvents={calendarEvents}
              onSelectTask={(taskId) => {
                setLastFocusedTaskId(null);
                setSelectedTaskId(taskId);
              }}
            />
          )}

          {activeTab === "workload" && showTeamWorkload && (
            <WorkloadView tasks={workloadFlatTasks} admins={admins} adminRecords={adminRecords} now={now} />
          )}

          {activeTab === "analytics" && <AnalyticsView tasks={analyticsTasks} />}

          {activeTab === "archives" && (
            <ArchivesView
              tasks={tasks}
              admins={admins}
              onRestore={(taskId) => void handleRestoreTask(taskId)}
              onDelete={(taskId) => void handlePermanentDelete(taskId)}
            />
          )}

          <AnimatePresence>
            {selectedTask && !selectedTask.isArchived && (
              <TaskDetailPanel
                key={selectedTask.id}
                task={selectedTask}
                allTasks={tasks}
                adminRecords={adminRecords}
                companyRecords={companyRecords}
                domainRecords={domainRecords}
                columnRecords={columnRecords}
                admins={admins}
                columns={columns}
                now={now}
                currentUser={currentUser}
                onClose={closeTaskDetailPanel}
                onSave={handleInlineSave}
                onArchive={() => handleArchiveTask(selectedTask.id)}
                onDelete={() => void handleDeleteTask(selectedTask.id)}
                onSubtaskCreated={(task) => setTasks((prev) => [...prev, task])}
                onSubtaskUpdated={(taskId, patch) =>
                  setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)))
                }
                onSubtaskDeleted={(taskId) => setTasks((prev) => prev.filter((t) => t.id !== taskId))}
              />
            )}
          </AnimatePresence>
        </div>

        <NewTaskModal
          open={isFormOpen}
          editingTaskId={editingTaskId}
          initialValues={newTask}
          admins={adminRecords}
          companies={companyRecords}
          domains={domainRecords}
          currentUserName={effectiveUser ?? currentUser?.teamMemberName ?? currentUser?.displayName ?? null}
          currentUser={currentUser}
          tutorialMode={tutorialModalActive && !editingTaskId}
          onCancel={handleCloseForm}
          onSubmit={handleCreateTask}
        />

        <V2CommandPalette
          open={isCommandOpen}
          onClose={() => setIsCommandOpen(false)}
          actions={paletteActions}
        />
    </AdminAvatarContext.Provider>
  );
}
