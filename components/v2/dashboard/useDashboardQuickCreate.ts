"use client";

import { useCallback } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { toastError, toastSuccess } from "../../../lib/toast";
import { completedAtIsoForNewTaskInColumn } from "../../../lib/completedAt";
import { markTaskMutatedLocally, markTasksMutatedLocally } from "../../../lib/taskMutatedLocally";
import { normalizeProjectName } from "../../../lib/normalize";
import { mapTaskRow } from "../../../lib/taskMappers";
import { resolveColumnRefs } from "../../../lib/v2/boardColumns";
import { getTemplateById } from "../../../lib/v2/taskTemplates";
import { useTranslation } from "../../../lib/i18n/useTranslation";
import {
  initialFormState,
  type ColumnId,
  type NewTaskFormState,
  type Task,
} from "../../../lib/types";
import type { ReferenceRecord } from "../../../lib/referenceData";

type UseDashboardQuickCreateArgs = {
  supabase: SupabaseClient;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  columns: ColumnId[];
  columnRecords: ReferenceRecord[];
  companyRecords: ReferenceRecord[];
  domainRecords: ReferenceRecord[];
  domainNames: string[];
  defaultAdminName: string;
};

export function useDashboardQuickCreate({
  supabase,
  setTasks,
  columns,
  columnRecords,
  companyRecords,
  domainRecords,
  domainNames,
  defaultAdminName,
}: UseDashboardQuickCreateArgs) {
  const { t } = useTranslation();

  const insertTaskRow = useCallback(
    async (payload: Record<string, unknown>): Promise<Task | null> => {
      const { data, error } = await supabase.from("tasks").insert(payload).select().single();
      if (error || !data) {
        toastError(t("dashboard.quickCreate.createError", { message: error?.message ?? "?" }));
        return null;
      }
      const created = mapTaskRow(data);
      markTaskMutatedLocally(created.id);
      setTasks((prev) => {
        const cleaned = prev.filter((task) => task.id !== created.id);
        return [...cleaned, created];
      });
      return created;
    },
    [setTasks, supabase, t],
  );

  const createOptimisticTask = useCallback(
    async (title: string, column: ColumnId) => {
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
        setTasks((prev) => prev.filter((task) => task.id !== tempId));
        toastError(t("dashboard.quickCreate.createTaskError", { message: error?.message ?? "?" }));
        return;
      }
      const created = mapTaskRow(data);
      markTaskMutatedLocally(created.id);
      setTasks((prev) => {
        const cleaned = prev.filter((task) => task.id !== tempId && task.id !== created.id);
        return [...cleaned, created];
      });
      toastSuccess(t("dashboard.quickCreate.taskCreated"));
    },
    [columnRecords, companyRecords, defaultAdminName, domainRecords, setTasks, supabase, t],
  );

  const handleQuickCreate = useCallback(
    async (rawTitle: string) => {
      const title = normalizeProjectName(rawTitle);
      if (!title) return;
      const column = (columns[0] as ColumnId) ?? "À faire";
      await createOptimisticTask(title, column);
    },
    [columns, createOptimisticTask],
  );

  const handleQuickCreateForColumn = useCallback(
    async (rawTitle: string, targetColumn: ColumnId) => {
      const title = normalizeProjectName(rawTitle);
      if (!title) return;
      await createOptimisticTask(title, targetColumn);
    },
    [createOptimisticTask],
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
      toastSuccess(t("dashboard.quickCreate.templateApplied", { name: tpl.name }));
    },
    [
      columns,
      columnRecords,
      companyRecords,
      defaultAdminName,
      domainNames,
      domainRecords,
      insertTaskRow,
      setTasks,
      supabase,
      t,
    ],
  );

  return {
    handleQuickCreate,
    handleQuickCreateForColumn,
    handleApplyTemplate,
  };
}

export type { NewTaskFormState };
