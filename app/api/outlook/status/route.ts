import { NextResponse } from "next/server";
import { requirePlanFeature } from "../../../../lib/server/apiAuth";
import { apiRateLimit } from "../../../../lib/server/rateLimit";
import { getOutlookConnection } from "../../../../lib/server/outlookSync";
import { isMicrosoftConfigured } from "../../../../lib/server/microsoftGraph";

/** Renvoie l'état de connexion Outlook de l'utilisateur courant. */
export async function GET(request: Request) {
  const limited = apiRateLimit(request, "api/outlook/status", 60);
  if (limited) return limited;

  const planCheck = await requirePlanFeature("outlook_sync");
  if (planCheck instanceof NextResponse) {
    return NextResponse.json(
      { connected: false, configured: isMicrosoftConfigured(), requiresPro: true },
      { status: 403 },
    );
  }

  const conn = await getOutlookConnection(planCheck.ctx.userId);
  return NextResponse.json({
    configured: isMicrosoftConfigured(),
    connected: Boolean(conn),
    email: conn?.account_email ?? null,
  });
}
