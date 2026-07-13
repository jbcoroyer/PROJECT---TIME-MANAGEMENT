import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  mapStripeSubscriptionStatus,
  planFromPriceId,
  type BillingStatus,
  type OrgPlan,
} from "../../../../lib/billing/plans";
import {
  findOrganizationByStripeCustomerId,
  findOrganizationByStripeSubscriptionId,
  updateOrganizationBilling,
} from "../../../../lib/server/billingOrg";
import { getStripe } from "../../../../lib/server/stripe";

export const runtime = "nodejs";

async function syncSubscription(subscription: Stripe.Subscription) {
  const organizationId =
    subscription.metadata.organization_id ||
    (await findOrganizationByStripeSubscriptionId(subscription.id))?.id ||
    (typeof subscription.customer === "string"
      ? (await findOrganizationByStripeCustomerId(subscription.customer))?.id
      : null);

  if (!organizationId) {
    console.warn("[stripe/webhook] organisation introuvable pour abonnement", subscription.id);
    return;
  }

  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const planFromMeta = subscription.metadata.plan;
  const plan: OrgPlan =
    planFromPriceId(priceId) ||
    (planFromMeta === "starter" || planFromMeta === "pro" ? planFromMeta : null) ||
    "starter";

  const billingStatus: BillingStatus = mapStripeSubscriptionStatus(subscription.status);

  await updateOrganizationBilling(organizationId, {
    plan,
    billingStatus,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId:
      typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id ?? null,
    trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
  });
}

function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const legacy = (invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null })
    .subscription;
  if (typeof legacy === "string") return legacy;
  if (legacy && typeof legacy === "object" && "id" in legacy) return legacy.id ?? null;

  const parentSub = invoice.parent?.subscription_details?.subscription;
  if (typeof parentSub === "string") return parentSub;
  return null;
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET manquant." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Signature manquante." }, { status: 400 });
  }

  const body = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Signature invalide";
    console.error("[stripe/webhook] verify", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const organizationId = session.metadata?.organization_id || session.client_reference_id;
        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id ?? null;

        if (organizationId && customerId) {
          await updateOrganizationBilling(organizationId, {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
          });
        }

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await syncSubscription(subscription);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscription(subscription);
        if (event.type === "customer.subscription.deleted") {
          const organizationId =
            subscription.metadata.organization_id ||
            (await findOrganizationByStripeSubscriptionId(subscription.id))?.id;
          if (organizationId) {
            await updateOrganizationBilling(organizationId, {
              plan: "trial",
              billingStatus: "canceled",
              stripeSubscriptionId: null,
            });
          }
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = subscriptionIdFromInvoice(invoice);
        if (subscriptionId) {
          const org = await findOrganizationByStripeSubscriptionId(subscriptionId);
          if (org) {
            await updateOrganizationBilling(org.id, { billingStatus: "past_due" });
          }
        }
        break;
      }
      default:
        break;
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur webhook";
    console.error("[stripe/webhook] handler", event.type, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
