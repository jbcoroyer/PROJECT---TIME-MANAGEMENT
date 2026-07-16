"use client";

import type { ReactNode } from "react";

/** Toutes les fonctionnalités sont incluses — ce composant affiche toujours ses enfants. */
export default function PlanFeatureGate({
  children,
}: {
  feature?: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return <>{children}</>;
}
