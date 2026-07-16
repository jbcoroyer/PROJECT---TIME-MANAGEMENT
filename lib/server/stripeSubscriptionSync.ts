import "server-only";

import * as Sentry from "@sentry/nextjs";
import { getOrganizationBilling } from "./billingOrg";
import { countOrganizationMembers } from "./orgMembers";
import { getStripe, isStripeConfigured } from "./stripe";

export type StripeQuantitySyncResult =
  | { ok: true; quantity: number; updated: boolean }
  | { ok: false; error: string; skipped?: boolean };

/** Met à jour la quantity Stripe = nombre de profils actifs de l'organisation. */
export async function syncStripeSubscriptionQuantity(
  organizationId: string,
  reason: string,
): Promise<StripeQuantitySyncResult> {
  if (!isStripeConfigured()) {
    return { ok: false, error: "Stripe non configuré", skipped: true };
  }

  const org = await getOrganizationBilling(organizationId);
  if (!org?.stripeSubscriptionId) {
    return { ok: false, error: "Aucun abonnement Stripe actif", skipped: true };
  }

  const quantity = Math.max(1, await countOrganizationMembers(organizationId));

  try {
    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(org.stripeSubscriptionId);
    const item = subscription.items.data[0];
    if (!item?.id) {
      return { ok: false, error: "Ligne d'abonnement Stripe introuvable" };
    }

    const currentQuantity = item.quantity ?? 0;
    if (currentQuantity === quantity) {
      console.info(
        `[billing/stripe-quantity] org=${organizationId} quantity=${quantity} unchanged reason=${reason}`,
      );
      return { ok: true, quantity, updated: false };
    }

    await stripe.subscriptions.update(org.stripeSubscriptionId, {
      items: [{ id: item.id, quantity }],
      proration_behavior: "create_prorations",
    });

    const message = `[billing/stripe-quantity] org=${organizationId} ${currentQuantity}→${quantity} reason=${reason}`;
    console.info(message);
    Sentry.captureMessage("Stripe subscription quantity updated", {
      level: "info",
      tags: { organizationId, reason },
      extra: { previousQuantity: currentQuantity, quantity, subscriptionId: org.stripeSubscriptionId },
    });

    return { ok: true, quantity, updated: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur Stripe inconnue";
    console.error(`[billing/stripe-quantity] org=${organizationId} failed reason=${reason}:`, message);
    Sentry.captureException(error, {
      tags: { organizationId, reason },
      extra: { subscriptionId: org.stripeSubscriptionId, quantity },
    });
    return { ok: false, error: message };
  }
}
