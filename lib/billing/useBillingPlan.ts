"use client";

import { useCallback, useEffect, useState } from "react";
import type { BillingStatus, OrgPlan } from "./plans";

export type BillingStatusSnapshot = {
  plan: OrgPlan;
  billingStatus: BillingStatus;
  trialDaysLeft: number | null;
  accessAllowed: boolean;
  isAdmin: boolean;
  memberCount: number;
  monthlyPriceCents: number;
  hasActiveSubscription: boolean;
};

type BillingPlanState = BillingStatusSnapshot & {
  loading: boolean;
  reload: () => void;
};

const DEFAULTS: BillingStatusSnapshot = {
  plan: "trial",
  billingStatus: "trialing",
  trialDaysLeft: null,
  accessAllowed: true,
  isAdmin: false,
  memberCount: 1,
  monthlyPriceCents: 1000,
  hasActiveSubscription: false,
};

export function useBillingPlan(): BillingPlanState {
  const [state, setState] = useState<BillingStatusSnapshot>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/billing/status");
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = (await res.json()) as Partial<BillingStatusSnapshot> & { plan?: OrgPlan };
      if (!data.plan) {
        setLoading(false);
        return;
      }
      setState({
        plan: data.plan,
        billingStatus: (data.billingStatus as BillingStatus) ?? DEFAULTS.billingStatus,
        trialDaysLeft: typeof data.trialDaysLeft === "number" ? data.trialDaysLeft : null,
        accessAllowed: data.accessAllowed !== false,
        isAdmin: Boolean(data.isAdmin),
        memberCount: typeof data.memberCount === "number" ? data.memberCount : 1,
        monthlyPriceCents:
          typeof data.monthlyPriceCents === "number" ? data.monthlyPriceCents : 1000,
        hasActiveSubscription: Boolean(data.hasActiveSubscription),
      });
    } catch {
      /* ignore — utilisateur non connecté ou billing indisponible */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onFocus = () => {
      void load();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  useEffect(() => {
    let midnightTimer: number | undefined;
    const scheduleMidnightRefresh = () => {
      const now = new Date();
      const next = new Date(now);
      next.setHours(24, 0, 0, 0);
      const delay = Math.max(60_000, next.getTime() - now.getTime());
      midnightTimer = window.setTimeout(() => {
        void load();
        scheduleMidnightRefresh();
      }, delay);
    };
    scheduleMidnightRefresh();
    const hourlyTimer = window.setInterval(() => void load(), 60 * 60 * 1000);
    return () => {
      if (midnightTimer !== undefined) window.clearTimeout(midnightTimer);
      window.clearInterval(hourlyTimer);
    };
  }, [load]);

  return { ...state, loading, reload: () => void load() };
}
