"use client";

import { useCallback, useEffect, useState } from "react";
import type { OrgPlan } from "../billing/plans";

type BillingPlanState = {
  plan: OrgPlan;
  loading: boolean;
};

export function useBillingPlan(): BillingPlanState {
  const [plan, setPlan] = useState<OrgPlan>("trial");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/billing/status");
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = (await res.json()) as { plan?: OrgPlan };
      if (data.plan) setPlan(data.plan);
    } catch {
      /* ignore — utilisateur non connecté ou billing indisponible */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { plan, loading };
}
