import { NextResponse } from "next/server";
import {
  BILLING_STATUS_LABELS,
  PLAN_LABELS,
  daysLeftInTrial,
  isOrgAccessAllowed,
  type BillingStatus,
  type OrgPlan,
} from "../../../../lib/billing/plans";
import { downgradeExpiredTrialToFree, getOrganizationBilling } from "../../../../lib/server/billingOrg";
import { getServerOrgContext } from "../../../../lib/server/orgContext";
import { apiRateLimit } from "../../../../lib/server/rateLimit";
import { isStripeConfigured } from "../../../../lib/server/stripe";

export async function GET(request: Request) {
  const limited = apiRateLimit(request, "api/billing/status", 60);
  if (limited) return limited;

  try {
    const ctx = await getServerOrgContext();
    if (!ctx) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const org = await getOrganizationBilling(ctx.organizationId);
    if (!org) {
      return NextResponse.json({ error: "Organisation introuvable." }, { status: 404 });
    }

    let plan = org.plan as OrgPlan;
    let billingStatus = org.billingStatus as BillingStatus;
    let trialEndsAt = org.trialEndsAt;

    plan = await downgradeExpiredTrialToFree(ctx.organizationId, plan, trialEndsAt);
    if (plan === "free" && org.plan === "trial") {
      billingStatus = "active";
      trialEndsAt = null;
    }

    return NextResponse.json({
      plan,
      planLabel: PLAN_LABELS[plan],
      billingStatus,
      billingStatusLabel: BILLING_STATUS_LABELS[billingStatus],
      trialEndsAt: org.trialEndsAt,
      trialDaysLeft: daysLeftInTrial(org.trialEndsAt),
      accessAllowed: isOrgAccessAllowed({
        plan,
        billingStatus,
        trialEndsAt: org.trialEndsAt,
      }),
      hasStripeCustomer: Boolean(org.stripeCustomerId),
      hasActiveSubscription: Boolean(org.stripeSubscriptionId),
      stripeConfigured: isStripeConfigured(),
      isAdmin: ctx.isAdmin,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
