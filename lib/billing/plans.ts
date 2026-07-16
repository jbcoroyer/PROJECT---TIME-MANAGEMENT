import type { AppModuleId } from "../modules/types";

export type OrgPlan = "trial" | "active" | "canceled";

export type BillingStatus = "trialing" | "active" | "past_due" | "canceled" | "unpaid";

export const TRIAL_DAYS = 14;

export const PRICE_PER_SEAT_CENTS = 200;
export const MONTHLY_FLOOR_CENTS = 1000;
export const FLOOR_INCLUDED_SEATS = 5;

/** Minimum de collaborateurs actifs pour afficher la charge équipe. */
export const TEAM_WORKLOAD_MIN_MEMBERS = 2;

export const SINGLE_PLAN_FEATURES = [
  "Les 11 modules — Kanban, planning, events, social, stock…",
  "Espace demandes client + triage vers tâches",
  "Agenda avec réservation publique de créneaux",
  "Assistant IA, sync Outlook et alertes Slack / Teams",
  "Bibliothèque de fichiers, enquêtes et objectifs d'équipe",
  "Personnalisation (logo & couleurs) + invitations illimitées",
] as const;

/** Montants affichés (entiers en euros). */
export const PRICE_PER_SEAT_EUR = PRICE_PER_SEAT_CENTS / 100;
export const MONTHLY_FLOOR_EUR = MONTHLY_FLOOR_CENTS / 100;

export function calculateMonthlyPriceCents(activeMemberCount: number): number {
  const seats = Math.max(0, activeMemberCount);
  return Math.max(MONTHLY_FLOOR_CENTS, seats * PRICE_PER_SEAT_CENTS);
}

export function formatMonthlyPriceEur(activeMemberCount: number): string {
  const euros = calculateMonthlyPriceCents(activeMemberCount) / 100;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(euros);
}

/** Résumé court pour SEO, emails et messages UI. */
export function singlePlanPricingSummary(): string {
  return `${PRICE_PER_SEAT_EUR} € par utilisateur et par mois, minimum ${MONTHLY_FLOOR_EUR} €/mois (jusqu'à ${FLOOR_INCLUDED_SEATS} personnes)`;
}

export function isTrialExpired(trialEndsAt: string | null): boolean {
  if (!trialEndsAt) return false;
  return new Date(trialEndsAt).getTime() <= Date.now();
}

/** Plan effectif après expiration d'essai (plus d'accès sans abonnement). */
export function effectivePlanForOrg(input: {
  plan: OrgPlan;
  trialEndsAt: string | null;
}): OrgPlan {
  if (input.plan === "trial" && isTrialExpired(input.trialEndsAt)) {
    return "canceled";
  }
  return input.plan;
}

/** Tous les modules sont inclus pour toutes les organisations avec accès. */
export function isModuleAllowedForPlan(_plan: OrgPlan, _moduleId: AppModuleId): boolean {
  return true;
}

/** Charge équipe : au moins 2 collaborateurs actifs (indépendant du plan). */
export function canAccessTeamWorkload(_plan: OrgPlan, activeMemberCount: number): boolean {
  return activeMemberCount >= TEAM_WORKLOAD_MIN_MEMBERS;
}

export function effectiveModulesForPlan(_plan: OrgPlan, enabledModules: AppModuleId[]): AppModuleId[] {
  return enabledModules;
}

export const PLAN_LABELS: Record<OrgPlan, string> = {
  trial: "Essai gratuit",
  active: "Abonnement",
  canceled: "Résilié",
};

export const BILLING_STATUS_LABELS: Record<BillingStatus, string> = {
  trialing: "Essai en cours",
  active: "Actif",
  past_due: "Paiement en retard",
  canceled: "Résilié",
  unpaid: "Impayé",
};

export function singlePlanPriceId(): string | null {
  return process.env.STRIPE_PRICE_SINGLE_PLAN?.trim() || null;
}

export function priceIdForPlan(): string | null {
  return singlePlanPriceId();
}

export function isSinglePlanPriceId(priceId: string | null | undefined): boolean {
  const single = singlePlanPriceId();
  return Boolean(single && priceId && priceId === single);
}

export function planFromPriceId(priceId: string | null | undefined): OrgPlan | null {
  if (isSinglePlanPriceId(priceId)) return "active";
  return null;
}

export function mapStripeSubscriptionStatus(status: string): BillingStatus {
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
  if (input.plan === "trial") {
    if (!input.trialEndsAt) return true;
    return new Date(input.trialEndsAt).getTime() > Date.now();
  }

  if (input.plan === "active") {
    return (
      input.billingStatus === "active" ||
      input.billingStatus === "trialing" ||
      input.billingStatus === "past_due"
    );
  }

  return false;
}

export function daysLeftInTrial(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null;
  const ms = new Date(trialEndsAt).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
