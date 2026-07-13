"use client";

import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function UpgradeProBanner() {
  const searchParams = useSearchParams();
  const upgrade = searchParams.get("upgrade");
  const show = upgrade === "pro" || upgrade === "starter";

  if (!show) return null;

  const isStarter = upgrade === "starter";

  return (
    <div className="relative rounded-2xl border border-[color-mix(in_srgb,var(--accent)_35%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_8%,var(--surface))] px-4 py-4 sm:px-5">
      <div className="flex items-start gap-3 pr-8">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" />
        <div>
          <p className="font-semibold text-[var(--foreground)]">
            {isStarter ? "Passez au plan Starter" : "Ce module nécessite le plan Pro"}
          </p>
          <p className="mt-1 text-sm text-[color:var(--foreground)]/65">
            {isStarter
              ? "Le plan Gratuit permet 5 modules maximum. Débloquez les 11 modules avec le Starter (2 à 5 collaborateurs)."
              : "Passez au plan Pro pour l'assistant IA, Outlook, les alertes Slack et jusqu'à 25 collaborateurs."}
          </p>
          <Link
            href="/pricing"
            className="mt-3 inline-flex text-sm font-semibold text-[var(--brand-primary)] hover:underline"
          >
            {isStarter ? "Voir l'offre Starter →" : "Voir les offres Pro →"}
          </Link>
        </div>
      </div>
      <Link
        href="/settings"
        className="absolute right-3 top-3 rounded-lg p-1 text-[color:var(--foreground)]/40 hover:bg-[var(--surface-soft)]"
        aria-label="Fermer"
      >
        <X className="h-4 w-4" />
      </Link>
    </div>
  );
}
