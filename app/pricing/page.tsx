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
    <div className="mkt-page relative min-h-screen overflow-hidden bg-[var(--background)]">
      <header className="relative z-10 border-b border-[var(--line)]">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-6 px-6 py-5 sm:px-10">
          <Link href="/" className="flex items-center gap-3">
            <AppMark className="h-[34px] w-[34px]" />
            <AppWordmark size="compact" />
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/login" className="mkt-link-underline text-sm font-semibold">
              Connexion
            </Link>
            <Link href="/signup" className="mkt-cta-primary px-[22px] py-[11px] text-sm">
              Essai gratuit <span className="font-[family-name:var(--font-mono)]">→</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-[5] mx-auto max-w-[1280px] px-6 py-[90px] pb-[100px] sm:px-10">
        <div className="max-w-[760px]">
          <div className="flex items-center gap-3.5">
            <span className="ui-kicker text-[12px] tracking-[0.18em]">N°01 — Tarifs transparents</span>
            <span className="h-px max-w-[200px] flex-1 bg-[rgba(26,22,17,0.25)]" aria-hidden />
          </div>
          <h1 className="ui-display mt-[30px] text-[clamp(2.8rem,5.6vw,4.6rem)] leading-[1.02] tracking-[-0.02em] text-[var(--ink)]">
            L&apos;offre qui colle
            <br />à <em className="text-[var(--accent)] italic">votre projet</em>
          </h1>
          <p className="mt-6 max-w-[560px] text-lg leading-relaxed text-[var(--ink-muted)]">
            {TRIAL_DAYS} jours pour tout tester — sans carte bancaire. Ensuite, restez gratuit à 2 personnes
            ou passez à Starter / Pro quand l&apos;équipe s&apos;agrandit.
          </p>
        </div>

        <div className="mt-16 grid items-stretch gap-6 md:grid-cols-3">
          {PUBLIC_PLAN_ORDER.map((planId, index) => (
            <ScrollReveal key={planId} delay={index * 100} className="h-full">
              <PricingCard planId={planId} features={PLAN_MARKETING_FEATURES[planId]} />
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={160} className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-5 rounded-[22px] border border-dashed border-[rgba(26,22,17,0.22)] bg-[var(--surface)] px-7 py-6">
            <div>
              <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[rgba(26,22,17,0.45)]">
                {ENTERPRISE_MARKETING.name}
              </p>
              <h2 className="ui-display mt-1 text-xl text-[var(--ink)]">{ENTERPRISE_MARKETING.tagline}</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--ink-muted)]">
                {ENTERPRISE_MARKETING.description}
              </p>
            </div>
            <a
              href={`mailto:${ENTERPRISE_MARKETING.contactEmail}?subject=Offre%20Entreprise%20WorkSpace`}
              className="mkt-cta-primary shrink-0 px-6 py-2.5 text-sm"
            >
              {ENTERPRISE_MARKETING.ctaLabel}
            </a>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={200} className="mt-[90px]">
          <div className="flex flex-wrap items-baseline justify-between gap-6">
            <h2 className="ui-display text-[clamp(1.9rem,3.4vw,2.6rem)] tracking-[-0.015em] text-[var(--ink)]">
              Comparatif <em className="text-[var(--accent)] italic">en un coup d&apos;œil</em>
            </h2>
            <p className="text-[15px] text-[var(--ink-muted)]">
              Ce qui change entre Gratuit, Starter et Pro.
            </p>
          </div>
          <PricingComparisonTable />
          <p className="mt-4 text-xs text-[rgba(26,22,17,0.45)]">
            * Sur le plan Gratuit, vous choisissez librement 5 modules parmi les 11 disponibles.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={280}>
          <div className="relative mt-[70px] flex flex-wrap items-center justify-between gap-8 overflow-hidden rounded-[26px] bg-[var(--ink)] px-12 py-14">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 0.95 0 0 0 0 0.85 0 0 0 0.06 0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E\")",
              }}
            />
            <div className="relative max-w-[560px]">
              <h2 className="ui-display text-[clamp(1.7rem,3vw,2.4rem)] leading-[1.1] tracking-[-0.015em] text-[var(--background)]">
                Facturation mensuelle, résiliation{" "}
                <em className="text-[var(--accent-on-dark)] italic">à tout moment</em>.
              </h2>
              <p className="mt-3.5 text-[15px] text-[rgba(246,241,231,0.6)]">
                Le plan Gratuit reste accessible sans limite de durée pour 1 à 2 personnes.
              </p>
            </div>
            <Link
              href="/signup"
              className="relative mkt-cta-band inline-flex items-center gap-2.5 rounded-[100px] bg-[var(--background)] px-8 py-[17px] text-[15.5px] font-semibold text-[var(--ink)]"
            >
              Commencer — {TRIAL_DAYS} jours offerts{" "}
              <span className="font-[family-name:var(--font-mono)]">→</span>
            </Link>
          </div>
        </ScrollReveal>
      </main>

      <div className="relative z-[5] border-t border-[var(--line)] px-6 py-9 sm:px-10">
        <LegalFooter />
      </div>
    </div>
  );
}
