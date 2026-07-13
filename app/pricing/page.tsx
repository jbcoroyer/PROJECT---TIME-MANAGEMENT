import Link from "next/link";
import { AppMark, AppWordmark } from "../../components/AppBrand";
import LegalFooter from "../../components/legal/LegalFooter";
import PricingCard from "../../components/marketing/PricingCard";
import PricingComparisonTable from "../../components/marketing/PricingComparisonTable";
import ScrollReveal from "../../components/marketing/ScrollReveal";
import {
  ENTERPRISE_MARKETING,
  PLAN_MARKETING_FEATURES,
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

      <main className="relative mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="mkt-pricing-hero-glow" aria-hidden />

        <ScrollReveal className="relative text-center">
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

        <div className="relative mt-10 grid items-stretch gap-6 md:grid-cols-3 md:gap-5 lg:gap-6">
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

        <ScrollReveal delay={200} className="relative mt-16 sm:mt-20">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--foreground)]/45">
              Comparatif rapide
            </p>
            <h2 className="ui-display mt-2 text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
              En un coup d&apos;œil
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-[color:var(--foreground)]/55">
              Tout ce qui change entre Gratuit, Starter et Pro — ligne par ligne.
            </p>
          </div>

          <div className="mt-8">
            <PricingComparisonTable />
          </div>

          <p className="mt-4 text-center text-xs text-[color:var(--foreground)]/45">
            * Sur le plan Gratuit, vous choisissez librement 5 modules parmi les 11 disponibles.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={280}>
          <div className="mkt-pricing-footer-cta">
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
