import type { AppModuleId } from "../modules/types";

export type OrgPlan = "trial" | "starter" | "pro";

export type BillingStatus = "trialing" | "active" | "past_due" | "canceled" | "unpaid";

export const TRIAL_DAYS = 14;

export type PaidPlan = Exclude<OrgPlan, "trial">;

/** Modules inclus dans le plan Starter (le reste nécessite Pro). */
export const STARTER_MODULE_IDS: readonly AppModuleId[] = [
  "dashboard",
  "workspace",
  "asks",
  "planning",
  "ideas",
] as const;

export const PRO_ONLY_MODULE_IDS: readonly AppModuleId[] = [
  "events",
  "social",
  "dam",
  "stock",
  "okr",
  "surveys",
] as const;

export type PlanFeature = "ai" | "outlook_sync" | "slack_alerts" | "advanced_modules";

export const PLAN_FEATURE_LABELS: Record<PlanFeature, string> = {
  ai: "Assistant IA (reformulation, synthèses)",
  outlook_sync: "Synchronisation Outlook / Microsoft 365",
  slack_alerts: "Alertes stock Slack / Teams",
  advanced_modules: "Modules avancés (événements, social, DAM, stock, OKR, questionnaires)",
};

export const STARTER_MAX_MEMBERS = 5;

export const PLAN_MARKETING_FEATURES: Record<PaidPlan, string[]> = {
  starter: [
    "Jusqu'à 5 membres",
    "Tableau de bord & kanban",
    "Tâches & planning",
    "Boîte à idées",
    "Support par e-mail",
  ],
  pro: [
    "Membres illimités",
    "Tous les modules Starter",
    "Événements, social, DAM, stock",
    "OKR & questionnaires",
    "Assistant IA intégré",
    "Sync Outlook & alertes Slack",
    "Support prioritaire",
  ],
};

export function isModuleAllowedForPlan(plan: OrgPlan, moduleId: AppModuleId): boolean {
  if (plan === "trial" || plan === "pro") return true;
  return STARTER_MODULE_IDS.includes(moduleId);
}

export function hasPlanFeature(plan: OrgPlan, feature: PlanFeature): boolean {
  if (plan === "trial" || plan === "pro") return true;
  void feature;
  return false;
}

/** Nombre max de comptes par organisation (`null` = illimité). */
export function maxMembersForPlan(plan: OrgPlan): number | null {
  if (plan === "starter") return STARTER_MAX_MEMBERS;
  return null;
}

export function canAddOrgMember(plan: OrgPlan, currentMemberCount: number): boolean {
  const max = maxMembersForPlan(plan);
  if (max === null) return true;
  return currentMemberCount < max;
}

export function effectiveModulesForPlan(plan: OrgPlan, enabledModules: AppModuleId[]): AppModuleId[] {
  return enabledModules.filter((id) => isModuleAllowedForPlan(plan, id));
}

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
