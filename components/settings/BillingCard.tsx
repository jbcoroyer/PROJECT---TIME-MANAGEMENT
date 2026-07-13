"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, ExternalLink, Loader2, Check } from "lucide-react";
import { PLAN_MARKETING_FEATURES, PUBLIC_PLAN_MARKETING } from "../../lib/billing/plans";
import { toastError, toastSuccess } from "../../lib/toast";

type BillingStatusResponse = {
  plan: string;
  planLabel: string;
  billingStatus: string;
  billingStatusLabel: string;
  trialEndsAt: string | null;
  trialDaysLeft: number | null;
  accessAllowed: boolean;
  hasStripeCustomer: boolean;
  hasActiveSubscription: boolean;
  stripeConfigured: boolean;
  isAdmin: boolean;
};

export default function BillingCard() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"starter" | "pro" | "portal" | null>(null);
  const [billing, setBilling] = useState<BillingStatusResponse | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/status");
      const data = (await res.json()) as BillingStatusResponse & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Impossible de charger la facturation.");
      setBilling(data);
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Erreur facturation");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("billing") === "success") {
      toastSuccess("Abonnement mis à jour.");
      params.delete("billing");
      const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", next);
      void load();
    }
  }, [load]);

  async function startCheckout(plan: "starter" | "pro") {
    setBusy(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Checkout indisponible.");
      window.location.href = data.url;
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Erreur checkout");
      setBusy(null);
    }
  }

  async function openPortal() {
    setBusy("portal");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Portail indisponible.");
      window.location.href = data.url;
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Erreur portail");
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[color:var(--foreground)]/60">
        <Loader2 className="h-4 w-4 animate-spin" />
        Chargement de la facturation…
      </div>
    );
  }

  if (!billing) return null;

  const onTrial = billing.plan === "trial";
  const onFree = billing.plan === "free";
  const trialExpired = onTrial && billing.trialDaysLeft !== null && billing.trialDaysLeft <= 0;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--foreground)]/50">
              Plan actuel
            </p>
            <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">{billing.planLabel}</p>
            <p className="mt-0.5 text-sm text-[color:var(--foreground)]/65">{billing.billingStatusLabel}</p>
            {onTrial && billing.trialDaysLeft !== null && (
              <p className="mt-2 text-sm text-[color:var(--foreground)]/70">
                {trialExpired
                  ? "Votre essai gratuit est terminé — vous êtes passé au plan Gratuit (1 à 2 utilisateurs)."
                  : `${billing.trialDaysLeft} jour(s) restant(s) dans l'essai.`}
              </p>
            )}
            {onFree && (
              <p className="mt-2 text-sm text-[color:var(--foreground)]/70">
                Plan Gratuit — jusqu&apos;à 2 utilisateurs, 5 modules au choix.
              </p>
            )}
            {!billing.accessAllowed && (
              <p className="mt-2 text-sm font-medium text-[var(--danger)]">
                L&apos;accès à l&apos;espace est suspendu — choisissez un abonnement pour continuer.
              </p>
            )}
          </div>
          {billing.hasStripeCustomer && billing.isAdmin && billing.stripeConfigured && (
            <button
              type="button"
              onClick={() => void openPortal()}
              disabled={busy !== null}
              className="ui-transition inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[color:var(--foreground)]/80 hover:bg-[var(--surface-soft)] disabled:opacity-50"
            >
              {busy === "portal" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
              Gérer la facturation
            </button>
          )}
        </div>
      </div>

      {!billing.stripeConfigured && (
        <p className="text-sm text-[color:var(--foreground)]/60">
          Stripe n&apos;est pas encore configuré sur ce déploiement (variables d&apos;environnement manquantes).
        </p>
      )}

      {billing.isAdmin && billing.stripeConfigured && (onTrial || onFree || trialExpired || billing.plan !== "pro") && (
        <div className="grid gap-3 sm:grid-cols-2">
          <PlanOffer
            name={PUBLIC_PLAN_MARKETING.starter.name}
            description={PUBLIC_PLAN_MARKETING.starter.description}
            features={PLAN_MARKETING_FEATURES.starter}
            busy={busy === "starter"}
            disabled={busy !== null || billing.plan === "starter"}
            onSelect={() => void startCheckout("starter")}
          />
          <PlanOffer
            name={PUBLIC_PLAN_MARKETING.pro.name}
            description={PUBLIC_PLAN_MARKETING.pro.description}
            features={PLAN_MARKETING_FEATURES.pro}
            highlighted
            busy={busy === "pro"}
            disabled={busy !== null || billing.plan === "pro"}
            onSelect={() => void startCheckout("pro")}
          />
        </div>
      )}

      {!billing.isAdmin && (
        <p className="text-sm text-[color:var(--foreground)]/60">
          Seul un administrateur peut modifier l&apos;abonnement.
        </p>
      )}
    </div>
  );
}

function PlanOffer(props: {
  name: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  busy: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={[
        "rounded-xl border p-4",
        props.highlighted
          ? "border-[color-mix(in_srgb,var(--accent)_40%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_6%,var(--surface))]"
          : "border-[var(--line)] bg-[var(--surface)]",
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-[color:var(--foreground)]/50" />
        <h3 className="font-semibold text-[var(--foreground)]">{props.name}</h3>
      </div>
      <p className="mt-2 text-sm text-[color:var(--foreground)]/65">{props.description}</p>
      <ul className="mt-3 space-y-1.5">
        {props.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-xs text-[color:var(--foreground)]/70">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--brand-primary)]" />
            {feature}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={props.onSelect}
        disabled={props.disabled}
        className="ui-btn ui-btn-primary mt-4 w-full py-2.5 text-sm disabled:opacity-50"
      >
        {props.busy ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Redirection…
          </span>
        ) : (
          `Choisir ${props.name}`
        )}
      </button>
    </div>
  );
}
