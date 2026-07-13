import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { handleStripeWebhookEvent } from "../../../../lib/billing/stripeWebhookHandlers";
import {
  findOrganizationByStripeCustomerId,
  findOrganizationByStripeSubscriptionId,
  updateOrganizationBilling,
} from "../../../../lib/server/billingOrg";
import { getStripe } from "../../../../lib/server/stripe";
import { apiRateLimit } from "../../../../lib/server/rateLimit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limited = apiRateLimit(request, "api/webhooks/stripe", 120);
  if (limited) return limited;

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
    await handleStripeWebhookEvent(event, {
      findOrganizationByStripeCustomerId: async (customerId) => {
        const org = await findOrganizationByStripeCustomerId(customerId);
        return org ? { id: org.id } : null;
      },
      findOrganizationByStripeSubscriptionId: async (subscriptionId) => {
        const org = await findOrganizationByStripeSubscriptionId(subscriptionId);
        return org ? { id: org.id } : null;
      },
      updateOrganizationBilling,
      retrieveSubscription: (subscriptionId) => stripe.subscriptions.retrieve(subscriptionId),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur webhook";
    console.error("[stripe/webhook] handler", event.type, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
