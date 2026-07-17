/**
 * Crée (ou affiche) le prix annuel Stripe aligné sur le mensuel existant × 10 mois.
 * Usage : npx tsx scripts/setup-stripe-annual-price.ts
 *
 * Nécessite STRIPE_SECRET_KEY et STRIPE_PRICE_SINGLE_PLAN dans l'environnement.
 */
import Stripe from "stripe";
import { BILLED_MONTHS_PER_YEAR } from "../lib/billing/plans";

async function main() {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  const monthlyPriceId = process.env.STRIPE_PRICE_SINGLE_PLAN?.trim();
  if (!secret) throw new Error("STRIPE_SECRET_KEY manquant");
  if (!monthlyPriceId) throw new Error("STRIPE_PRICE_SINGLE_PLAN manquant");

  const stripe = new Stripe(secret);
  const monthly = await stripe.prices.retrieve(monthlyPriceId, { expand: ["tiers"] });

  if (monthly.recurring?.interval !== "month") {
    throw new Error(`Le prix ${monthlyPriceId} n'est pas mensuel`);
  }

  const tiers =
    monthly.billing_scheme === "tiered" && monthly.tiers
      ? monthly.tiers.map((tier) => ({
          up_to: tier.up_to ?? ("inf" as const),
          flat_amount: tier.flat_amount ? tier.flat_amount * BILLED_MONTHS_PER_YEAR : undefined,
          unit_amount: tier.unit_amount ? tier.unit_amount * BILLED_MONTHS_PER_YEAR : undefined,
        }))
      : [
          {
            up_to: "inf" as const,
            unit_amount: (monthly.unit_amount ?? 0) * BILLED_MONTHS_PER_YEAR,
          },
        ];

  const created = await stripe.prices.create({
    currency: monthly.currency,
    product: typeof monthly.product === "string" ? monthly.product : monthly.product.id,
    billing_scheme: monthly.billing_scheme,
    tiers_mode: monthly.tiers_mode ?? "volume",
    recurring: { interval: "year", usage_type: "licensed" },
    nickname: "WorkSpace · annuel · 2 mois offerts",
    metadata: { interval: "year", free_months: "2" },
    tiers,
  });

  console.log("Prix annuel créé :", created.id);
  console.log("Ajoutez à .env.local et Vercel :");
  console.log(`STRIPE_PRICE_SINGLE_PLAN_ANNUAL=${created.id}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
