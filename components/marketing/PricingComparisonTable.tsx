import { Check, Minus, Sparkles } from "lucide-react";
import type { CSSProperties } from "react";
import {
  PLAN_COMPARISON_ROWS,
  PUBLIC_PLAN_MARKETING,
  type ComparisonCellValue,
  type PublicPlan,
} from "../../lib/billing/plans";

const PLAN_ORDER: PublicPlan[] = ["free", "starter", "pro"];

const PLAN_ACCENTS: Record<PublicPlan, string> = {
  free: "var(--mkt-free)",
  starter: "var(--mkt-standard)",
  pro: "var(--mkt-pro)",
};

export default function PricingComparisonTable() {
  return (
    <div className="mkt-comparison">
      <div className="mkt-comparison__glow" aria-hidden />

      <div className="mkt-comparison__table-wrap">
        <table className="mkt-comparison__table">
          <thead>
            <tr>
              <th className="mkt-comparison__feature-col" scope="col">
                <span className="mkt-comparison__feature-label">Fonctionnalité</span>
              </th>
              {PLAN_ORDER.map((planId) => {
                const plan = PUBLIC_PLAN_MARKETING[planId];
                const isFeatured = plan.highlighted;
                return (
                  <th
                    key={planId}
                    scope="col"
                    className={[
                      "mkt-comparison__plan-col",
                      isFeatured && "mkt-comparison__plan-col--featured",
                      planId === "pro" && "mkt-comparison__plan-col--pro",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={{ "--plan-accent": PLAN_ACCENTS[planId] } as CSSProperties}
                  >
                    <div className="mkt-comparison__plan-head">
                      {plan.badge ? (
                        <span className={`mkt-comparison__plan-badge mkt-comparison__plan-badge--${planId}`}>
                          {plan.badge}
                        </span>
                      ) : null}
                      <span className="mkt-comparison__plan-name">{plan.name}</span>
                      <span className="mkt-comparison__plan-price">
                        {plan.price}
                        {plan.priceSuffix ? (
                          <span className="mkt-comparison__plan-suffix">{plan.priceSuffix}</span>
                        ) : null}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {PLAN_COMPARISON_ROWS.map((row, index) => (
              <tr
                key={row.label}
                className={index % 2 === 0 ? "mkt-comparison__row--alt" : undefined}
              >
                <th scope="row" className="mkt-comparison__feature-cell">
                  {row.label}
                </th>
                <ComparisonDataCell value={row.free} planId="free" />
                <ComparisonDataCell value={row.starter} planId="starter" featured />
                <ComparisonDataCell value={row.pro} planId="pro" pro />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ComparisonDataCell({
  value,
  planId,
  featured,
  pro,
}: {
  value: ComparisonCellValue;
  planId: PublicPlan;
  featured?: boolean;
  pro?: boolean;
}) {
  const accent = PLAN_ACCENTS[planId];

  return (
    <td
      className={[
        "mkt-comparison__data-cell",
        featured && "mkt-comparison__data-cell--featured",
        pro && "mkt-comparison__data-cell--pro",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <ComparisonValue value={value} accent={accent} />
    </td>
  );
}

function ComparisonValue({ value, accent }: { value: ComparisonCellValue; accent: string }) {
  if (typeof value === "string") {
    const isOptional = value.includes("Au choix");
    return (
      <span
        className={[
          "mkt-comparison__text",
          isOptional && "mkt-comparison__text--optional",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ color: accent }}
      >
        {isOptional ? <Sparkles className="mkt-comparison__sparkle" aria-hidden /> : null}
        {value}
      </span>
    );
  }

  if (value) {
    return (
      <span className="mkt-comparison__check" style={{ "--check-accent": accent } as CSSProperties}>
        <Check className="mkt-comparison__check-icon" strokeWidth={2.5} aria-hidden />
        <span className="sr-only">Inclus</span>
      </span>
    );
  }

  return (
    <span className="mkt-comparison__dash" aria-label="Non inclus">
      <Minus className="mkt-comparison__dash-icon" aria-hidden />
    </span>
  );
}
