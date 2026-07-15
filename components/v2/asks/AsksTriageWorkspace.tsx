"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnId } from "../../../lib/types";
import { mapTaskRow } from "../../../lib/taskMappers";
import { markTaskMutatedLocally } from "../../../lib/taskMutatedLocally";
import { normalizeProjectName } from "../../../lib/normalize";
import { completedAtIsoForNewTaskInColumn } from "../../../lib/completedAt";
import { getSupabaseBrowser } from "../../../lib/supabaseBrowser";
import { useReferenceData } from "../../../lib/useReferenceData";
import { useTasks } from "../../../lib/useTasks";
import { useCurrentUser } from "../../../lib/useCurrentUser";
import { resolveColumnRefs } from "../../../lib/v2/boardColumns";
import { useIntakeRequests, type IntakeRequest } from "../../../lib/v2/intake";
import { buildTaskDraftFromRequest, type IntakeTaskDraft } from "../../../lib/v2/intakeMapping";
import { toastSuccess, toastError } from "../../../lib/toast";
import V2TriagePanel from "../dashboard/V2TriagePanel";
import IntakeTaskMappingModal from "../dashboard/IntakeTaskMappingModal";

export default function AsksTriageWorkspace() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowser(), []);
  const { tasks, setTasks } = useTasks();
  const { user } = useCurrentUser();
  const { admins, companies, columns: columnRecords, domains: domainRecords } = useReferenceData();
  const {
    requests: intakeRequests,
    loading: intakeLoading,
    updateRequest: updateIntakeRequest,
  } = useIntakeRequests();

  const [mappingRequest, setMappingRequest] = useState<IntakeRequest | null>(null);
  const [mappingDraft, setMappingDraft] = useState<IntakeTaskDraft | null>(null);
  const [mappingBusy, setMappingBusy] = useState(false);

  const domainNames = useMemo(() => domainRecords.map((d) => d.name), [domainRecords]);
  const columnIds = useMemo(
    () => columnRecords.map((c) => c.name as ColumnId),
    [columnRecords],
  );
  const defaultAdminName = user?.teamMemberName ?? user?.displayName ?? admins[0]?.name ?? "";

  const insertTaskRow = useCallback(
    async (payload: Record<string, unknown>) => {
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

  const handleAcceptRequest = useCallback(
    (request: IntakeRequest) => {
      const draft = buildTaskDraftFromRequest(request, {
        companies: companies.map((c) => c.name),
        domains: domainNames,
        admins: admins.map((a) => a.name),
        tasks,
        defaultAdmin: defaultAdminName || undefined,
      });
      setMappingRequest(request);
      setMappingDraft(draft);
    },
    [admins, companies, defaultAdminName, domainNames, tasks],
  );

  const handleConfirmMappedTask = useCallback(
    async (mapped: IntakeTaskDraft) => {
      if (!mappingRequest || mappingBusy) return;
      setMappingBusy(true);
      try {
        const column = (columnIds[0] as ColumnId) ?? "À faire";
        const created = await insertTaskRow({
          project_name: normalizeProjectName(mapped.projectName),
          company: mapped.company,
          domain: mapped.domain,
          admin: mapped.admins.join(","),
          is_client_request: mapped.isClientRequest,
          client_name: mapped.clientName,
          deadline: mapped.deadline || null,
          budget: mapped.budget,
          description: mapped.description,
          priority: mapped.priority,
          projected_work: [],
          estimated_hours: mapped.estimatedHours,
          estimated_days: mapped.estimatedHours > 0 ? Math.ceil(mapped.estimatedHours / 7) : 0,
          ...resolveColumnRefs(column, columnRecords),
          lane: mapped.admins[0] ?? null,
          elapsed_ms: 0,
          is_running: false,
          last_start_time_ms: null,
          is_archived: false,
          completed_at: completedAtIsoForNewTaskInColumn(column),
        });
        if (!created) return;
        await updateIntakeRequest(mappingRequest.id, {
          status: "accepted",
          linkedTaskId: created.id,
          decidedAt: new Date().toISOString(),
        });
        setMappingRequest(null);
        setMappingDraft(null);
        toastSuccess("Demande convertie en tâche");
      } finally {
        setMappingBusy(false);
      }
    },
    [columnIds, columnRecords, insertTaskRow, mappingBusy, mappingRequest, updateIntakeRequest],
  );

  const handleRejectRequest = useCallback(
    async (request: IntakeRequest) => {
      await updateIntakeRequest(request.id, {
        status: "rejected",
        decidedAt: new Date().toISOString(),
      });
    },
    [updateIntakeRequest],
  );

  return (
    <>
      <V2TriagePanel
        requests={intakeRequests}
        loading={intakeLoading}
        tasks={tasks}
        admins={admins.map((a) => a.name)}
        onAccept={handleAcceptRequest}
        onReject={(request) => void handleRejectRequest(request)}
        onOpenTask={(taskId) => router.push(`/dashboard/kanban?task=${taskId}`)}
      />

      <IntakeTaskMappingModal
        open={mappingRequest !== null}
        draft={mappingDraft}
        domains={domainNames}
        admins={admins.map((a) => a.name)}
        busy={mappingBusy}
        onClose={() => {
          if (mappingBusy) return;
          setMappingRequest(null);
          setMappingDraft(null);
        }}
        onConfirm={(mapped) => void handleConfirmMappedTask(mapped)}
      />
    </>
  );
}
