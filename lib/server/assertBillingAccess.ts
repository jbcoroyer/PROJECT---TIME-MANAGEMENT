import "server-only";

import { NextResponse } from "next/server";
import { isBillingEnforcementEnabled } from "../billing/enforcement";
import { inferTrialEndsAt, isOrgAccessAllowed, type BillingStatus, type OrgPlan } from "../billing/plans";
import { finalizeExpiredTrial, getOrganizationBilling } from "./billingOrg";
import type { ServerOrgContext } from "./orgContext";
import { isPlatformAdminEmail } from "./platformAdmin";

/** Bloque les requêtes API si l'org n'a pas accès (402). Retourne null si OK. */
export async function assertBillingAccess(
  ctx: ServerOrgContext,
  userEmail?: string | null,
): Promise<NextResponse | null> {
  if (!isBillingEnforcementEnabled()) return null;
  if (isPlatformAdminEmail(userEmail)) return null;

  const org = await getOrganizationBilling(ctx.organizationId);
  if (!org) {
    return NextResponse.json({ error: "Organisation introuvable." }, { status: 404 });
  }

  const effectiveTrialEndsAt = inferTrialEndsAt(org.trialEndsAt, org.plan, org.createdAt);

  let plan = org.plan as OrgPlan;
  let billingStatus = org.billingStatus as BillingStatus;
  let trialEndsAt = effectiveTrialEndsAt;

  plan = await finalizeExpiredTrial(ctx.organizationId, plan, trialEndsAt);
  if (plan === "canceled" && org.plan === "trial") {
    billingStatus = "canceled";
    trialEndsAt = null;
  }

  const allowed = isOrgAccessAllowed({ plan, billingStatus, trialEndsAt });
  if (!allowed) {
    return NextResponse.json(
      { error: "Abonnement requis.", code: "billing_required" },
      { status: 402 },
    );
  }

  return null;
}
