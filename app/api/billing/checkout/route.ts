import { NextResponse } from "next/server";
import { priceIdForPlan, type BillingInterval } from "../../../../lib/billing/plans";
import { getOrganizationBilling, updateOrganizationBilling } from "../../../../lib/server/billingOrg";
import { countOrganizationMembers } from "../../../../lib/server/orgMembers";
import { getServerOrgContext } from "../../../../lib/server/orgContext";
import { apiRateLimit } from "../../../../lib/server/rateLimit";
import { appBaseUrl, getStripe, isStripeConfigured } from "../../../../lib/server/stripe";

export async function POST(request: Request) {
  const limited = apiRateLimit(request, "api/billing/checkout", 20);
  if (limited) return limited;

  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: "Stripe n'est pas configuré sur ce serveur." }, { status: 503 });
    }

    const ctx = await getServerOrgContext();
    if (!ctx?.isAdmin) {
      return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as { interval?: string };
    const interval: BillingInterval = body.interval === "year" ? "year" : "month";

    const priceId = priceIdForPlan(interval);
    if (!priceId) {
      return NextResponse.json(
        {
          error:
            interval === "year"
              ? "Tarif annuel Stripe non configuré."
              : "Tarif Stripe non configuré.",
        },
        { status: 503 },
      );
    }

    const org = await getOrganizationBilling(ctx.organizationId);
    if (!org) {
      return NextResponse.json({ error: "Organisation introuvable." }, { status: 404 });
    }

    const memberCount = await countOrganizationMembers(ctx.organizationId);
    const quantity = Math.max(1, memberCount);

    const stripe = getStripe();
    let customerId = org.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { organization_id: org.id },
        name: org.name,
      });
      customerId = customer.id;
      await updateOrganizationBilling(org.id, { stripeCustomerId: customerId });
    }

    const base = appBaseUrl();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity }],
      success_url: `${base}/billing?billing=success`,
      cancel_url: `${base}/billing?billing=cancel`,
      client_reference_id: org.id,
      metadata: { organization_id: org.id, billing_interval: interval },
      subscription_data: {
        metadata: { organization_id: org.id, billing_interval: interval },
      },
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Session Checkout indisponible." }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur serveur";
    console.error("[billing/checkout]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
