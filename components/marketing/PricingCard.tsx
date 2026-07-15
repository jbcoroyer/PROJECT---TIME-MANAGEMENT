import Link from "next/link";
import type { PublicPlan } from "../../lib/billing/plans";
import { PUBLIC_PLAN_MARKETING } from "../../lib/billing/plans";

type PricingCardProps = {
  planId: PublicPlan;
  features: string[];
  ctaHref?: string;
  compact?: boolean;
};

const PLAN_KICKERS: Record<PublicPlan, string> = {
  free: "Plan 01",
  starter: "Plan 02",
  pro: "Plan 03",
};

export default function PricingCard({
  planId,
  features,
  ctaHref = "/signup",
  compact = false,
}: PricingCardProps) {
  const plan = PUBLIC_PLAN_MARKETING[planId];
  const featured = plan.highlighted;

  return (
    <article
      className={[
        "mkt-pricing-card mkt-card-hover",
        featured && "mkt-pricing-card--featured",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {plan.badge ? (
        <span className="mkt-pricing-card__badge">✦ {plan.badge}</span>
      ) : null}

      <span className="mkt-pricing-card__kicker">{PLAN_KICKERS[planId]}</span>

      <p className="mkt-pricing-card__price">
        {plan.price}
        {plan.priceSuffix ? (
          <span className="mkt-pricing-card__price-suffix">{plan.priceSuffix}</span>
        ) : null}
      </p>
      <h2 className="mkt-pricing-card__name">{plan.name}</h2>
      {!compact ? <p className="mkt-pricing-card__desc">{plan.description}</p> : null}

      <ul className="mkt-pricing-card__features">
        {features.map((feature) => (
          <li key={feature} className="mkt-pricing-card__feature">
            <span className="mkt-pricing-card__star" aria-hidden>
              ✦
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href={ctaHref}
        className={[
          "mkt-pricing-card__cta",
          featured ? "mkt-pricing-card__cta--filled" : "mkt-pricing-card__cta--outline",
        ].join(" ")}
      >
        {plan.ctaLabel} <span className="font-[family-name:var(--font-mono)]">→</span>
      </Link>
    </article>
  );
}
