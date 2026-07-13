"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { Check } from "lucide-react";
import {
  ENTERPRISE_MARKETING,
  PLAN_MARKETING_FEATURES,
  PUBLIC_PLAN_MARKETING,
  type PublicPlan,
} from "../../lib/billing/plans";

type PricingTierId = PublicPlan | "enterprise";

const TIER_ORDER: PricingTierId[] = ["free", "starter", "pro", "enterprise"];

const TIER_ACCENTS: Record<PricingTierId, string> = {
  free: "var(--mkt-free, var(--ink-muted))",
  starter: "var(--mkt-standard, var(--accent))",
  pro: "var(--mkt-pro, var(--ink))",
  enterprise: "var(--ink)",
};

export default function LandingPricingSection() {
  const [selected, setSelected] = useState<PricingTierId>("starter");

  const features =
    selected === "enterprise"
      ? [
          "Plus de 25 collaborateurs",
          "Déploiement multi-équipes ou filiales",
          "Accompagnement et SLA sur mesure",
          "Facturation annuelle ou sur devis",
          "Contact direct avec notre équipe",
        ]
      : PLAN_MARKETING_FEATURES[selected];

  const accent = TIER_ACCENTS[selected];
  const isEnterprise = selected === "enterprise";

  return (
    <div id="tarifs" className="mkt-pricing-stack">
      <div className="mkt-pricing-tier-tabs" role="tablist" aria-label="Offres tarifaires">
        {TIER_ORDER.map((tierId) => {
          const isSelected = selected === tierId;
          const isFeatured = tierId === "starter";
          const label =
            tierId === "enterprise"
              ? ENTERPRISE_MARKETING.name
              : PUBLIC_PLAN_MARKETING[tierId].name;
          const price =
            tierId === "enterprise"
              ? "Sur devis"
              : PUBLIC_PLAN_MARKETING[tierId].price;
          const suffix =
            tierId !== "enterprise" ? PUBLIC_PLAN_MARKETING[tierId].priceSuffix : undefined;

          return (
            <button
              key={tierId}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setSelected(tierId)}
              className={[
                "mkt-pricing-tier-tab",
                isSelected && "mkt-pricing-tier-tab--active",
                isFeatured && "mkt-pricing-tier-tab--featured",
                isSelected && isFeatured && "mkt-pricing-tier-tab--featured-active",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {isFeatured ? <span className="mkt-pricing-popular">POPULAIRE</span> : null}
              <div className="flex items-baseline justify-between gap-3">
                <span className="ui-display text-base font-semibold">{label}</span>
                <span className="ui-display text-[22px] font-bold">
                  {price}
                  {suffix ? (
                    <span className="text-[12px] font-medium opacity-55">{suffix}</span>
                  ) : null}
                </span>
              </div>
              <p className="mt-1 text-left text-[13px] opacity-70">
                {tierId === "free" && "5 modules max · 1 à 2 personnes"}
                {tierId === "starter" && "Tous les modules · 2 à 5 personnes"}
                {tierId === "pro" && "IA & intégrations · 5 à 25 personnes"}
                {tierId === "enterprise" && "Au-delà de 25 personnes"}
              </p>
            </button>
          );
        })}
      </div>

      <div
        className="mkt-pricing-detail"
        role="tabpanel"
        aria-live="polite"
        style={{ "--mkt-tier-accent": accent } as CSSProperties}
      >
        <p className="text-sm font-semibold" style={{ color: accent }}>
          {isEnterprise
            ? ENTERPRISE_MARKETING.tagline
            : PUBLIC_PLAN_MARKETING[selected].tagline}
        </p>
        <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--ink-muted)]">
          {isEnterprise
            ? ENTERPRISE_MARKETING.description
            : PUBLIC_PLAN_MARKETING[selected].description}
        </p>
        <ul className="mt-4 space-y-2">
          {features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2 text-[13.5px] text-[color-mix(in_srgb,var(--ink)_82%,transparent)]"
            >
              <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accent }} />
              {feature}
            </li>
          ))}
        </ul>
        {isEnterprise ? (
          <a
            href={`mailto:${ENTERPRISE_MARKETING.contactEmail}?subject=Offre%20Entreprise%20Recueil`}
            className="mkt-cta-primary mt-5 w-full py-3 text-center text-sm"
          >
            {ENTERPRISE_MARKETING.ctaLabel}
          </a>
        ) : (
          <Link
            href={selected === "free" ? "/signup" : "/pricing"}
            className={[
              "mt-5 w-full py-3 text-center text-sm",
              selected === "starter" ? "mkt-cta-primary" : "mkt-cta-secondary",
            ].join(" ")}
          >
            {PUBLIC_PLAN_MARKETING[selected].ctaLabel}
          </Link>
        )}
      </div>

      <Link
        href="/pricing"
        className="mkt-cta-secondary w-full py-3 text-center text-sm"
      >
        Voir le comparatif complet
      </Link>
    </div>
  );
}
