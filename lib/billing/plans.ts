import type { AppModuleId } from "../modules/types";

export type OrgPlan = "trial" | "active" | "canceled";

export type BillingStatus = "trialing" | "active" | "past_due" | "canceled" | "unpaid";

export const TRIAL_DAYS = 14;

export const PRICE_PER_SEAT_CENTS = 200;
export const MONTHLY_FLOOR_CENTS = 1000;
export const FLOOR_INCLUDED_SEATS = 5;

/** Mois facturés sur une année (2 mois offerts vs mensuel). */
export const ANNUAL_FREE_MONTHS = 2;
export const BILLED_MONTHS_PER_YEAR = 12 - ANNUAL_FREE_MONTHS;

export const PRICE_PER_SEAT_ANNUAL_CENTS = PRICE_PER_SEAT_CENTS * BILLED_MONTHS_PER_YEAR;
export const ANNUAL_FLOOR_CENTS = MONTHLY_FLOOR_CENTS * BILLED_MONTHS_PER_YEAR;

export type BillingInterval = "month" | "year";

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
export const PRICE_PER_SEAT_ANNUAL_EUR = PRICE_PER_SEAT_ANNUAL_CENTS / 100;
export const ANNUAL_FLOOR_EUR = ANNUAL_FLOOR_CENTS / 100;

export function calculateMonthlyPriceCents(activeMemberCount: number): number {
  const seats = Math.max(0, activeMemberCount);
  return Math.max(MONTHLY_FLOOR_CENTS, seats * PRICE_PER_SEAT_CENTS);
}

export function calculateAnnualPriceCents(activeMemberCount: number): number {
  const seats = Math.max(0, activeMemberCount);
  return Math.max(ANNUAL_FLOOR_CENTS, seats * PRICE_PER_SEAT_ANNUAL_CENTS);
}

export function calculatePriceCents(activeMemberCount: number, interval: BillingInterval): number {
  return interval === "year"
    ? calculateAnnualPriceCents(activeMemberCount)
    : calculateMonthlyPriceCents(activeMemberCount);
}

function formatPriceEur(cents: number): string {
  const euros = cents / 100;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(euros);
}

export function formatMonthlyPriceEur(activeMemberCount: number): string {
  return formatPriceEur(calculateMonthlyPriceCents(activeMemberCount));
}

export function formatAnnualPriceEur(activeMemberCount: number): string {
  return formatPriceEur(calculateAnnualPriceCents(activeMemberCount));
}

export function formatPriceEurForInterval(activeMemberCount: number, interval: BillingInterval): string {
  return interval === "year"
    ? formatAnnualPriceEur(activeMemberCount)
    : formatMonthlyPriceEur(activeMemberCount);
}

/** Équivalent mensuel lissé (affichage annuel « soit X €/mois »). */
export function formatAnnualMonthlyEquivalentEur(activeMemberCount: number): string {
  const annualCents = calculateAnnualPriceCents(activeMemberCount);
  return formatPriceEur(Math.round(annualCents / 12));
}

/** Résumé court pour SEO, emails et messages UI. */
export function singlePlanPricingSummary(interval: BillingInterval = "month"): string {
  if (interval === "year") {
    return `${PRICE_PER_SEAT_ANNUAL_EUR} € par utilisateur et par an (2 mois offerts), minimum ${ANNUAL_FLOOR_EUR} €/an (jusqu'à ${FLOOR_INCLUDED_SEATS} personnes)`;
  }
  return `${PRICE_PER_SEAT_EUR} € par utilisateur et par mois, minimum ${MONTHLY_FLOOR_EUR} €/mois (jusqu'à ${FLOOR_INCLUDED_SEATS} personnes)`;
}

/** Mensuel et annuel — emails et rappels essai. */
export function singlePlanPricingSummaryBoth(): string {
  return `${singlePlanPricingSummary("month")} — ou ${singlePlanPricingSummary("year")}`;
}

export function isTrialExpired(trialEndsAt: string | null): boolean {
  if (!trialEndsAt) return false;
  return new Date(trialEndsAt).getTime() <= Date.now();
}

/** Date de fin d'essai : DB ou création + TRIAL_DAYS si manquante. */
export function inferTrialEndsAt(
  trialEndsAt: string | null,
  plan: OrgPlan,
  orgCreatedAt: string | null,
): string | null {
  if (trialEndsAt) return trialEndsAt;
  if (plan !== "trial" || !orgCreatedAt) return null;
  const anchor = new Date(orgCreatedAt).getTime();
  if (Number.isNaN(anchor)) return null;
  return new Date(anchor + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
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

export function singlePlanPriceId(interval: BillingInterval = "month"): string | null {
  if (interval === "year") {
    return process.env.STRIPE_PRICE_SINGLE_PLAN_ANNUAL?.trim() || null;
  }
  return process.env.STRIPE_PRICE_SINGLE_PLAN?.trim() || null;
}

export function priceIdForPlan(interval: BillingInterval = "month"): string | null {
  return singlePlanPriceId(interval);
}

export function isSinglePlanPriceId(priceId: string | null | undefined): boolean {
  const monthly = process.env.STRIPE_PRICE_SINGLE_PLAN?.trim();
  const annual = process.env.STRIPE_PRICE_SINGLE_PLAN_ANNUAL?.trim();
  return Boolean(priceId && (priceId === monthly || priceId === annual));
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
    if (!input.trialEndsAt) return false;
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
