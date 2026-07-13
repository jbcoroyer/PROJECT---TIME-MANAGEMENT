import Link from "next/link";
import { AppMark, AppWordmark } from "../../components/AppBrand";
import LegalFooter from "../../components/legal/LegalFooter";
import PricingCard from "../../components/marketing/PricingCard";
import ScrollReveal from "../../components/marketing/ScrollReveal";
import {
  ENTERPRISE_MARKETING,
  PLAN_COMPARISON_ROWS,
  PLAN_MARKETING_FEATURES,
  PUBLIC_PLAN_MARKETING,
  TRIAL_DAYS,
  type PublicPlan,
} from "../../lib/billing/plans";
import "../../components/marketing/marketing.css";

export const metadata = {
  title: "Tarifs",
  description:
    "Découvrez nos offres Gratuit, Starter et Pro pour piloter vos projets et votre communication.",
};

const PUBLIC_PLAN_ORDER: PublicPlan[] = ["free", "starter", "pro"];

export default function PricingPage() {
  return (
    <div className="mkt-page min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--line)] bg-[var(--surface)]/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <AppMark className="h-8 w-8" />
            <AppWordmark size="compact" />
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/login" className="text-[color:var(--foreground)]/60 hover:text-[var(--foreground)]">
              Connexion
            </Link>
            <Link href="/signup" className="mkt-cta-primary px-3 py-1.5 text-sm">
              Essai gratuit
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <ScrollReveal className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--foreground)]/45">
            Tarifs transparents
          </p>
          <h1 className="ui-display mt-3 text-3xl font-bold text-[var(--foreground)] sm:text-4xl">
            Grandissez sans changer d&apos;outil
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-[color:var(--foreground)]/65">
            {TRIAL_DAYS} jours pour tout tester — sans carte bancaire. Commencez avec 5 modules gratuits,
            débloquez les 11 avec le Starter, et passez au Pro quand l&apos;équipe dépasse 5 personnes.
          </p>
        </ScrollReveal>

        <div className="mt-10 grid items-stretch gap-6 md:grid-cols-3">
          {PUBLIC_PLAN_ORDER.map((planId, index) => (
            <ScrollReveal key={planId} delay={index * 100} className="h-full">
              <PricingCard planId={planId} features={PLAN_MARKETING_FEATURES[planId]} />
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={160} className="mt-8">
          <div className="mkt-enterprise-banner">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--foreground)]/45">
                {ENTERPRISE_MARKETING.name}
              </p>
              <h2 className="ui-display mt-1 text-xl font-bold text-[var(--foreground)]">
                {ENTERPRISE_MARKETING.tagline}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-[color:var(--foreground)]/65">
                {ENTERPRISE_MARKETING.description}
              </p>
            </div>
            <a
              href={`mailto:${ENTERPRISE_MARKETING.contactEmail}?subject=Offre%20Entreprise%20Recueil`}
              className="mkt-cta-primary shrink-0 px-6 py-2.5 text-sm"
            >
              {ENTERPRISE_MARKETING.ctaLabel}
            </a>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={200} className="mt-14">
          <h2 className="text-center text-xl font-bold text-[var(--foreground)]">Comparatif détaillé</h2>
          <p className="mt-2 text-center text-sm text-[color:var(--foreground)]/55">
            Tout ce qui change entre Gratuit, Starter et Pro — ligne par ligne.
          </p>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[var(--surface-soft)]/60">
                  <th className="px-4 py-3.5 font-semibold text-[color:var(--foreground)]/55">Fonctionnalité</th>
                  <th className="px-4 py-3.5 font-semibold" style={{ color: "var(--mkt-free, #6b8f71)" }}>
                    {PUBLIC_PLAN_MARKETING.free.name}
                  </th>
                  <th className="px-4 py-3.5 font-semibold" style={{ color: "var(--mkt-standard, var(--accent))" }}>
                    {PUBLIC_PLAN_MARKETING.starter.name}
                  </th>
                  <th className="px-4 py-3.5 font-semibold" style={{ color: "var(--mkt-pro, var(--ink))" }}>
                    {PUBLIC_PLAN_MARKETING.pro.name}
                  </th>
                </tr>
              </thead>
              <tbody>
                {PLAN_COMPARISON_ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-[var(--line)] last:border-0">
                    <td className="px-4 py-3 text-[color:var(--foreground)]/75">{row.label}</td>
                    <td className="px-4 py-3">
                      <ComparisonCell value={row.free} accent="var(--mkt-free, #6b8f71)" />
                    </td>
                    <td className="px-4 py-3">
                      <ComparisonCell value={row.starter} accent="var(--mkt-standard, var(--accent))" />
                    </td>
                    <td className="px-4 py-3">
                      <ComparisonCell value={row.pro} accent="var(--mkt-pro, var(--ink))" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-center text-xs text-[color:var(--foreground)]/45">
            * Sur le plan Gratuit, vous choisissez librement 5 modules parmi les 11 disponibles.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={280}>
          <div className="mt-10 rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-6 text-center">
            <p className="text-sm text-[color:var(--foreground)]/65">
              Facturation mensuelle via Stripe, résiliation à tout moment. Le plan Gratuit reste accessible sans
              limite de durée — 5 modules et 2 personnes maximum.
            </p>
            <Link href="/signup" className="mkt-cta-primary mt-5 inline-flex px-6 py-2.5 text-sm">
              Commencer — {TRIAL_DAYS} jours offerts
            </Link>
          </div>
        </ScrollReveal>
      </main>

      <div className="mx-auto max-w-5xl px-4 pb-10">
        <LegalFooter />
      </div>
    </div>
  );
}

function ComparisonCell({ value, accent }: { value: boolean | string; accent: string }) {
  if (typeof value === "string") {
    return (
      <span className="font-medium" style={{ color: accent }}>
        {value}
      </span>
    );
  }
  return value ? (
    <span className="font-semibold" style={{ color: accent }} aria-label="Inclus">
      ✓
    </span>
  ) : (
    <span className="text-[color:var(--foreground)]/25" aria-label="Non inclus">
      —
    </span>
  );
}
