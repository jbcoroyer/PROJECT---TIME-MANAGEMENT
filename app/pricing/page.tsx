import Link from "next/link";
import { AppMark, AppWordmark } from "../../components/AppBrand";
import LegalFooter from "../../components/legal/LegalFooter";
import PricingCard from "../../components/marketing/PricingCard";
import ScrollReveal from "../../components/marketing/ScrollReveal";
import { PLAN_MARKETING_FEATURES, PUBLIC_PLAN_MARKETING, TRIAL_DAYS, type PublicPlan } from "../../lib/billing/plans";
import "../../components/marketing/marketing.css";

export const metadata = {
  title: "Tarifs",
  description:
    "Découvrez nos offres Gratuit, Standard et Pro pour piloter vos projets et votre communication.",
};

const PUBLIC_PLAN_ORDER: PublicPlan[] = ["free", "starter", "pro"];

const COMPARISON_ROWS = [
  { label: "Nombre de membres", free: "1 à 2", standard: "Jusqu'à 5", pro: "Illimité" },
  { label: "Tableau de bord & tâches", free: true, standard: true, pro: true },
  { label: "Planning & boîte à idées", free: true, standard: true, pro: true },
  { label: "Événements & réseaux sociaux", free: false, standard: false, pro: true },
  { label: "Fichiers, stock & objectifs", free: false, standard: false, pro: true },
  { label: "Assistant IA", free: false, standard: false, pro: true },
  { label: "Outlook & Slack", free: false, standard: false, pro: true },
];

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
            Choisissez l&apos;offre qui colle à votre projet
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-[color:var(--foreground)]/65">
            {TRIAL_DAYS} jours pour tout tester — sans carte bancaire. Ensuite, restez gratuit à 2 personnes
            ou passez à Standard / Pro quand l&apos;équipe s&apos;agrandit.
          </p>
        </ScrollReveal>

        <div className="mt-10 grid items-stretch gap-6 md:grid-cols-3">
          {PUBLIC_PLAN_ORDER.map((planId, index) => (
            <ScrollReveal key={planId} delay={index * 100} className="h-full">
              <PricingCard planId={planId} features={PLAN_MARKETING_FEATURES[planId]} />
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={200} className="mt-14">
          <h2 className="text-center text-xl font-bold text-[var(--foreground)]">Comparatif rapide</h2>
          <p className="mt-2 text-center text-sm text-[color:var(--foreground)]/55">
            En un coup d&apos;œil : ce qui change entre Gratuit, Standard et Pro.
          </p>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--line)]">
                  <th className="px-4 py-3 font-semibold text-[color:var(--foreground)]/55">Fonctionnalité</th>
                  <th className="px-4 py-3 font-semibold" style={{ color: "var(--mkt-free)" }}>
                    {PUBLIC_PLAN_MARKETING.free.name}
                  </th>
                  <th className="px-4 py-3 font-semibold" style={{ color: "var(--mkt-standard)" }}>
                    {PUBLIC_PLAN_MARKETING.starter.name}
                  </th>
                  <th className="px-4 py-3 font-semibold" style={{ color: "var(--mkt-pro)" }}>
                    {PUBLIC_PLAN_MARKETING.pro.name}
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-[var(--line)] last:border-0">
                    <td className="px-4 py-3 text-[color:var(--foreground)]/75">{row.label}</td>
                    <td className="px-4 py-3">
                      <ComparisonCell value={row.free} accent="var(--mkt-free)" />
                    </td>
                    <td className="px-4 py-3">
                      <ComparisonCell value={row.standard} accent="var(--mkt-standard)" />
                    </td>
                    <td className="px-4 py-3">
                      <ComparisonCell value={row.pro} accent="var(--mkt-pro)" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={280}>
          <div className="mt-10 rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-6 text-center">
            <p className="text-sm text-[color:var(--foreground)]/65">
              Les prix des plans payants s&apos;affichent au moment du paiement Stripe. Facturation mensuelle,
              résiliation à tout moment. Le plan Gratuit reste accessible sans limite de durée pour 1 à 2
              personnes.
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
    return <span className="font-medium" style={{ color: accent }}>{value}</span>;
  }
  return value ? (
    <span className="font-semibold" style={{ color: accent }}>
      ✓
    </span>
  ) : (
    <span className="text-[color:var(--foreground)]/25">—</span>
  );
}
