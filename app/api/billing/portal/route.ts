import { NextResponse } from "next/server";
import { getOrganizationBilling } from "../../../../lib/server/billingOrg";
import { getServerOrgContext } from "../../../../lib/server/orgContext";
import { appBaseUrl, getStripe, isStripeConfigured } from "../../../../lib/server/stripe";

export async function POST() {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: "Stripe n'est pas configuré sur ce serveur." }, { status: 503 });
    }

    const ctx = await getServerOrgContext();
    if (!ctx?.isAdmin) {
      return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
    }

    const org = await getOrganizationBilling(ctx.organizationId);
    if (!org?.stripeCustomerId) {
      return NextResponse.json(
        { error: "Aucun abonnement Stripe associé à cette organisation." },
        { status: 400 },
      );
    }

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: `${appBaseUrl()}/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur serveur";
    console.error("[billing/portal]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
