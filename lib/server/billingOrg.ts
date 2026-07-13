import "server-only";

import type { BillingStatus, OrgPlan } from "../billing/plans";
import { isTrialExpired } from "../billing/plans";
import { createSupabaseAdmin } from "./supabaseAdmin";

export type OrganizationBilling = {
  id: string;
  name: string;
  plan: OrgPlan;
  billingStatus: BillingStatus;
  trialEndsAt: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  planUpdatedAt: string | null;
};

type OrgBillingRow = {
  id: string;
  name: string;
  plan: string;
  billing_status: string;
  trial_ends_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_updated_at: string | null;
};

const SELECT =
  "id, name, plan, billing_status, trial_ends_at, stripe_customer_id, stripe_subscription_id, plan_updated_at";

function rowToBilling(row: OrgBillingRow): OrganizationBilling {
  return {
    id: row.id,
    name: row.name,
    plan: row.plan as OrgPlan,
    billingStatus: row.billing_status as BillingStatus,
    trialEndsAt: row.trial_ends_at,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    planUpdatedAt: row.plan_updated_at,
  };
}

export async function getOrganizationBilling(organizationId: string): Promise<OrganizationBilling | null> {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("organizations")
    .select(SELECT)
    .eq("id", organizationId)
    .maybeSingle();

  if (error || !data) return null;
  return rowToBilling(data as OrgBillingRow);
}

export async function updateOrganizationBilling(
  organizationId: string,
  patch: Partial<{
    plan: OrgPlan;
    billingStatus: BillingStatus;
    trialEndsAt: string | null;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
  }>,
): Promise<void> {
  const admin = createSupabaseAdmin();
  const update: Record<string, unknown> = { plan_updated_at: new Date().toISOString() };

  if (patch.plan !== undefined) update.plan = patch.plan;
  if (patch.billingStatus !== undefined) update.billing_status = patch.billingStatus;
  if (patch.trialEndsAt !== undefined) update.trial_ends_at = patch.trialEndsAt;
  if (patch.stripeCustomerId !== undefined) update.stripe_customer_id = patch.stripeCustomerId;
  if (patch.stripeSubscriptionId !== undefined) update.stripe_subscription_id = patch.stripeSubscriptionId;

  const { error } = await admin.from("organizations").update(update).eq("id", organizationId);
  if (error) {
    throw new Error(error.message);
  }
}

export async function findOrganizationByStripeCustomerId(
  customerId: string,
): Promise<OrganizationBilling | null> {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("organizations")
    .select(SELECT)
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (error || !data) return null;
  return rowToBilling(data as OrgBillingRow);
}

export async function findOrganizationByStripeSubscriptionId(
  subscriptionId: string,
): Promise<OrganizationBilling | null> {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("organizations")
    .select(SELECT)
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();

  if (error || !data) return null;
  return rowToBilling(data as OrgBillingRow);
}

export async function listTrialingOrganizations(): Promise<OrganizationBilling[]> {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("organizations")
    .select(SELECT)
    .eq("plan", "trial")
    .eq("billing_status", "trialing")
    .not("trial_ends_at", "is", null);

  if (error || !data?.length) return [];
  return data.map((row) => rowToBilling(row as OrgBillingRow));
}

/** Passe une organisation dont l'essai est expiré sur le plan Gratuit. */
export async function downgradeExpiredTrialToFree(
  organizationId: string,
  plan: OrgPlan,
  trialEndsAt: string | null,
): Promise<OrgPlan> {
  if (plan !== "trial" || !isTrialExpired(trialEndsAt)) return plan;

  await updateOrganizationBilling(organizationId, {
    plan: "free",
    billingStatus: "active",
    trialEndsAt: null,
  });
  return "free";
}
