"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppMark, AppWordmark } from "../../components/AppBrand";
import LegalFooter from "../../components/legal/LegalFooter";
import ScrollReveal from "../../components/marketing/ScrollReveal";
import BillingIntervalToggle from "../billing/BillingIntervalToggle";
import {
  ANNUAL_FLOOR_EUR,
  FLOOR_INCLUDED_SEATS,
  MONTHLY_FLOOR_EUR,
  PRICE_PER_SEAT_ANNUAL_EUR,
  PRICE_PER_SEAT_EUR,
  SINGLE_PLAN_FEATURES,
  TRIAL_DAYS,
  calculatePriceCents,
  formatAnnualMonthlyEquivalentEur,
  formatPriceEurForInterval,
  type BillingInterval,
} from "../../lib/billing/plans";
import { useTranslation } from "../../lib/i18n/useTranslation";
import { getProductIdentity } from "../../lib/config/legal";
import "../../components/marketing/marketing.css";

const EXAMPLE_SIZES = [1, 5, 6, 12] as const;

export default function PricingPageContent() {
  const { t } = useTranslation({ preferBrowser: true });
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [simulatorSeats, setSimulatorSeats] = useState(8);

  const p = useMemo(
    () => ({
      seat: PRICE_PER_SEAT_EUR,
      annualSeat: PRICE_PER_SEAT_ANNUAL_EUR,
      floor: MONTHLY_FLOOR_EUR,
      annualFloor: ANNUAL_FLOOR_EUR,
      seats: FLOOR_INCLUDED_SEATS,
      days: TRIAL_DAYS,
    }),
    [],
  );

  const simulatedPrice = formatPriceEurForInterval(simulatorSeats, interval);
  const simulatedEquiv = formatAnnualMonthlyEquivalentEur(simulatorSeats);
  const faqItems = [
    { q: t("marketingPricing.page.faq.q1"), a: t("marketingPricing.page.faq.a1", p) },
    { q: t("marketingPricing.page.faq.q2"), a: t("marketingPricing.page.faq.a2", p) },
    { q: t("marketingPricing.page.faq.q3"), a: t("marketingPricing.page.faq.a3", p) },
    { q: t("marketingPricing.page.faq.q4"), a: t("marketingPricing.page.faq.a4") },
    { q: t("marketingPricing.page.faq.q5"), a: t("marketingPricing.page.faq.a5") },
  ];

  const priceInsights =
    interval === "year"
      ? [
          { value: `${p.annualSeat}€`, label: t("marketingPricing.page.perUserYear"), accent: true },
          { value: `${p.annualFloor}€`, label: t("marketingPricing.page.floorMonthly", { seats: p.seats }), accent: false },
          { value: `−2`, label: t("pricing.annualSavingsBadge"), accent: false },
        ]
      : [
          { value: `${p.seat}€`, label: t("marketingPricing.page.perUserMonth"), accent: true },
          { value: `${p.floor}€`, label: t("marketingPricing.page.floorMonthly", { seats: p.seats }), accent: false },
          { value: `${p.days}j`, label: t("marketingPricing.page.trialDays"), accent: false },
        ];

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
        <div className="mx-auto max-w-[820px] text-center">
          <div className="flex items-center justify-center gap-3.5">
            <span className="h-px max-w-[80px] flex-1 bg-[rgba(26,22,17,0.25)]" aria-hidden />
            <span className="ui-kicker text-[12px] tracking-[0.18em]">{t("marketingPricing.page.kicker")}</span>
            <span className="h-px max-w-[80px] flex-1 bg-[rgba(26,22,17,0.25)]" aria-hidden />
          </div>
          <h1 className="ui-display mt-[30px] text-[clamp(2.8rem,5.6vw,4.6rem)] leading-[1.02] tracking-[-0.02em] text-[var(--ink)]">
            {t("marketingPricing.page.title1")}
            <br />
            <em className="text-[var(--accent)] italic">{t("marketingPricing.page.titleEmphasis")}</em>
          </h1>
          <p className="mx-auto mt-6 max-w-[620px] text-lg leading-relaxed text-[var(--ink-muted)]">
            {t("marketingPricing.page.intro", {
              seatPrice: p.seat,
              annualSeatPrice: p.annualSeat,
              floor: p.floor,
              annualFloor: p.annualFloor,
              seats: p.seats,
              days: p.days,
            })}
          </p>
          <div className="mt-8 flex justify-center">
            <BillingIntervalToggle value={interval} onChange={setInterval} />
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 border-y border-[var(--line)] sm:grid-cols-3">
          {priceInsights.map((stat, i) => (
            <div
              key={stat.label}
              className={[
                "px-4 py-8 text-center",
                i < 2 ? "sm:border-r sm:border-[rgba(26,22,17,0.1)]" : "",
              ].join(" ")}
            >
              <p
                className={[
                  "ui-display text-[48px] leading-none",
                  stat.accent ? "text-[var(--accent)]" : "text-[var(--ink)]",
                ].join(" ")}
              >
                {stat.value}
              </p>
              <p className="mt-2 font-[family-name:var(--font-mono)] text-[11.5px] uppercase tracking-[0.12em] text-[rgba(26,22,17,0.55)]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <ScrollReveal className="mt-16">
          <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
            <article className="mkt-pricing-card mkt-pricing-card--featured mkt-card-hover h-full max-w-none">
              <span className="mkt-pricing-card__badge">✦ {t("marketingPricing.page.allIncluded")}</span>
              <span className="mkt-pricing-card__kicker">{t("marketingPricing.page.uniqueOffer")}</span>
              <p className="mkt-pricing-card__price">
                {interval === "year" ? p.annualSeat : p.seat} €
                <span className="mkt-pricing-card__price-suffix">
                  {interval === "year"
                    ? t("marketingPricing.page.perUserYear")
                    : t("marketingPricing.page.perUserMonth")}
                </span>
              </p>
              <h2 className="mkt-pricing-card__name">
                {t("marketingPricing.page.planName", { product: getProductIdentity().productName })}
              </h2>
              <p className="mkt-pricing-card__desc">
                {t("marketingPricing.page.planDesc", {
                  floor: p.floor,
                  annualFloor: p.annualFloor,
                  seats: p.seats,
                })}
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
                {t("marketingPricing.page.tryTrial", { days: p.days })}{" "}
                <span className="font-[family-name:var(--font-mono)]">→</span>
              </Link>
            </article>

            <div className="flex flex-col justify-between gap-6 rounded-[22px] border border-[rgba(26,22,17,0.18)] bg-[var(--surface)] p-8 sm:p-10">
              <div>
                <p className="ui-kicker text-[12px] tracking-[0.18em]">{t("marketingPricing.page.summary")}</p>
                <h2 className="ui-display mt-4 text-[clamp(1.7rem,2.8vw,2.2rem)] text-[var(--ink)]">
                  {t("marketingPricing.page.clearTitle")}
                  <br />
                  <em className="text-[var(--accent)] italic">{t("marketingPricing.page.clearEmphasis")}</em>
                </h2>
                <p className="mt-4 text-[15px] leading-relaxed text-[var(--ink-muted)]">
                  {t("marketingPricing.page.clearBody")}
                </p>
              </div>
              <div className="border-t border-[rgba(26,22,17,0.12)] pt-6">
                <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[rgba(26,22,17,0.45)]">
                  {t("marketingPricing.page.summary")}
                </p>
                <p className="ui-display mt-3 text-[1.35rem] leading-snug text-[var(--ink)]">
                  {interval === "year"
                    ? t("marketingPricing.page.summaryPerYear", { price: p.annualSeat })
                    : t("marketingPricing.page.summaryPerMonth", { price: p.seat })}
                </p>
                <p className="mt-2 text-[14.5px] leading-relaxed text-[var(--ink-muted)]">
                  {interval === "year"
                    ? t("marketingPricing.page.summaryFloorAnnual", p)
                    : t("marketingPricing.page.summaryFloorMonthly", p)}
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={80} className="mt-20">
          <div>
            <h2 className="ui-display text-[clamp(1.6rem,2.5vw,2rem)] text-[var(--ink)]">
              {t("marketingPricing.page.calcTitle")}
            </h2>
            <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-[var(--ink-muted)]">
              {interval === "year"
                ? t("marketingPricing.page.calcBodyAnnual", {
                    ...p,
                    equiv: formatAnnualMonthlyEquivalentEur(FLOOR_INCLUDED_SEATS),
                  })
                : t("marketingPricing.page.calcBodyMonthly", p)}
            </p>

            <div className="mt-8 grid grid-cols-1 items-stretch gap-5 lg:grid-cols-2 lg:gap-6">
              <div className="grid grid-cols-2 gap-3">
                {EXAMPLE_SIZES.map((seats) => {
                  const price = formatPriceEurForInterval(seats, interval);
                  const atFloor = seats <= FLOOR_INCLUDED_SEATS;
                  return (
                    <div
                      key={seats}
                      className="flex flex-col justify-between rounded-[18px] border border-[rgba(26,22,17,0.15)] bg-[var(--surface)] px-4 py-4"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-[rgba(26,22,17,0.45)]">
                        {seats} pers.
                      </p>
                      <p className="ui-display mt-2 text-2xl text-[var(--ink)]">{price}</p>
                      <p className="mt-1 text-xs text-[rgba(26,22,17,0.5)]">
                        {atFloor
                          ? interval === "year"
                            ? t("marketingPricing.page.atFloorAnnual", p)
                            : t("marketingPricing.page.atFloorMonthly", p)
                          : interval === "year"
                            ? t("marketingPricing.page.overFloorAnnual", {
                                seats,
                                annualSeat: p.annualSeat,
                                total: calculatePriceCents(seats, "year") / 100,
                              })
                            : t("marketingPricing.page.overFloorMonthly", {
                                seats,
                                seat: p.seat,
                                total: calculatePriceCents(seats, "month") / 100,
                              })}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="flex h-full flex-col justify-between rounded-[22px] border border-[rgba(26,22,17,0.2)] bg-[var(--surface)] px-7 py-7 sm:px-8 sm:py-8">
                <div>
                  <h3 className="ui-display text-xl text-[var(--ink)]">{t("marketingPricing.page.simulatorTitle")}</h3>
                  <p className="mt-2 text-sm text-[var(--ink-muted)]">
                    {interval === "year"
                      ? t("marketingPricing.page.simulatorBodyAnnual")
                      : t("marketingPricing.page.simulatorBodyMonthly")}
                  </p>
                  <label className="mt-5 block text-sm font-semibold text-[var(--ink)]" htmlFor="pricing-simulator">
                    {t("marketingPricing.page.peopleLabel")}
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
                </div>
                <div className="mt-6">
                  <p className="text-lg font-semibold text-[var(--ink)]">
                    {interval === "year"
                      ? t("marketingPricing.page.simulatorResultAnnual", {
                          count: simulatorSeats,
                          price: simulatedPrice,
                          equiv: simulatedEquiv,
                        })
                      : t("marketingPricing.page.simulatorResultMonthly", {
                          count: simulatorSeats,
                          price: simulatedPrice,
                        })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={120} className="mt-20">
          <h2 className="ui-display text-xl text-[var(--ink)]">{t("marketingPricing.page.faqTitle")}</h2>
          <div className="mt-6 grid grid-cols-1 gap-x-12 border-t border-[rgba(26,22,17,0.18)] md:grid-cols-2">
            {faqItems.map((item) => (
              <div key={item.q} className="border-b border-[rgba(26,22,17,0.12)] py-5">
                <h3 className="text-[15px] font-semibold text-[var(--ink)]">{item.q}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-[rgba(26,22,17,0.65)]">{item.a}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={160}>
          <div className="relative mt-[70px] flex flex-wrap items-center justify-between gap-8 overflow-hidden rounded-[26px] bg-[var(--ink)] px-10 py-14 sm:px-12">
            <div className="relative max-w-[640px]">
              <h2 className="ui-display text-[clamp(1.7rem,3vw,2.4rem)] leading-[1.1] tracking-[-0.015em] text-[var(--background)]">
                {t("marketingPricing.page.ctaTitle")}
              </h2>
              <p className="mt-3.5 text-[15px] text-[rgba(246,241,231,0.6)]">
                {t("marketingPricing.page.ctaBody", p)}
              </p>
            </div>
            <Link
              href="/signup"
              className="relative mkt-cta-band inline-flex items-center gap-2.5 rounded-[100px] bg-[var(--background)] px-8 py-[17px] text-[15.5px] font-semibold text-[var(--ink)]"
            >
              {t("marketingPricing.page.ctaButton")}{" "}
              <span className="font-[family-name:var(--font-mono)]">→</span>
            </Link>
          </div>
        </ScrollReveal>
      </main>

      <div className="relative z-[5] border-t border-[var(--line)] px-6 py-9 sm:px-10">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-2">
          <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[rgba(26,22,17,0.45)]">
            © 2026 — Fait en France 🇫🇷
          </p>
          <LegalFooter />
        </div>
      </div>
    </div>
  );
}
