import type { CSSProperties } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import type { PublicPlan } from "../../lib/billing/plans";
import { PUBLIC_PLAN_MARKETING } from "../../lib/billing/plans";

type PricingCardProps = {
  planId: PublicPlan;
  features: string[];
  ctaHref?: string;
  compact?: boolean;
};

export default function PricingCard({ planId, features, ctaHref = "/signup", compact = false }: PricingCardProps) {
  const plan = PUBLIC_PLAN_MARKETING[planId];
  const accentVar =
    planId === "free" ? "var(--mkt-free)" : planId === "starter" ? "var(--mkt-standard)" : "var(--mkt-pro)";

  return (
    <article
      className={[
        "mkt-pricing-card mkt-card-hover",
        planId === "free" && "mkt-pricing-card--free",
        planId === "starter" && "mkt-pricing-card--standard",
        planId === "pro" && "mkt-pricing-card--pro",
        plan.highlighted && !compact && "mkt-pricing-card--featured",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ "--card-accent": accentVar } as CSSProperties}
    >
      <div className="mkt-pricing-card__accent" aria-hidden />

      {plan.badge ? (
        <span
          className={[
            "mkt-plan-badge",
            planId === "free" && "mkt-plan-badge--free",
            planId === "starter" && "mkt-plan-badge--standard",
            planId === "pro" && "mkt-plan-badge--pro",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {plan.badge}
        </span>
      ) : null}

      <div className="mkt-pricing-card__header">
        <h2 className="mkt-pricing-card__name">{plan.name}</h2>
        <p className="mkt-pricing-card__price-row">
          <span className="mkt-pricing-card__price">{plan.price}</span>
          {plan.priceSuffix ? <span className="mkt-pricing-card__suffix">{plan.priceSuffix}</span> : null}
        </p>
        <p className="mkt-pricing-card__tagline">{plan.tagline}</p>
        {!compact ? <p className="mkt-pricing-card__desc">{plan.description}</p> : null}
      </div>

      <div className="mkt-pricing-card__divider" aria-hidden />

      <ul className={["mkt-pricing-card__features", compact && "mkt-pricing-card__features--compact"].filter(Boolean).join(" ")}>
        {features.map((feature) => (
          <li key={feature} className="mkt-pricing-card__feature">
            <span className="mkt-pricing-card__check" aria-hidden>
              <Check className="mkt-pricing-card__check-icon" strokeWidth={2.5} />
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href={ctaHref}
        className={[
          "mkt-pricing-card__cta ui-btn",
          plan.highlighted ? "ui-btn-primary" : "ui-btn-secondary",
        ].join(" ")}
      >
        {plan.ctaLabel}
      </Link>
    </article>
  );
}
