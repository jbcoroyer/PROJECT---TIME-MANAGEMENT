"use client";

import type { ReactNode } from "react";
import { useBranding } from "../../../lib/brandingContext";
import StockSectionNav from "../../StockSectionNav";

export default function StockWorkspaceLayout({ children }: { children: ReactNode }) {
  const { branding, loading } = useBranding();
  const showNav = !loading && branding.stockOnboardingCompleted;

  if (!showNav) {
    return <>{children}</>;
  }

  return (
    <div className="space-y-6">
      <StockSectionNav />
      {children}
    </div>
  );
}
