import { NextResponse } from "next/server";
import { aiRepurpose, aiSummary } from "../../../../lib/server/aiGenerate";
import { requirePlanFeature } from "../../../../lib/server/apiAuth";
import { apiUserRateLimit } from "../../../../lib/server/rateLimit";
import { createServerSupabase } from "../../../../lib/server/supabaseServer";
import { jsonServerError } from "../../../../lib/server/apiErrorResponse";

type RepurposeBody = {
  kind: "repurpose";
  source?: string;
  networks?: string[];
};

type SummaryBody = {
  kind: "summary";
  title?: string;
  bullets?: string[];
  context?: string;
};

type Body = RepurposeBody | SummaryBody;

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const limited = apiUserRateLimit(user.id, "api/v2/ai", 20);
  if (limited) return limited;

  const auth = await requirePlanFeature("ai");
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await request.json()) as Body;

    if (body.kind === "repurpose") {
      const source = body.source?.trim() ?? "";
      if (!source) {
        return NextResponse.json({ error: "Contenu source requis." }, { status: 400 });
      }
      const networks = Array.isArray(body.networks) ? body.networks.filter(Boolean) : [];
      const result = await aiRepurpose({ source, networks });
      return NextResponse.json(result);
    }

    if (body.kind === "summary") {
      const title = body.title?.trim() ?? "Synthèse";
      const bullets = Array.isArray(body.bullets) ? body.bullets.filter(Boolean) : [];
      const result = await aiSummary({ title, bullets, context: body.context });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Type de requête inconnu." }, { status: 400 });
  } catch (error) {
    return jsonServerError("api/v2/ai", error);
  }
}
