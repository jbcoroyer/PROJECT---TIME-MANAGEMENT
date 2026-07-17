"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import {
  Command as CommandIcon,
  LayoutTemplate,
  Plus,
  Search,
} from "lucide-react";
import { MAIN_TAB_SET, MAIN_TABS, type MainTab } from "./dashboardTypes";
import {
  buildActiveTasks,
  buildArchivedTasks,
  buildWorkloadTasks,
  filterTasksByQuery,
} from "./dashboardTaskSelectors";
import { useDashboardQuickCreate } from "./useDashboardQuickCreate";
import { useDashboardPaletteActions } from "./useDashboardPaletteActions";
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
import { useAppShortcuts } from "../../../lib/v2/useAppShortcuts";
import { useAutoArchiveHours } from "../../../lib/v2/v2Preferences";
import { TASK_TEMPLATES } from "../../../lib/v2/taskTemplates";
import { canAccessTeamWorkload } from "../../../lib/billing/plans";
import { useBillingPlan } from "../../../lib/billing/useBillingPlan";
import DashboardNotificationBell from "../../DashboardNotificationBell";
import V2CommandPalette from "./V2CommandPalette";
import V2QuickAddTask from "./V2QuickAddTask";
import { useFirstTaskTutorialOptional } from "../../../lib/onboarding/firstTaskTutorialContext";
import { useExplorationTutorialOptional } from "../../../lib/onboarding/explorationTutorialContext";
import { useGamificationOptional } from "../../../lib/gamification/gamificationContext";
import { useTranslation } from "../../../lib/i18n/useTranslation";

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
  const { tasks, setTasks, optimisticUpdate } = useTasks();
  const { events: calendarEvents } = useEvents();
  const {
    admins: adminRecords,
    columns: columnRecords,
    companies: companyRecords,
    domains: domainRecords,
  } = useReferenceData();
  const { plan } = useBillingPlan();
  const { t } = useTranslation();

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


  useEffect(() => {
    if (!tutorial?.active) return;
    if (exploration?.boardActive) return;
    const allowedSteps = [
      "celebrate",
      "visitList",
      "editInList",
      "visitCalendar",
      "exploreCalendar",
      "createEvent",
      "visitTodo",
      "exploreTodo",
      "done",
    ];
    if (allowedSteps.includes(tutorial.step)) {
      if (tutorial.step === "visitList" && activeTab !== "list" && activeTab !== "kanban") {
        tutorial.dismissTutorial();
      }
      if (
        (tutorial.step === "editInList" && activeTab !== "list") ||
        (["visitCalendar", "exploreCalendar", "createEvent"].includes(tutorial.step) &&
          activeTab !== "calendar" &&
          activeTab !== "list") ||
        (["visitTodo", "exploreTodo"].includes(tutorial.step) &&
          activeTab !== "todo" &&
          activeTab !== "calendar")
      ) {
        if (isFormOpen) queueMicrotask(() => setIsFormOpen(false));
      }
      return;
    }
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
    if (!editingTaskId && !firstTaskTutorialCompleted && tutorial?.active && tutorial.step === "fillForm") {
      tutorial.notifyTaskCreated();
    }
    const closeForm = () => {
      setIsFormOpen(false);
      setEditingTaskId(null);
      setNewTask({
        ...initialFormState,
        company: firstCompany,
        domain: firstDomain,
        admins: defaultAdminName ? [defaultAdminName] : [],
      });
      setNewTaskColumn((columns[0] as ColumnId) ?? "À faire");
    };
    if (editingTaskId) {
      closeForm();
      return;
    }
    window.setTimeout(closeForm, 1650);
  }, [companyRecords, domainRecords, defaultAdminName, columns, tutorial, firstTaskTutorialCompleted, editingTaskId]);

  const tutorialHighlightTaskId = useMemo(() => {
    if (firstTaskTutorialCompleted) return null;
    const active = tasks.filter((task) => !task.isArchived);
    if (active.length === 0) return null;
    const sorted = [...active].sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
    return sorted[0]?.id ?? null;
  }, [tasks, firstTaskTutorialCompleted]);

  const handleTutorialEventSaved = useCallback(() => {
    if (!tutorial?.active || tutorial.step !== "createEvent") return;
    tutorial.notifyEventCreated();
    navigateToTab("todo");
  }, [tutorial, navigateToTab]);

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

  const domainNames = useMemo(() => domainRecords.map((d) => d.name), [domainRecords]);

  const { handleQuickCreate, handleQuickCreateForColumn, handleApplyTemplate } = useDashboardQuickCreate({
    supabase,
    tasks,
    setTasks,
    columns,
    columnRecords,
    companyRecords,
    domainRecords,
    domainNames,
    defaultAdminName,
  });

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

  const activeTasks = useMemo(() => buildActiveTasks(tasks), [tasks]);
  const archivedTasks = useMemo(() => buildArchivedTasks(tasks), [tasks]);
  const workloadFlatTasks = useMemo(() => buildWorkloadTasks(tasks), [tasks]);
  const filteredActiveTasks = useMemo(
    () => filterTasksByQuery(activeTasks, searchQuery),
    [activeTasks, searchQuery],
  );
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

  const paletteActions = useDashboardPaletteActions({
    tasks,
    columns,
    selectedTaskId,
    lastFocusedTaskId,
    showTeamWorkload,
    focusQuickAdd,
    focusSearch,
    handleOpenForm,
    handleApplyTemplate,
    handleMoveTask,
    handleInlineSave,
    handleArchiveTask,
    navigateToTab,
    router,
    setSearchQuery,
    setSelectedTaskId,
  });

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
            <span className="flex-1 text-sm text-[color:var(--foreground)]/45">{t("dashboard.searchPlaceholder")}</span>
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
              title={t("dashboard.newTaskShortcut")}
              className={[
                "ui-transition inline-flex items-center gap-2 rounded-xl border border-[var(--accent)] bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-[var(--accent-contrast)] shadow-[var(--shadow-1)] hover:-translate-y-0.5 hover:bg-[var(--accent-strong)]",
                tutorialHighlightButton ? "relative z-[150]" : "",
              ].join(" ")}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/25 text-white">
                <Plus className="h-3.5 w-3.5" />
              </span>
              <span>{t("dashboard.newTask")}</span>
            </button>
          </div>
        }
      />
        <div className="space-y-5">
          <header className="ui-surface rounded-2xl border-l-4 border-l-[var(--accent)] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                {effectiveUser ? (
                  <h1 className="ui-heading text-3xl font-semibold tracking-tight text-[var(--foreground)]">
                    Bonjour, {effectiveUser.split(" ")[0]} 👋
                  </h1>
                ) : (
                  <h1 className="ui-heading text-3xl font-semibold tracking-tight text-[var(--foreground)]">
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
                  {t(activeTasks.length === 1 ? "dashboard.activeTasksOne" : "dashboard.activeTasksMany", {
                    count: activeTasks.length,
                  })}
                </span>
                {archivedTasks.length > 0 && (
                  <button
                    type="button"
                    onClick={() => navigateToTab("archives")}
                    className="ui-transition rounded-full border border-dashed border-[var(--line-strong)] bg-[var(--surface-soft)] px-2.5 py-1 text-[11px] font-semibold text-[color:var(--foreground)]/75 hover:bg-[var(--surface-soft)]"
                  >
                    {t(archivedTasks.length === 1 ? "dashboard.archivedOne" : "dashboard.archivedMany", {
                      count: archivedTasks.length,
                    })}
                  </button>
                )}
              </div>
            </div>
          </header>

          <nav
            className="flex items-center gap-1 overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-1"
            aria-label={t("dashboard.mainTabsAria")}
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
                  {t(tab.labelKey)}
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
                  <LayoutTemplate className="h-3.5 w-3.5" /> {t("dashboard.templates")}
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
              tutorialStep={tutorial?.active ? tutorial.step : null}
              highlightTaskId={tutorialHighlightTaskId}
              onTutorialEventSaved={handleTutorialEventSaved}
              onEventModalOpenChange={gamification?.setCalendarEventModalOpen}
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
          tasks={tasks}
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
