"use client";

import { useRouter } from "next/navigation";
import { Clock, CreditCard, LogOut, ShieldAlert } from "lucide-react";
import BillingCard from "../settings/BillingCard";
import { AppMark } from "../AppBrand";
import { useBranding } from "../../lib/brandingContext";
import { getSupabaseBrowser } from "../../lib/supabaseBrowser";
import type { BillingBlockReason } from "../../lib/billing/resolveBillingAccess";

type Props = {
  reason: BillingBlockReason;
  trialDaysLeft: number | null;
};

function reasonCopy(reason: BillingBlockReason): { title: string; body: string } {
  if (reason === "trial_expired") {
    return {
      title: "Votre essai gratuit est terminé",
      body: "Choisissez un abonnement pour retrouver l'accès à votre espace, vos tâches et vos données.",
    };
  }
  if (reason === "subscription_inactive") {
    return {
      title: "Abonnement inactif",
      body: "Votre abonnement est suspendu ou résilié. Réactivez-le pour continuer à utiliser l'application.",
    };
  }
  return {
    title: "Accès suspendu",
    body: "Un abonnement actif est requis pour utiliser cet espace.",
  };
}

export default function BillingRequiredScreen({ reason, trialDaysLeft }: Props) {
  const router = useRouter();
  const { branding } = useBranding();
  const copy = reasonCopy(reason);

  async function signOut() {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AppMark className="h-9 w-9" />
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">{branding.appName}</p>
              <p className="text-xs text-[color:var(--foreground)]/55">Facturation</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="ui-transition inline-flex items-center gap-2 rounded-xl border border-[var(--line)] px-3 py-2 text-sm font-medium text-[color:var(--foreground)]/70 hover:bg-[var(--surface-soft)]"
          >
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </button>
        </header>

        <div className="ui-surface overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--danger)_25%,var(--line))]">
          <div className="border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--danger)_6%,var(--surface))] px-5 py-5 sm:px-6">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--danger)_12%,var(--surface))]">
                {reason === "trial_expired" ? (
                  <Clock className="h-5 w-5 text-[var(--danger)]" />
                ) : (
                  <ShieldAlert className="h-5 w-5 text-[var(--danger)]" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[var(--foreground)] sm:text-2xl">{copy.title}</h1>
                <p className="mt-2 text-sm leading-relaxed text-[color:var(--foreground)]/70">{copy.body}</p>
                {reason === "trial_expired" && trialDaysLeft === 0 && (
                  <p className="mt-2 text-xs font-medium uppercase tracking-wide text-[color:var(--foreground)]/50">
                    Essai expiré
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 px-5 py-5 sm:px-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--foreground)]/80">
              <CreditCard className="h-4 w-4" />
              Choisir un abonnement
            </div>
            <BillingCard />
          </div>
        </div>

        <p className="text-center text-xs text-[color:var(--foreground)]/50">
          Vos données sont conservées. L&apos;accès est rétabli dès qu&apos;un abonnement est actif.
        </p>
      </div>
    </div>
  );
}
