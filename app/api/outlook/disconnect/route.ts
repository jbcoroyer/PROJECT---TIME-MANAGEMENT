import { NextResponse } from "next/server";
import { requirePlanFeature } from "../../../../lib/server/apiAuth";
import { apiRateLimit } from "../../../../lib/server/rateLimit";
import { deleteOutlookConnection } from "../../../../lib/server/outlookSync";

/** Déconnecte Outlook : supprime jetons et associations d'événements.
 * Les événements déjà créés dans l'agenda Outlook ne sont pas supprimés. */
export async function POST(request: Request) {
  const limited = apiRateLimit(request, "api/outlook/disconnect", 20);
  if (limited) return limited;

  const planCheck = await requirePlanFeature("outlook_sync");
  if (planCheck instanceof NextResponse) return planCheck;

  await deleteOutlookConnection(planCheck.ctx.userId);
  return NextResponse.json({ ok: true });
}
