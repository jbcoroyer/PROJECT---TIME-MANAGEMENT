import { type NextRequest, NextResponse } from "next/server";
import { requirePlanFeature } from "../../../../lib/server/apiAuth";
import { createServerSupabase } from "../../../../lib/server/supabaseServer";
import { apiRateLimit } from "../../../../lib/server/rateLimit";
import {
  removeTaskFromOutlook,
  syncTaskToOutlook,
  type ProjectedWorkItem,
  type TaskForSync,
} from "../../../../lib/server/outlookSync";
import { jsonServerError } from "../../../../lib/server/apiErrorResponse";

type SyncBody = { taskId?: string; remove?: boolean };

/** Synchronise une tâche (et ses jours planifiés) vers l'agenda Outlook de l'utilisateur. */
export async function POST(request: NextRequest) {
  const limited = apiRateLimit(request, "api/outlook/sync", 30);
  if (limited) return limited;

  const planCheck = await requirePlanFeature("outlook_sync");
  if (planCheck instanceof NextResponse) return planCheck;

  const supabase = await createServerSupabase();
  const userId = planCheck.ctx.userId;

  let body: SyncBody;
  try {
    body = (await request.json()) as SyncBody;
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const taskId = body.taskId?.trim();
  if (!taskId) {
    return NextResponse.json({ error: "taskId requis." }, { status: 400 });
  }

  // Mode suppression : retire tous les événements Outlook liés à la tâche.
  if (body.remove) {
    try {
      const result = await removeTaskFromOutlook(userId, taskId);
      return NextResponse.json(result);
    } catch (e) {
      return jsonServerError("api/outlook/sync remove", e);
    }
  }

  // Lecture via la session utilisateur (RLS) : l'utilisateur doit pouvoir voir la tâche.
  const { data: row, error } = await supabase
    .from("tasks")
    .select("id, project_name, description, company, domain, projected_work")
    .eq("id", taskId)
    .maybeSingle();

  if (error) {
    return jsonServerError("api/outlook/sync read", error);
  }
  if (!row) {
    return NextResponse.json({ error: "Tâche introuvable." }, { status: 404 });
  }

  const task: TaskForSync = {
    id: row.id as string,
    projectName: (row.project_name as string) ?? "Tâche",
    description: (row.description as string | null) ?? null,
    company: (row.company as string | null) ?? null,
    domain: (row.domain as string | null) ?? null,
    projectedWork: ((row.projected_work as ProjectedWorkItem[] | null) ?? []).filter(
      (item) => item && typeof item.date === "string" && item.date.length > 0,
    ),
  };

  try {
    const result = await syncTaskToOutlook(userId, task);
    return NextResponse.json(result);
  } catch (e) {
    return jsonServerError("api/outlook/sync", e);
  }
}
