"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { PLAN_FEATURE_LABELS, hasPlanFeature, type PlanFeature } from "../../lib/billing/plans";
import { useBillingPlan } from "../../lib/billing/useBillingPlan";

function ProUpgradeInline({ feature }: { feature: PlanFeature }) {
  return (
    <div className="rounded-2xl border border-[color-mix(in_srgb,var(--accent)_30%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_6%,var(--surface))] px-4 py-4">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">Fonctionnalité Pro</p>
          <p className="mt-1 text-sm text-[color:var(--foreground)]/65">
            {PLAN_FEATURE_LABELS[feature]} est disponible avec le plan Pro.
          </p>
          <Link
            href="/pricing"
            className="mt-2 inline-flex text-sm font-semibold text-[var(--brand-primary)] hover:underline"
          >
            Voir les offres Pro →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PlanFeatureGate({
  feature,
  children,
  fallback,
}: {
  feature: PlanFeature;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { plan, loading } = useBillingPlan();

  if (loading) return null;
  if (!hasPlanFeature(plan, feature)) {
    return fallback ?? <ProUpgradeInline feature={feature} />;
  }

  return <>{children}</>;
}
