"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, ExternalLink, Loader2, Check } from "lucide-react";
import {
  FLOOR_INCLUDED_SEATS,
  MONTHLY_FLOOR_EUR,
  PRICE_PER_SEAT_EUR,
  SINGLE_PLAN_FEATURES,
  formatMonthlyPriceEur,
  singlePlanPricingSummary,
} from "../../lib/billing/plans";
import { useTranslation } from "../../lib/i18n/useTranslation";
import { toastError, toastSuccess } from "../../lib/toast";

type BillingStatusResponse = {
  plan: string;
  planLabel: string;
  billingStatus: string;
  billingStatusLabel: string;
  trialEndsAt: string | null;
  trialDaysLeft: number | null;
  accessAllowed: boolean;
  memberCount: number;
  monthlyPriceCents: number;
  hasStripeCustomer: boolean;
  hasActiveSubscription: boolean;
  stripeConfigured: boolean;
  isAdmin: boolean;
};

export default function BillingCard() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"checkout" | "portal" | null>(null);
  const [billing, setBilling] = useState<BillingStatusResponse | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/status");
      const data = (await res.json()) as BillingStatusResponse & { error?: string };
      if (!res.ok) throw new Error(data.error ?? t("settings.billing.loadError"));
      setBilling(data);
    } catch (e) {
      toastError(e instanceof Error ? e.message : t("settings.billing.genericError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("billing") === "success") {
      toastSuccess(t("settings.billing.updated"));
      params.delete("billing");
      const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", next);
      void load();
    }
  }, [load, t]);

  async function startCheckout() {
    setBusy("checkout");
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? t("settings.billing.checkoutError"));
      window.location.href = data.url;
    } catch (e) {
      toastError(e instanceof Error ? e.message : t("settings.billing.checkoutGeneric"));
      setBusy(null);
    }
  }

  async function openPortal() {
    setBusy("portal");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? t("settings.billing.portalError"));
      window.location.href = data.url;
    } catch (e) {
      toastError(e instanceof Error ? e.message : t("settings.billing.portalGeneric"));
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[color:var(--foreground)]/60">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("settings.billing.loading")}
      </div>
    );
  }

  if (!billing) return null;

  const onTrial = billing.plan === "trial";
  const onActive = billing.plan === "active";
  const trialExpired = onTrial && billing.trialDaysLeft !== null && billing.trialDaysLeft <= 0;
  const monthlyLabel = formatMonthlyPriceEur(billing.memberCount);
  const floorEur = String(MONTHLY_FLOOR_EUR);
  const seatEur = String(PRICE_PER_SEAT_EUR);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--foreground)]/50">
              {t("settings.billing.currentPlan")}
            </p>
            <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">{billing.planLabel}</p>
            <p className="mt-0.5 text-sm text-[color:var(--foreground)]/65">{billing.billingStatusLabel}</p>
            {onTrial && billing.trialDaysLeft !== null && (
              <p className="mt-2 text-sm text-[color:var(--foreground)]/70">
                {trialExpired
                  ? t("settings.billing.trialExpired")
                  : t("settings.billing.trialDaysLeft", { days: billing.trialDaysLeft })}
              </p>
            )}
            <p className="mt-2 text-sm text-[color:var(--foreground)]/70">
              {billing.memberCount} collaborateur{billing.memberCount > 1 ? "s" : ""} · {monthlyLabel}/mois
              {billing.memberCount <= FLOOR_INCLUDED_SEATS
                ? ` (plancher ${floorEur} €)`
                : ` (${seatEur} €/pers.)`}
            </p>
            {!billing.accessAllowed && (
              <p className="mt-2 text-sm font-medium text-[var(--danger)]">{t("settings.billing.accessSuspended")}</p>
            )}
          </div>
          {billing.hasStripeCustomer && billing.isAdmin && billing.stripeConfigured && onActive && (
            <button
              type="button"
              onClick={() => void openPortal()}
              disabled={busy !== null}
              className="ui-transition inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[color:var(--foreground)]/80 hover:bg-[var(--surface-soft)] disabled:opacity-50"
            >
              {busy === "portal" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
              {t("settings.billing.manageBilling")}
            </button>
          )}
        </div>
      </div>

      {!billing.stripeConfigured && (
        <p className="text-sm text-[color:var(--foreground)]/60">{t("settings.billing.stripeNotConfigured")}</p>
      )}

      {billing.isAdmin && billing.stripeConfigured && !onActive && (
        <div className="rounded-xl border border-[color-mix(in_srgb,var(--accent)_40%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_6%,var(--surface))] p-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-[color:var(--foreground)]/50" />
            <h3 className="font-semibold text-[var(--foreground)]">Abonnement unique — tout inclus</h3>
          </div>
          <p className="mt-2 text-sm text-[color:var(--foreground)]/65">
            {singlePlanPricingSummary()}. Après l&apos;essai, un abonnement est requis.
          </p>
          <ul className="mt-3 space-y-1.5">
            {SINGLE_PLAN_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-xs text-[color:var(--foreground)]/70">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--brand-primary)]" />
                {feature}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => void startCheckout()}
            disabled={busy !== null}
            className="ui-btn ui-btn-primary mt-4 w-full py-2.5 text-sm disabled:opacity-50"
          >
            {busy === "checkout" ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("settings.billing.redirecting")}
              </span>
            ) : (
              `S'abonner — ${monthlyLabel}/mois`
            )}
          </button>
        </div>
      )}

      {!billing.isAdmin && (
        <p className="text-sm text-[color:var(--foreground)]/60">{t("settings.billing.adminOnly")}</p>
      )}
    </div>
  );
}
