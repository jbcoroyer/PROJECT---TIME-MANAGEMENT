/** Active le blocage auto vers /billing (essai expiré). Désactivé par défaut. */
export function isBillingEnforcementEnabled(): boolean {
  return process.env.BILLING_ENFORCEMENT === "true";
}
