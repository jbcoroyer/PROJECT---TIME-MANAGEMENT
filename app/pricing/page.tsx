import Link from "next/link";
import { Check, CreditCard } from "lucide-react";
import { AppMark, AppWordmark } from "../../components/AppBrand";
import LegalFooter from "../../components/legal/LegalFooter";
import { PLAN_MARKETING_FEATURES, TRIAL_DAYS, type PublicPlan } from "../../lib/billing/plans";

export const metadata = {
  title: "Tarifs",
  description:
    "Découvrez nos offres Gratuit, Starter et Pro pour piloter vos projets et votre communication.",
};

const PUBLIC_PLANS: { id: PublicPlan; name: string; description: string; highlighted?: boolean }[] = [
  {
    id: "free",
    name: "Gratuit",
    description: "Pour démarrer seul ou à deux, sans engagement.",
  },
  {
    id: "starter",
    name: "Starter",
    description: "Pour un usage solo ou une petite équipe.",
  },
  {
    id: "pro",
    name: "Pro",
    description: "Modules avancés, IA et collaboration étendue.",
    highlighted: true,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
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
            <Link
              href="/signup"
              className="rounded-xl bg-[var(--brand-primary)] px-3 py-1.5 font-semibold text-white hover:opacity-90"
            >
              Essai gratuit
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Tarifs simples et transparents</h1>
          <p className="mt-3 text-[color:var(--foreground)]/65">
            {TRIAL_DAYS} jours d&apos;essai avec toutes les fonctionnalités, puis plan Gratuit (1 à 2
            utilisateurs) sans carte bancaire.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PUBLIC_PLANS.map((plan) => (
            <PricingCard
              key={plan.id}
              name={plan.name}
              description={plan.description}
              features={PLAN_MARKETING_FEATURES[plan.id]}
              highlighted={plan.highlighted}
              ctaHref="/signup"
              ctaLabel={plan.id === "free" ? "Commencer gratuitement" : "Commencer l'essai gratuit"}
            />
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-[color:var(--foreground)]/55">
          Les prix des plans payants sont affichés lors du checkout Stripe. Facturation mensuelle, résiliation à
          tout moment. Le plan Gratuit reste accessible sans limite de durée pour 1 à 2 utilisateurs.
        </p>
      </main>

      <div className="mx-auto max-w-5xl px-4 pb-10">
        <LegalFooter />
      </div>
    </div>
  );
}

function PricingCard(props: {
  name: string;
  description: string;
  features: string[];
  ctaHref: string;
  ctaLabel: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border p-6",
        props.highlighted
          ? "border-[color-mix(in_srgb,var(--accent)_40%,var(--line))] bg-[color-mix(in_srgb,var(--accent)_6%,var(--surface))] shadow-[var(--shadow-2)]"
          : "border-[var(--line)] bg-[var(--surface)]",
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-[color:var(--foreground)]/50" />
        <h2 className="text-xl font-bold text-[var(--foreground)]">{props.name}</h2>
      </div>
      <p className="mt-2 text-sm text-[color:var(--foreground)]/65">{props.description}</p>
      <ul className="mt-6 space-y-2.5">
        {props.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-[color:var(--foreground)]/80">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-primary)]" />
            {feature}
          </li>
        ))}
      </ul>
      <Link
        href={props.ctaHref}
        className={[
          "ui-transition mt-8 flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold",
          props.highlighted
            ? "bg-[var(--accent)] text-white hover:opacity-90"
            : "border border-[var(--line)] bg-[var(--surface-soft)] text-[var(--foreground)] hover:bg-[var(--surface)]",
        ].join(" ")}
      >
        {props.ctaLabel}
      </Link>
    </div>
  );
}
