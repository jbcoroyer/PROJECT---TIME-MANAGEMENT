import type { AppModuleId } from "../modules/types";

export type OrgPlan = "trial" | "free" | "starter" | "pro";

export type BillingStatus = "trialing" | "active" | "past_due" | "canceled" | "unpaid";

export const TRIAL_DAYS = 14;

export type PaidPlan = "starter" | "pro";

/** Plans affichés sur la page tarifs et le marketing. */
export type PublicPlan = "free" | "starter" | "pro";

export type PlanFeature =
  | "ai"
  | "outlook_sync"
  | "slack_alerts"
  | "advanced_modules"
  | "team_workload";

/** Minimum de collaborateurs actifs pour afficher la charge équipe. */
export const TEAM_WORKLOAD_MIN_MEMBERS = 2;

export const PLAN_FEATURE_LABELS: Record<PlanFeature, string> = {
  ai: "Assistant IA (reformulation, synthèses)",
  outlook_sync: "Synchronisation Outlook / Microsoft 365",
  slack_alerts: "Alertes stock Slack / Teams",
  advanced_modules:
    "Modules avancés (événements, réseaux sociaux, fichiers & visuels, stock, objectifs, enquêtes)",
  team_workload: "Vue charge équipe (répartition par collaborateur)",
};

export type PublicPlanMarketing = {
  name: string;
  tagline: string;
  description: string;
  price: string;
  priceSuffix?: string;
  badge?: string;
  highlighted?: boolean;
  ctaLabel: string;
};

export const PUBLIC_PLAN_MARKETING: Record<PublicPlan, PublicPlanMarketing> = {
  free: {
    name: "Gratuit",
    tagline: "Pour tester sans engagement",
    description:
      "Choisissez jusqu'à 5 modules et travaillez à deux — idéal pour valider l'outil avant de faire grandir l'équipe.",
    price: "0 €",
    badge: "Sans CB",
    ctaLabel: "Commencer gratuitement",
  },
  starter: {
    name: "Starter",
    tagline: "L'équipe se structure",
    description:
      "Tous les modules débloqués pour une petite équipe qui veut centraliser pilotage, com' et opérations sans outils éparpillés.",
    price: "19 €",
    priceSuffix: "/mois",
    badge: "Le plus populaire",
    highlighted: true,
    ctaLabel: "Essayer 14 jours gratuits",
  },
  pro: {
    name: "Pro",
    tagline: "Pour les équipes qui accélèrent",
    description:
      "Jusqu'à 25 collaborateurs, l'assistant IA et les intégrations Outlook & Slack — votre QG projet complet.",
    price: "49 €",
    priceSuffix: "/mois",
    badge: "Le plus complet",
    ctaLabel: "Essayer 14 jours gratuits",
  },
};

export const ENTERPRISE_MARKETING = {
  name: "Entreprise",
  tagline: "Plus de 25 collaborateurs ?",
  description:
    "Volumes importants, besoins spécifiques ou déploiement multi-équipes : construisons une offre sur mesure ensemble.",
  ctaLabel: "Nous contacter",
  contactEmail: "contact@workspace-demo.fr",
} as const;

export const FREE_MAX_MEMBERS = 2;
export const FREE_MAX_MODULES = 5;

export const STARTER_MIN_MEMBERS = 2;
export const STARTER_MAX_MEMBERS = 5;

export const PRO_MIN_MEMBERS = 5;
export const PRO_MAX_MEMBERS = 25;

export const PLAN_MARKETING_FEATURES: Record<PublicPlan, string[]> = {
  free: [
    "1 à 2 personnes sur le même espace",
    "5 modules au choix parmi les 11",
    "Tableau de bord, planning, tâches…",
    "Gratuit à vie — aucune carte bancaire",
    "Passez au Starter quand l'équipe grandit",
  ],
  starter: [
    "2 à 5 collaborateurs invités",
    "Les 11 modules — sans restriction",
    "Vue charge équipe (dès 2 personnes)",
    "Événements, réseaux sociaux, stock & fichiers",
    "Logo et couleurs de votre espace",
    "Support par e-mail sous 48 h",
  ],
  pro: [
    "5 à 25 collaborateurs",
    "Tous les modules + assistant IA",
    "Vue charge équipe & analytics avancés",
    "Sync Outlook & alertes Slack / Teams",
    "Objectifs d'équipe & enquêtes avancées",
    "Support prioritaire & onboarding dédié",
  ],
};

export type ComparisonCellValue = boolean | string;

export type PlanComparisonRow = {
  label: string;
  free: ComparisonCellValue;
  starter: ComparisonCellValue;
  pro: ComparisonCellValue;
};

export const PLAN_COMPARISON_ROWS: PlanComparisonRow[] = [
  { label: "Utilisateurs", free: "1 à 2", starter: "2 à 5", pro: "5 à 25" },
  { label: "Modules activables", free: "5 max", starter: "11 (tous)", pro: "11 (tous)" },
  { label: "Tableau de bord & tâches", free: true, starter: true, pro: true },
  { label: "Charge équipe", free: false, starter: true, pro: true },
  { label: "Planning & boîte à idées", free: true, starter: true, pro: true },
  { label: "Boîte à demandes", free: true, starter: true, pro: true },
  { label: "Événements & réseaux sociaux", free: "Au choix*", starter: true, pro: true },
  { label: "Fichiers, stock & objectifs", free: "Au choix*", starter: true, pro: true },
  { label: "Enquêtes de satisfaction", free: "Au choix*", starter: true, pro: true },
  { label: "Assistant IA", free: false, starter: false, pro: true },
  { label: "Outlook & Slack / Teams", free: false, starter: false, pro: true },
  { label: "Personnalisation (logo & couleurs)", free: false, starter: true, pro: true },
  { label: "Support", free: "Communauté", starter: "E-mail 48 h", pro: "Prioritaire" },
];

export function isTrialExpired(trialEndsAt: string | null): boolean {
  if (!trialEndsAt) return false;
  return new Date(trialEndsAt).getTime() <= Date.now();
}

/** Plan effectif après expiration d'essai (rétrogradation automatique vers Gratuit). */
export function effectivePlanForOrg(input: {
  plan: OrgPlan;
  trialEndsAt: string | null;
}): OrgPlan {
  if (input.plan === "trial" && isTrialExpired(input.trialEndsAt)) {
    return "free";
  }
  return input.plan;
}

export function maxModulesForPlan(plan: OrgPlan): number | null {
  if (plan === "free") return FREE_MAX_MODULES;
  return null;
}

/** Tous les modules sont autorisés par identifiant ; la limite Gratuit porte sur le nombre activé. */
export function isModuleAllowedForPlan(plan: OrgPlan, moduleId: AppModuleId): boolean {
  void plan;
  void moduleId;
  return true;
}

export function hasPlanFeature(plan: OrgPlan, feature: PlanFeature): boolean {
  if (plan === "trial") return true;
  if (feature === "team_workload") return plan === "starter" || plan === "pro";
  if (plan === "pro") return true;
  return false;
}

/** Charge équipe : plan payant (Starter/Pro ou essai) et au moins 2 collaborateurs actifs. */
export function canAccessTeamWorkload(plan: OrgPlan, activeMemberCount: number): boolean {
  if (activeMemberCount < TEAM_WORKLOAD_MIN_MEMBERS) return false;
  return hasPlanFeature(plan, "team_workload");
}

/** Nombre max de comptes par organisation (`null` = illimité côté produit). */
export function maxMembersForPlan(plan: OrgPlan): number | null {
  if (plan === "free") return FREE_MAX_MEMBERS;
  if (plan === "starter") return STARTER_MAX_MEMBERS;
  if (plan === "pro") return PRO_MAX_MEMBERS;
  return null;
}

export function minMembersForPlan(plan: OrgPlan): number | null {
  if (plan === "starter") return STARTER_MIN_MEMBERS;
  if (plan === "pro") return PRO_MIN_MEMBERS;
  return null;
}

export function canAddOrgMember(plan: OrgPlan, currentMemberCount: number): boolean {
  const max = maxMembersForPlan(plan);
  if (max === null) return true;
  return currentMemberCount < max;
}

export function effectiveModulesForPlan(plan: OrgPlan, enabledModules: AppModuleId[]): AppModuleId[] {
  const max = maxModulesForPlan(plan);
  if (max === null) return enabledModules;
  return enabledModules.slice(0, max);
}

export const PLAN_LABELS: Record<OrgPlan, string> = {
  trial: "Essai gratuit",
  free: "Gratuit",
  starter: "Starter",
  pro: "Pro",
};

export function memberLimitErrorForPlan(plan: OrgPlan): string {
  if (plan === "free") {
    return "Limite de 2 utilisateurs atteinte sur le plan Gratuit. Passez au plan Starter ou Pro pour inviter plus de collègues.";
  }
  if (plan === "starter") {
    return "Limite de 5 membres atteinte sur le plan Starter. Passez au plan Pro (jusqu'à 25) ou contactez-nous au-delà.";
  }
  if (plan === "pro") {
    return "Limite de 25 membres atteinte sur le plan Pro. Contactez-nous pour une offre Entreprise sur mesure.";
  }
  return "Limite de membres atteinte pour votre plan.";
}

export function moduleLimitErrorForPlan(plan: OrgPlan): string {
  if (plan === "free") {
    return `Le plan Gratuit permet ${FREE_MAX_MODULES} modules maximum. Passez au Starter pour débloquer les 11 modules.`;
  }
  return "Limite de modules atteinte pour votre plan.";
}

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
  const effective = effectivePlanForOrg(input);
  if (effective === "free") return true;

  if (input.plan === "trial") {
    if (!input.trialEndsAt) return true;
    return new Date(input.trialEndsAt).getTime() > Date.now();
  }

  return (
    input.billingStatus === "active" ||
    input.billingStatus === "trialing" ||
    input.billingStatus === "past_due"
  );
}

export function daysLeftInTrial(trialEndsAt: string | null): number | null {
  if (!trialEndsAt) return null;
  const ms = new Date(trialEndsAt).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
