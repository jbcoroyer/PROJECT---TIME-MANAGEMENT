import type { SupabaseClient } from "@supabase/supabase-js";
import {
  daysLeftInTrial,
  isOrgAccessAllowed,
  isTrialExpired,
  type BillingStatus,
  type OrgPlan,
} from "./plans";
import { LEGACY_ORG_ID } from "../tenantConstants";
import { finalizeExpiredTrial } from "../server/billingOrg";

export type BillingBlockReason =
  | "legacy"
  | "active"
  | "trial"
  | "trial_expired"
  | "subscription_inactive"
  | "unknown";

export type BillingAccessSnapshot = {
  allowed: boolean;
  organizationId: string | null;
  plan: OrgPlan | null;
  billingStatus: BillingStatus | null;
  trialEndsAt: string | null;
  trialDaysLeft: number | null;
  reason: BillingBlockReason;
};

/** Résout l'accès billing — utilisable dans proxy (edge) et Server Components. */
export async function resolveBillingAccess(
  supabase: SupabaseClient,
  userId: string,
): Promise<BillingAccessSnapshot> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", userId)
    .maybeSingle();

  const organizationId = (profile?.organization_id as string | null) ?? null;
  if (!organizationId) {
    return {
      allowed: true,
      organizationId: null,
      plan: null,
      billingStatus: null,
      trialEndsAt: null,
      trialDaysLeft: null,
      reason: "unknown",
    };
  }

  if (organizationId === LEGACY_ORG_ID) {
    return {
      allowed: true,
      organizationId,
      plan: "trial",
      billingStatus: "trialing",
      trialEndsAt: null,
      trialDaysLeft: null,
      reason: "legacy",
    };
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("plan, billing_status, trial_ends_at")
    .eq("id", organizationId)
    .maybeSingle();

  if (!org) {
    return {
      allowed: true,
      organizationId,
      plan: null,
      billingStatus: null,
      trialEndsAt: null,
      trialDaysLeft: null,
      reason: "unknown",
    };
  }

  let plan = org.plan as OrgPlan;
  let billingStatus = org.billing_status as BillingStatus;
  let trialEndsAt = (org.trial_ends_at as string | null) ?? null;

  if (plan === "trial" && isTrialExpired(trialEndsAt)) {
    plan = await finalizeExpiredTrial(organizationId, plan, trialEndsAt);
    if (plan === "canceled") {
      billingStatus = "canceled";
      trialEndsAt = null;
    }
  }

  const allowed = isOrgAccessAllowed({ plan, billingStatus, trialEndsAt });

  let reason: BillingBlockReason = "active";
  if (!allowed) {
    reason = plan === "trial" || plan === "canceled" ? "trial_expired" : "subscription_inactive";
  } else if (plan === "trial") {
    reason = "trial";
  }

  return {
    allowed,
    organizationId,
    plan,
    billingStatus,
    trialEndsAt,
    trialDaysLeft: daysLeftInTrial(trialEndsAt),
    reason,
  };
}
