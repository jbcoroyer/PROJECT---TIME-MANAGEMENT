import { NextResponse } from "next/server";
import { requirePlanFeature } from "../../../../lib/server/apiAuth";
import { createServerSupabase } from "../../../../lib/server/supabaseServer";
import { apiRateLimit } from "../../../../lib/server/rateLimit";
import { syncAllTasksForUser } from "../../../../lib/server/outlookSync";
import { getServerUserIdentity } from "../../../../lib/server/userIdentity";
import { jsonServerError } from "../../../../lib/server/apiErrorResponse";

/** Synchronise toutes les tâches planifiées de l'utilisateur vers Outlook. */
export async function POST(request: Request) {
  const limited = apiRateLimit(request, "api/outlook/sync-all", 10);
  if (limited) return limited;

  const planCheck = await requirePlanFeature("outlook_sync");
  if (planCheck instanceof NextResponse) return planCheck;

  const supabase = await createServerSupabase();
  const userId = planCheck.ctx.userId;

  try {
    const identity = await getServerUserIdentity(userId);
    const { data: rows, error } = await supabase
      .from("tasks")
      .select("id, project_name, description, company, domain, projected_work, admin, lane, is_archived")
      .eq("is_archived", false);

    if (error) {
      return jsonServerError("api/outlook/sync-all read", error);
    }

    const result = await syncAllTasksForUser(userId, identity, (rows ?? []) as Record<string, unknown>[]);
    return NextResponse.json(result);
  } catch (e) {
    return jsonServerError("api/outlook/sync-all", e);
  }
}
