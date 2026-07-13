/** Active le blocage auto vers /billing (abonnement inactif). Activé par défaut en production. */
export function isBillingEnforcementEnabled(): boolean {
  const raw = process.env.BILLING_ENFORCEMENT?.trim().toLowerCase();
  if (raw === "false") return false;
  if (raw === "true") return true;
  return process.env.NODE_ENV === "production";
}
