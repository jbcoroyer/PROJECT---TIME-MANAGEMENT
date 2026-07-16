"use client";

import { useMemo } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { priorities, type ColumnId, type Task } from "../../../lib/types";
import { TASK_TEMPLATES } from "../../../lib/v2/taskTemplates";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import type { PaletteAction } from "./V2CommandPalette";
import type { MainTab } from "./dashboardTypes";

type UseDashboardPaletteActionsArgs = {
  tasks: Task[];
  columns: ColumnId[];
  selectedTaskId: string | null;
  lastFocusedTaskId: string | null;
  showTeamWorkload: boolean;
  focusQuickAdd: () => void;
  focusSearch: () => void;
  handleOpenForm: () => void;
  handleApplyTemplate: (templateId: string) => void | Promise<void>;
  handleMoveTask: (taskId: string, column: ColumnId) => void;
  handleInlineSave: (taskId: string, patch: Partial<Task>, dbPatch: Record<string, unknown>) => void | Promise<void>;
  handleArchiveTask: (taskId: string) => void;
  navigateToTab: (tab: MainTab) => void;
  router: AppRouterInstance;
  setSearchQuery: (value: string) => void;
  setSelectedTaskId: (taskId: string | null) => void;
};

export function useDashboardPaletteActions({
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
}: UseDashboardPaletteActionsArgs) {
  const { t } = useTranslation();

  const basePaletteActions = useMemo<PaletteAction[]>(
    () => [
      {
        id: "quick-add",
        group: t("dashboard.palette.quickActions"),
        label: t("dashboard.palette.quickAdd"),
        hint: "C",
        keywords: ["nouvelle", "ajouter", "new"],
        perform: focusQuickAdd,
      },
      {
        id: "new-task",
        group: t("dashboard.palette.quickActions"),
        label: t("dashboard.palette.newTaskDetailed"),
        hint: "N",
        keywords: ["créer", "formulaire", "create", "form"],
        perform: handleOpenForm,
      },
      {
        id: "focus-search",
        group: t("dashboard.palette.quickActions"),
        label: t("dashboard.palette.searchTask"),
        hint: "/",
        keywords: ["filtrer", "chercher", "search", "filter"],
        perform: focusSearch,
      },
      {
        id: "nav-todo",
        group: t("dashboard.palette.navigation"),
        label: t("dashboard.tabs.todo"),
        hint: "G T · G I",
        perform: () => navigateToTab("todo"),
      },
      {
        id: "nav-kanban",
        group: t("dashboard.palette.navigation"),
        label: t("dashboard.tabs.kanban"),
        hint: "G K",
        perform: () => navigateToTab("kanban"),
      },
      {
        id: "nav-list",
        group: t("dashboard.palette.navigation"),
        label: t("dashboard.tabs.list"),
        hint: "G L",
        perform: () => navigateToTab("list"),
      },
      {
        id: "nav-calendar",
        group: t("dashboard.palette.navigation"),
        label: t("dashboard.tabs.calendar"),
        hint: "G C",
        perform: () => navigateToTab("calendar"),
      },
      ...(showTeamWorkload
        ? [
            {
              id: "nav-workload",
              group: t("dashboard.palette.navigation"),
              label: t("dashboard.tabs.workload"),
              hint: "G W",
              perform: () => navigateToTab("workload"),
            } satisfies PaletteAction,
          ]
        : []),
      {
        id: "nav-analytics",
        group: t("dashboard.palette.navigation"),
        label: t("dashboard.tabs.analytics"),
        hint: "G A",
        perform: () => navigateToTab("analytics"),
      },
      {
        id: "nav-archives",
        group: t("dashboard.palette.navigation"),
        label: t("dashboard.tabs.archives"),
        hint: "G R",
        perform: () => navigateToTab("archives"),
      },
      {
        id: "nav-triage",
        group: t("dashboard.palette.navigation"),
        label: t("dashboard.palette.triageRequests"),
        hint: "G D",
        perform: () => router.push("/asks/triage"),
      },
      {
        id: "open-asks",
        group: t("dashboard.palette.navigation"),
        label: t("dashboard.palette.asksSpace"),
        keywords: ["asks", "intake", "demande", "formulaire", "request"],
        perform: () => router.push("/asks"),
      },
      ...TASK_TEMPLATES.map((tpl) => ({
        id: `template-${tpl.id}`,
        group: t("dashboard.palette.templates"),
        label: t("dashboard.palette.createFromTemplate", { name: tpl.name }),
        keywords: ["template", "bundle", tpl.domain],
        perform: () => void handleApplyTemplate(tpl.id),
      })),
    ],
    [
      focusQuickAdd,
      focusSearch,
      handleApplyTemplate,
      handleOpenForm,
      navigateToTab,
      router,
      showTeamWorkload,
      t,
    ],
  );

  const taskPaletteActions = useMemo<PaletteAction[]>(() => {
    const activeId = selectedTaskId ?? lastFocusedTaskId;
    const activeTask = activeId ? tasks.find((task) => task.id === activeId) : null;
    if (!activeTask) return [];

    const group = t("dashboard.palette.taskGroup", { name: activeTask.projectName });
    const actions: PaletteAction[] = [];

    for (const col of columns) {
      if (col === activeTask.column) continue;
      actions.push({
        id: `status-${col}`,
        group,
        label: t("dashboard.palette.statusTo", { status: col }),
        keywords: ["colonne", "déplacer", "statut", "column", "status"],
        perform: () => handleMoveTask(activeTask.id, col as ColumnId),
      });
    }
    for (const prio of priorities) {
      if (prio === activeTask.priority) continue;
      actions.push({
        id: `prio-${prio}`,
        group,
        label: t("dashboard.palette.priorityTo", { priority: prio }),
        keywords: ["priorité", "priority"],
        perform: () => void handleInlineSave(activeTask.id, { priority: prio }, { priority: prio }),
      });
    }
    actions.push({
      id: "open-active",
      group,
      label: t("dashboard.palette.openDetail"),
      perform: () => setSelectedTaskId(activeTask.id),
    });
    actions.push({
      id: "archive-active",
      group,
      label: t("dashboard.palette.archiveTask"),
      perform: () => void handleArchiveTask(activeTask.id),
    });

    return actions;
  }, [
    columns,
    handleArchiveTask,
    handleInlineSave,
    handleMoveTask,
    lastFocusedTaskId,
    selectedTaskId,
    setSelectedTaskId,
    t,
    tasks,
  ]);

  const clientPaletteActions = useMemo<PaletteAction[]>(() => {
    const clients = Array.from(
      new Set(
        tasks.map((task) => task.clientName?.trim()).filter((name): name is string => Boolean(name)),
      ),
    ).slice(0, 8);

    return clients.map((client) => ({
      id: `client-${client}`,
      group: t("dashboard.palette.search"),
      label: t("dashboard.palette.clientFilter", { name: client }),
      perform: () => setSearchQuery(client),
    }));
  }, [setSearchQuery, t, tasks]);

  return useMemo(
    () => [...basePaletteActions, ...taskPaletteActions, ...clientPaletteActions],
    [basePaletteActions, clientPaletteActions, taskPaletteActions],
  );
}
