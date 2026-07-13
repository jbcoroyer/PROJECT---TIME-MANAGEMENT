import type Stripe from "stripe";
import {
  mapStripeSubscriptionStatus,
  planFromPriceId,
  type BillingStatus,
  type OrgPlan,
} from "./plans";

export type OrgBillingPatch = Partial<{
  plan: OrgPlan;
  billingStatus: BillingStatus;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  trialEndsAt: string | null;
}>;

export type StripeWebhookDeps = {
  findOrganizationByStripeCustomerId: (customerId: string) => Promise<{ id: string } | null>;
  findOrganizationByStripeSubscriptionId: (subscriptionId: string) => Promise<{ id: string } | null>;
  updateOrganizationBilling: (organizationId: string, patch: OrgBillingPatch) => Promise<void>;
  retrieveSubscription: (subscriptionId: string) => Promise<Stripe.Subscription>;
};

export function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const legacy = (invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null })
    .subscription;
  if (typeof legacy === "string") return legacy;
  if (legacy && typeof legacy === "object" && "id" in legacy) return legacy.id ?? null;

  const parentSub = invoice.parent?.subscription_details?.subscription;
  if (typeof parentSub === "string") return parentSub;
  return null;
}

export function resolvePlanFromSubscription(subscription: Stripe.Subscription): OrgPlan {
  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const planFromMeta = subscription.metadata.plan;
  return (
    planFromPriceId(priceId) ||
    (planFromMeta === "starter" || planFromMeta === "pro" ? planFromMeta : null) ||
    "starter"
  );
}

export function buildSubscriptionBillingPatch(subscription: Stripe.Subscription): OrgBillingPatch {
  return {
    plan: resolvePlanFromSubscription(subscription),
    billingStatus: mapStripeSubscriptionStatus(subscription.status),
    stripeSubscriptionId: subscription.id,
    stripeCustomerId:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id ?? null,
    trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
  };
}

export async function resolveOrganizationIdForSubscription(
  subscription: Stripe.Subscription,
  deps: Pick<
    StripeWebhookDeps,
    "findOrganizationByStripeSubscriptionId" | "findOrganizationByStripeCustomerId"
  >,
): Promise<string | null> {
  if (subscription.metadata.organization_id) {
    return subscription.metadata.organization_id;
  }

  const bySubscription = await deps.findOrganizationByStripeSubscriptionId(subscription.id);
  if (bySubscription) return bySubscription.id;

  if (typeof subscription.customer === "string") {
    const byCustomer = await deps.findOrganizationByStripeCustomerId(subscription.customer);
    if (byCustomer) return byCustomer.id;
  }

  return null;
}

export async function syncSubscriptionBilling(
  subscription: Stripe.Subscription,
  deps: StripeWebhookDeps,
): Promise<string | null> {
  const organizationId = await resolveOrganizationIdForSubscription(subscription, deps);
  if (!organizationId) return null;

  await deps.updateOrganizationBilling(organizationId, buildSubscriptionBillingPatch(subscription));
  return organizationId;
}

export async function handleStripeWebhookEvent(
  event: Stripe.Event,
  deps: StripeWebhookDeps,
): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const organizationId = session.metadata?.organization_id || session.client_reference_id || null;
      const customerId =
        typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id ?? null;

      if (organizationId && customerId) {
        await deps.updateOrganizationBilling(organizationId, {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
        });
      }

      if (subscriptionId) {
        const subscription = await deps.retrieveSubscription(subscriptionId);
        await syncSubscriptionBilling(subscription, deps);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const organizationId = await syncSubscriptionBilling(subscription, deps);

      if (event.type === "customer.subscription.deleted" && organizationId) {
        await deps.updateOrganizationBilling(organizationId, {
          plan: "free",
          billingStatus: "active",
          stripeSubscriptionId: null,
        });
      }
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = subscriptionIdFromInvoice(invoice);
      if (!subscriptionId) break;

      const org = await deps.findOrganizationByStripeSubscriptionId(subscriptionId);
      if (org) {
        await deps.updateOrganizationBilling(org.id, { billingStatus: "past_due" });
      }
      break;
    }
    default:
      break;
  }
}
