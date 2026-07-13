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
    <div
      className={[
        "mkt-pricing-card mkt-card-hover",
        planId === "free" && "mkt-pricing-card--free",
        planId === "starter" && "mkt-pricing-card--standard",
        planId === "pro" && "mkt-pricing-card--pro",
        plan.highlighted && !compact && "md:-mt-2 md:mb-2",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {plan.badge && (
        <span
          className={[
            "mkt-plan-badge mb-3 self-start",
            planId === "free" && "mkt-plan-badge--free",
            planId === "starter" && "mkt-plan-badge--standard",
            planId === "pro" && "mkt-plan-badge--pro",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {plan.badge}
        </span>
      )}

      <h2 className="text-xl font-bold text-[var(--foreground)]" style={{ color: accentVar }}>
        {plan.name}
      </h2>
      <p className="mt-1 text-sm font-medium text-[color:var(--foreground)]/75">{plan.tagline}</p>
      {!compact && <p className="mt-2 text-sm leading-relaxed text-[color:var(--foreground)]/60">{plan.description}</p>}

      <ul className={compact ? "mt-4 space-y-1.5" : "mt-6 space-y-2.5"}>
        {features.map((feature) => (
          <li
            key={feature}
            className={[
              "flex items-start gap-2 text-[color:var(--foreground)]/80",
              compact ? "text-xs" : "text-sm",
            ].join(" ")}
          >
            <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accentVar }} />
            {feature}
          </li>
        ))}
      </ul>

      <Link
        href={ctaHref}
        className={[
          "ui-transition mt-auto flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold",
          plan.highlighted
            ? "text-white hover:opacity-90"
            : "border border-[var(--line)] bg-[var(--surface-soft)] text-[var(--foreground)] hover:bg-[var(--surface)]",
          compact ? "mt-4" : "mt-8",
        ].join(" ")}
        style={
          plan.highlighted
            ? { background: `linear-gradient(135deg, ${accentVar}, color-mix(in srgb, ${accentVar} 80%, #1a1713))` }
            : undefined
        }
      >
        {plan.ctaLabel}
      </Link>
    </div>
  );
}
