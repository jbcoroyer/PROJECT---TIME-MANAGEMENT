import { NextResponse } from "next/server";
import { effectivePlanForOrg, type OrgPlan } from "../billing/plans";
import { assertBillingAccess } from "./assertBillingAccess";
import { getOrganizationBilling } from "./billingOrg";
import { getServerAuthUser } from "./authSafe";
import { getServerOrgContext, type ServerOrgContext } from "./orgContext";
import { createServerSupabase } from "./supabaseServer";

export async function requireAuth(): Promise<ServerOrgContext | NextResponse> {
  const ctx = await getServerOrgContext();
  if (!ctx) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const supabase = await createServerSupabase();
  const user = await getServerAuthUser(supabase);
  const billingBlock = await assertBillingAccess(ctx, user?.email);
  if (billingBlock) return billingBlock;

  return ctx;
}

export async function requireAdmin(): Promise<ServerOrgContext | NextResponse> {
  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;
  if (!ctx.isAdmin) {
    return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
  }
  return ctx;
}

/** Toutes les fonctionnalités sont incluses — vérifie authentification et accès billing. */
export async function requirePlanFeature(
  _feature: string,
): Promise<{ ctx: ServerOrgContext; plan: OrgPlan } | NextResponse> {
  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;

  const org = await getOrganizationBilling(ctx.organizationId);
  const plan = effectivePlanForOrg({
    plan: (org?.plan ?? "trial") as OrgPlan,
    trialEndsAt: org?.trialEndsAt ?? null,
  });

  return { ctx, plan };
}
