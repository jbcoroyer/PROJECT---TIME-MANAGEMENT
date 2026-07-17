import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { LEGACY_ORG_ID } from "../../../../lib/tenantConstants";
import { createSupabaseAdmin } from "../../../../lib/server/supabaseAdmin";
import { getServerOrgContext } from "../../../../lib/server/orgContext";
import { createServerSupabase } from "../../../../lib/server/supabaseServer";
import { isUuid } from "../../../../lib/server/orgValidation";
import { apiPublicSubmissionRateLimit, apiRateLimit } from "../../../../lib/server/rateLimit";
import { sanitizeStockIdeaSubmission } from "../../../../lib/server/publicSubmissionLimits";
import { jsonServerError } from "../../../../lib/server/apiErrorResponse";
import { ideaFromRow } from "../../../../lib/stockIdeasApi";
import type { StockIdeaCategory } from "../../../../lib/stockIdeasTypes";

const SELECT = "id, created_at, title, description, category, status, votes";

async function resolveOrganizationId(request: Request): Promise<string | null> {
  const ctx = await getServerOrgContext();
  if (ctx) return ctx.organizationId;

  const orgId = new URL(request.url).searchParams.get("org");
  if (!orgId || !isUuid(orgId)) return null;

  const admin = createSupabaseAdmin();
  const { data } = await admin.from("organizations").select("id").eq("id", orgId).maybeSingle();
  return data?.id ?? null;
}

/** Utilise le client RLS quand possible ; service role uniquement pour l'accès anonyme multi-tenant. */
async function getIdeasClient(
  organizationId: string,
  authenticated: boolean,
): Promise<SupabaseClient> {
  if (authenticated) {
    return createServerSupabase();
  }
  if (organizationId === LEGACY_ORG_ID) {
    return createServerSupabase();
  }
  return createSupabaseAdmin();
}

export async function GET(request: Request) {
  const limited = apiRateLimit(request, "api/public/ideas:get", 60);
  if (limited) return limited;

  try {
    const ctx = await getServerOrgContext();
    const organizationId = await resolveOrganizationId(request);
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organisation requise (session ou paramètre org)." },
        { status: 400 },
      );
    }

    if (ctx && ctx.organizationId !== organizationId) {
      return NextResponse.json({ error: "Accès non autorisé à cette organisation." }, { status: 403 });
    }

    const supabase = await getIdeasClient(organizationId, Boolean(ctx));
    const { data, error } = await supabase
      .from("stock_ideas")
      .select(SELECT)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      return jsonServerError("public/ideas GET", error);
    }

    return NextResponse.json((data ?? []).map(ideaFromRow));
  } catch (e) {
    return jsonServerError("public/ideas GET", e);
  }
}

export async function POST(request: Request) {
  const limited = apiPublicSubmissionRateLimit(request, "api/public/ideas:post");
  if (limited) return limited;

  try {
    const ctx = await getServerOrgContext();
    const organizationId = await resolveOrganizationId(request);
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organisation requise (session ou paramètre org)." },
        { status: 400 },
      );
    }

    if (ctx && ctx.organizationId !== organizationId) {
      return NextResponse.json({ error: "Accès non autorisé à cette organisation." }, { status: 403 });
    }

    const body = (await request.json()) as {
      title?: string;
      description?: string;
      category?: StockIdeaCategory;
      status?: string;
    };

    const { title, description } = sanitizeStockIdeaSubmission({
      title: body.title,
      description: body.description,
    });
    if (!title) {
      return NextResponse.json({ error: "Titre requis." }, { status: 400 });
    }

    const validCategories = new Set<StockIdeaCategory>(["materiel", "process", "communication", "autre"]);
    const category = validCategories.has(body.category as StockIdeaCategory)
      ? (body.category as StockIdeaCategory)
      : "autre";

    const supabase = await getIdeasClient(organizationId, Boolean(ctx));
    const { data, error } = await supabase
      .from("stock_ideas")
      .insert({
        title,
        description,
        category,
        status: "nouveau",
        organization_id: organizationId,
      })
      .select(SELECT)
      .single();

    if (error) {
      return jsonServerError("public/ideas POST", error);
    }

    return NextResponse.json(ideaFromRow(data), { status: 201 });
  } catch (e) {
    return jsonServerError("public/ideas POST", e);
  }
}
