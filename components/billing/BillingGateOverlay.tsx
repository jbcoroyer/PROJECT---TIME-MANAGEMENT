"use client";

import { useBillingPlan } from "../../lib/billing/useBillingPlan";
import BillingRequiredScreen from "./BillingRequiredScreen";

/** Bloque l'interface si l'essai est expiré sans abonnement (couche client, non contournable seule). */
export default function BillingGateOverlay() {
  const { loading, accessAllowed, plan, trialDaysLeft, isAdmin } = useBillingPlan();

  if (loading || accessAllowed) return null;

  const reason =
    plan === "trial" || plan === "canceled" ? ("trial_expired" as const) : ("subscription_inactive" as const);

  return (
    <BillingRequiredScreen
      reason={reason}
      trialDaysLeft={trialDaysLeft}
      isAdmin={isAdmin}
      modal
    />
  );
}
