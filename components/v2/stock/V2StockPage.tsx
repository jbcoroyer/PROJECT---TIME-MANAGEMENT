"use client";

import V2StockBoutique from "./V2StockBoutique";
import StockOnboardingWizard from "./StockOnboardingWizard";
import { useBranding } from "../../../lib/brandingContext";

export default function V2StockPage() {
  const { branding, loading, reload } = useBranding();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-[var(--ink-muted)]">…</p>
      </div>
    );
  }

  if (!branding.stockOnboardingCompleted) {
    return <StockOnboardingWizard onComplete={() => void reload()} />;
  }

  return <V2StockBoutique basePath="/stock" />;
}
