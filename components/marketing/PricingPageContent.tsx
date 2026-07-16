"use client";

import Link from "next/link";
import { useState } from "react";
import { AppMark, AppWordmark } from "../../components/AppBrand";
import LegalFooter from "../../components/legal/LegalFooter";
import ScrollReveal from "../../components/marketing/ScrollReveal";
import {
  FLOOR_INCLUDED_SEATS,
  MONTHLY_FLOOR_EUR,
  PRICE_PER_SEAT_EUR,
  SINGLE_PLAN_FEATURES,
  TRIAL_DAYS,
  calculateMonthlyPriceCents,
  formatMonthlyPriceEur,
  singlePlanPricingSummary,
} from "../../lib/billing/plans";
import { useTranslation } from "../../lib/i18n/useTranslation";
import "../../components/marketing/marketing.css";

const EXAMPLE_SIZES = [1, 5, 6, 12] as const;

const INCLUDED_VALUE = [
  {
    title: "Pilotage & projets",
    body: "Kanban multi-vues, charge équipe, archives et rétroplanning Gantt pour livrer à temps.",
  },
  {
    title: "Demandes & agenda",
    body: "Formulaire client public, triage vers tâches, agenda avec réservation de créneaux.",
  },
  {
    title: "Production com'",
    body: "Événements (régie, budget, RETEX), calendrier social avec validation, DAM et stock PLV.",
  },
  {
    title: "Feedback & stratégie",
    body: "Boîte à idées, enquêtes multi-étapes, OKR d’équipe — du signal au suivi.",
  },
  {
    title: "IA & intégrations",
    body: "Assistant IA pour reformuler et recycler, sync Outlook 365, alertes Slack / Teams.",
  },
  {
    title: "Votre espace",
    body: "Logo, couleurs, modules activables, invitations illimitées — la facture suit les sièges actifs.",
  },
] as const;

const FAQ_ITEMS = [
  {
    q: "Y a-t-il plusieurs formules ?",
    a: "Non. Un seul abonnement : tous les modules et intégrations sont inclus. Vous payez uniquement au nombre d’utilisateurs.",
  },
  {
    q: "Que se passe-t-il pendant l’essai ?",
    a: `Pendant ${TRIAL_DAYS} jours, vous avez accès à toute la plateforme sans carte bancaire. Ensuite, un abonnement actif est requis pour continuer.`,
  },
  {
    q: "Comment évolue la facture si j’ajoute quelqu’un ?",
    a: `Jusqu’à ${FLOOR_INCLUDED_SEATS} personnes, vous restez au plancher de ${MONTHLY_FLOOR_EUR} €/mois. Au-delà, chaque siège supplémentaire coûte ${PRICE_PER_SEAT_EUR} €/mois.`,
  },
  {
    q: "Les modules sont-ils facturés séparément ?",
    a: "Non. Kanban, demandes, planning, events, social, stock, DAM, idées, OKR, enquêtes et agenda sont dans le même prix.",
  },
] as const;

export default function PricingPageContent() {
  const { t } = useTranslation({ preferBrowser: true });
  const [simulatorSeats, setSimulatorSeats] = useState(8);
  const simulatedPrice = formatMonthlyPriceEur(simulatorSeats);

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
              {t("marketingPricing.page.login")}
            </Link>
            <Link href="/signup" className="mkt-cta-primary px-[22px] py-[11px] text-sm">
              {t("marketingPricing.page.freeTrial")}{" "}
              <span className="font-[family-name:var(--font-mono)]">→</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-[5] mx-auto max-w-[1280px] px-6 py-[90px] pb-[100px] sm:px-10">
        <div className="max-w-[760px]">
          <div className="flex items-center gap-3.5">
            <span className="ui-kicker text-[12px] tracking-[0.18em]">{t("marketingPricing.page.kicker")}</span>
            <span className="h-px max-w-[200px] flex-1 bg-[rgba(26,22,17,0.25)]" aria-hidden />
          </div>
          <h1 className="ui-display mt-[30px] text-[clamp(2.8rem,5.6vw,4.6rem)] leading-[1.02] tracking-[-0.02em] text-[var(--ink)]">
            Un seul prix,
            <br />
            <em className="text-[var(--accent)] italic">tout inclus</em>
          </h1>
          <p className="mt-6 max-w-[560px] text-lg leading-relaxed text-[var(--ink-muted)]">
            {singlePlanPricingSummary()}. Essai gratuit de {TRIAL_DAYS} jours, sans carte bancaire.
            Après l&apos;essai, un abonnement actif est requis.
          </p>
        </div>

        <ScrollReveal className="mt-16">
          <article className="mkt-pricing-card mkt-pricing-card--featured mkt-card-hover max-w-xl">
            <span className="mkt-pricing-card__badge">✦ Tout inclus</span>
            <span className="mkt-pricing-card__kicker">Offre unique</span>
            <p className="mkt-pricing-card__price">
              {PRICE_PER_SEAT_EUR} €
              <span className="mkt-pricing-card__price-suffix">/utilisateur/mois</span>
            </p>
            <h2 className="mkt-pricing-card__name">Abonnement WorkSpace</h2>
            <p className="mkt-pricing-card__desc">
              Tous les modules, toutes les intégrations, sans palier caché. Le minimum de{" "}
              {MONTHLY_FLOOR_EUR} €/mois couvre jusqu&apos;à {FLOOR_INCLUDED_SEATS} collaborateurs.
            </p>
            <ul className="mkt-pricing-card__features">
              {SINGLE_PLAN_FEATURES.map((feature) => (
                <li key={feature} className="mkt-pricing-card__feature">
                  <span className="mkt-pricing-card__star" aria-hidden>
                    ✦
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Link href="/signup" className="mkt-pricing-card__cta mkt-pricing-card__cta--filled">
              Essayer {TRIAL_DAYS} jours gratuits <span className="font-[family-name:var(--font-mono)]">→</span>
            </Link>
          </article>
        </ScrollReveal>

        <ScrollReveal delay={40} className="mt-16 max-w-3xl">
          <h2 className="ui-display text-[clamp(1.6rem,2.5vw,2rem)] text-[var(--ink)]">
            Ce que vous débloquez
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-muted)]">
            Un abonnement = toute la plateforme. Pas de modules payants séparément, pas de plafond
            artificiel sur les fonctionnalités.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-0 border-t border-[rgba(26,22,17,0.18)] sm:grid-cols-2">
            {INCLUDED_VALUE.map((item, index) => (
              <div
                key={item.title}
                className={[
                  "border-b border-[rgba(26,22,17,0.12)] py-6 sm:px-5",
                  index % 2 === 0 ? "sm:border-r sm:border-[rgba(26,22,17,0.12)] sm:pl-0" : "",
                ].join(" ")}
              >
                <h3 className="ui-display text-lg text-[var(--ink)]">{item.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[rgba(26,22,17,0.65)]">{item.body}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={80} className="mt-12 max-w-3xl">
          <h2 className="ui-display text-xl text-[var(--ink)]">Comment ça se calcule</h2>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Facturation = max({MONTHLY_FLOOR_EUR}&nbsp;€, nombre d&apos;utilisateurs × {PRICE_PER_SEAT_EUR}
            &nbsp;€). La quantité Stripe suit le nombre de membres actifs.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {EXAMPLE_SIZES.map((seats) => {
              const price = formatMonthlyPriceEur(seats);
              const atFloor = seats <= FLOOR_INCLUDED_SEATS;
              return (
                <div
                  key={seats}
                  className="rounded-[18px] border border-[rgba(26,22,17,0.15)] bg-[var(--surface)] px-4 py-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-[rgba(26,22,17,0.45)]">
                    {seats} pers.
                  </p>
                  <p className="ui-display mt-2 text-2xl text-[var(--ink)]">{price}</p>
                  <p className="mt-1 text-xs text-[rgba(26,22,17,0.5)]">
                    {atFloor ? `plancher ${MONTHLY_FLOOR_EUR} €` : `${seats} × ${PRICE_PER_SEAT_EUR} €`}
                  </p>
                </div>
              );
            })}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={120} className="mt-12 max-w-xl">
          <div className="rounded-[22px] border border-[rgba(26,22,17,0.2)] bg-[var(--surface)] px-7 py-6">
            <h2 className="ui-display text-xl text-[var(--ink)]">Simulateur</h2>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">
              Ajustez le nombre de collaborateurs pour estimer votre facture mensuelle.
            </p>
            <label className="mt-5 block text-sm font-semibold text-[var(--ink)]" htmlFor="pricing-simulator">
              Nombre de personnes
            </label>
            <input
              id="pricing-simulator"
              type="range"
              min={1}
              max={50}
              value={simulatorSeats}
              onChange={(e) => setSimulatorSeats(Number(e.target.value))}
              className="mt-2 w-full"
            />
            <p className="mt-4 text-lg font-semibold text-[var(--ink)]">
              Vous êtes {simulatorSeats} personne{simulatorSeats > 1 ? "s" : ""} ? Vous payez{" "}
              <strong>{simulatedPrice}</strong>/mois
            </p>
            <p className="mt-1 text-xs text-[rgba(26,22,17,0.5)]">
              Calcul : max({MONTHLY_FLOOR_EUR} €, {simulatorSeats} × {PRICE_PER_SEAT_EUR} €) ={" "}
              {(calculateMonthlyPriceCents(simulatorSeats) / 100).toFixed(0)} €
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={160} className="mt-16 max-w-3xl">
          <h2 className="ui-display text-xl text-[var(--ink)]">Questions fréquentes</h2>
          <div className="mt-6 border-t border-[rgba(26,22,17,0.18)]">
            {FAQ_ITEMS.map((item) => (
              <div key={item.q} className="border-b border-[rgba(26,22,17,0.12)] py-5">
                <h3 className="text-[15px] font-semibold text-[var(--ink)]">{item.q}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-[rgba(26,22,17,0.65)]">{item.a}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="relative mt-[70px] flex flex-wrap items-center justify-between gap-8 overflow-hidden rounded-[26px] bg-[var(--ink)] px-12 py-14">
            <div className="relative max-w-[560px]">
              <h2 className="ui-display text-[clamp(1.7rem,3vw,2.4rem)] leading-[1.1] tracking-[-0.015em] text-[var(--background)]">
                Prêt à centraliser votre équipe ?
              </h2>
              <p className="mt-3.5 text-[15px] text-[rgba(246,241,231,0.6)]">
                {TRIAL_DAYS} jours pour tout tester. Aucune carte requise. Ensuite :{" "}
                {PRICE_PER_SEAT_EUR}&nbsp;€/utilisateur/mois (min. {MONTHLY_FLOOR_EUR}&nbsp;€).
              </p>
            </div>
            <Link
              href="/signup"
              className="relative mkt-cta-band inline-flex items-center gap-2.5 rounded-[100px] bg-[var(--background)] px-8 py-[17px] text-[15.5px] font-semibold text-[var(--ink)]"
            >
              Commencer l&apos;essai gratuit{" "}
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
