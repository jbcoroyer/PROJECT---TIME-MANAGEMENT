export type OrgPlan = "trial" | "starter" | "pro";

export type BillingStatus = "trialing" | "active" | "past_due" | "canceled" | "unpaid";

export const TRIAL_DAYS = 14;

export const PLAN_LABELS: Record<OrgPlan, string> = {
  trial: "Essai gratuit",
  starter: "Starter",
  pro: "Pro",
};

export const BILLING_STATUS_LABELS: Record<BillingStatus, string> = {
  trialing: "Essai en cours",
  active: "Actif",
  past_due: "Paiement en retard",
  canceled: "Résilié",
  unpaid: "Impayé",
};

export type PaidPlan = Exclude<OrgPlan, "trial">;

export function isPaidPlan(value: string): value is PaidPlan {
  return value === "starter" || value === "pro";
}

export function priceIdForPlan(plan: PaidPlan): string | null {
  if (plan === "starter") return process.env.STRIPE_PRICE_STARTER?.trim() || null;
  if (plan === "pro") return process.env.STRIPE_PRICE_PRO?.trim() || null;
  return null;
}

export function planFromPriceId(priceId: string | null | undefined): PaidPlan | null {
  if (!priceId) return null;
  const starter = process.env.STRIPE_PRICE_STARTER?.trim();
  const pro = process.env.STRIPE_PRICE_PRO?.trim();
  if (starter && priceId === starter) return "starter";
  if (pro && priceId === pro) return "pro";
  return null;
}

export function mapStripeSubscriptionStatus(
  status: string,
): BillingStatus {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    case "unpaid":
      return "unpaid";
    default:
      return "active";
  }
}

export function isOrgAccessAllowed(input: {
  plan: OrgPlan;
  billingStatus: BillingStatus;
  trialEndsAt: string | null;
}): boolean {
  if (input.plan !== "trial") {
    return input.billingStatus === "active" || input.billingStatus === "trialing" || input.billingStatus === "past_due";
  }
  if (!input.trialEndsAt) return true;
  return new Date(input.trialEndsAt).getTime() > Date.now();
}

export function daysLeftInTrial(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null;
  const ms = new Date(trialEndsAt).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
