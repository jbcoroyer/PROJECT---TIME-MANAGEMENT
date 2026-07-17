"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppMark, AppWordmark } from "../AppBrand";
import ModuleGlyph from "../modules/ModuleGlyph";
import ScrollReveal from "./ScrollReveal";
import LandingPricingSection from "./LandingPricingSection";
import {
  ANNUAL_FLOOR_EUR,
  FLOOR_INCLUDED_SEATS,
  MONTHLY_FLOOR_EUR,
  PRICE_PER_SEAT_ANNUAL_EUR,
  PRICE_PER_SEAT_EUR,
  TRIAL_DAYS,
} from "../../lib/billing/plans";
import { LANDING_MODULE_ORDER } from "../../lib/modules/moduleGlyphs";
import type { AppModuleId } from "../../lib/modules";
import { useTranslation } from "../../lib/i18n/useTranslation";
import "./marketing.css";

const MARQUEE_KEYS = [
  "kanban",
  "planningGantt",
  "events",
  "requests",
  "stock",
  "ideas",
  "agenda",
  "okr",
  "surveys",
  "social",
  "files",
  "ai",
  "outlook",
  "integrations",
] as const;

const BENEFIT_KEYS = ["b1", "b2", "b3", "b4"] as const;

const USE_CASE_KEYS = ["ops", "events", "leadership"] as const;

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.pushState(null, "", `#${id}`);
}

export default function LandingPageContent() {
  const { t } = useTranslation({ preferBrowser: true });
  const [headerScrolled, setHeaderScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const next = window.scrollY > 16;
      queueMicrotask(() => setHeaderScrolled(next));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const frame = window.requestAnimationFrame(() => scrollToSection(hash));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const onSectionNav = useCallback((event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    scrollToSection(id);
  }, []);

  const priceParams = {
    seat: PRICE_PER_SEAT_EUR,
    annualSeat: PRICE_PER_SEAT_ANNUAL_EUR,
    floor: MONTHLY_FLOOR_EUR,
    annualFloor: ANNUAL_FLOOR_EUR,
    seats: FLOOR_INCLUDED_SEATS,
    days: TRIAL_DAYS,
    monthly: PRICE_PER_SEAT_EUR,
    annual: PRICE_PER_SEAT_ANNUAL_EUR,
    price: PRICE_PER_SEAT_EUR,
  };

  const heroStats = [
    { value: "11", label: t("marketingLanding.stats.modules"), accent: false },
    { value: `${TRIAL_DAYS}j`, label: t("marketingLanding.stats.trial"), accent: false },
    {
      value: `${PRICE_PER_SEAT_EUR}€`,
      label: t("marketingLanding.stats.perSeat"),
      accent: true,
    },
  ];

  const whyPoints = [
    t("marketingLanding.why.p1"),
    t("marketingLanding.why.p2", priceParams),
    t("marketingLanding.why.p3"),
    t("marketingLanding.why.p4", priceParams),
    t("marketingLanding.why.p5"),
  ];

  return (
    <div className="mkt-page relative min-h-screen bg-[var(--background)]">
      <header
        className={[
          "mkt-header fixed inset-x-0 top-0 z-50 border-b transition-[background,box-shadow,border-color] duration-300",
          headerScrolled
            ? "mkt-header--scrolled border-[var(--line)]"
            : "border-transparent",
        ].join(" ")}
      >
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-4 px-6 py-4 sm:grid-cols-[1fr_auto_1fr] sm:px-10 sm:py-5">
          <Link href="/" className="flex items-center gap-3">
            <AppMark className="h-[34px] w-[34px]" />
            <AppWordmark size="compact" />
          </Link>
          <nav className="hidden items-center justify-center gap-9 sm:flex">
            <a
              href="#avantages"
              className="mkt-nav-link"
              onClick={(e) => onSectionNav(e, "avantages")}
            >
              {t("marketingLanding.nav.benefits")}
            </a>
            <a
              href="#modules"
              className="mkt-nav-link"
              onClick={(e) => onSectionNav(e, "modules")}
            >
              {t("marketingLanding.nav.modules")}
            </a>
            <a href="#tarifs" className="mkt-nav-link" onClick={(e) => onSectionNav(e, "tarifs")}>
              {t("marketingLanding.nav.pricing")}
            </a>
            <Link href="/pricing" className="mkt-nav-link">
              {t("marketingLanding.nav.detail")}
            </Link>
          </nav>
          <div className="flex items-center justify-end gap-5">
            <Link href="/login" className="mkt-link-underline text-sm font-semibold">
              {t("marketingLanding.nav.login")}
            </Link>
            <Link href="/signup" className="mkt-cta-primary px-[22px] py-[11px] text-sm">
              {t("marketingLanding.nav.freeTrial")}{" "}
              <span className="font-[family-name:var(--font-mono)]">→</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-[5] pt-[76px] sm:pt-[88px]">
        <section className="relative px-6 pb-[90px] pt-[48px] sm:px-10 sm:pt-[64px]">
          <div
            className="ui-hero-halo ui-hero-halo--orange absolute -right-[120px] -top-[180px] h-[700px] w-[700px]"
            aria-hidden
          />
          <div className="relative mx-auto max-w-[1280px]">
            <div className="mkt-hero-kicker flex items-center gap-3.5">
              <span className="ui-kicker text-[12px] tracking-[0.18em]">
                {t("marketingLanding.hero.kicker")}
              </span>
              <span
                className="mkt-hero-line h-px max-w-[220px] flex-1 bg-[rgba(26,22,17,0.25)]"
                aria-hidden
              />
            </div>
            <h1 className="ui-display mt-9 max-w-[1100px] text-[clamp(3.2rem,7.5vw,6.4rem)] leading-[1.08] tracking-[-0.02em] text-[var(--ink)]">
              <span className="mkt-hero-line-reveal block">
                <span className="mkt-hero-line-inner block">
                  {t("marketingLanding.hero.title1")}
                </span>
              </span>
              <span className="mkt-hero-line-reveal block">
                <span className="mkt-hero-line-inner mkt-hero-line-inner--2 block">
                  <em className="italic text-[var(--accent)]">
                    {t("marketingLanding.hero.titleEmphasis")}
                  </em>
                </span>
              </span>
            </h1>
            <div className="mt-11 flex flex-wrap items-end justify-between gap-10">
              <p className="mkt-hero-sub max-w-[540px] text-lg leading-relaxed text-[var(--ink-muted)]">
                {t("marketingLanding.hero.subtitle")}
                <br />
                {t("marketingLanding.hero.priceLine", priceParams)}
              </p>
              <div className="mkt-hero-cta flex flex-wrap items-center gap-[18px]">
                <Link href="/signup" className="mkt-cta-primary px-8 py-[17px] text-base">
                  {t("marketingLanding.hero.ctaLaunch")}{" "}
                  <span className="font-[family-name:var(--font-mono)]">→</span>
                </Link>
                <a
                  href="#tarifs"
                  className="mkt-link-accent text-[15px] font-semibold"
                  onClick={(e) => onSectionNav(e, "tarifs")}
                >
                  {t("marketingLanding.hero.ctaPricing", priceParams)}
                </a>
              </div>
            </div>
            <div className="mkt-hero-stats mt-[70px] grid grid-cols-1 border-t border-[var(--line)] sm:grid-cols-3">
              {heroStats.map((stat, i) => (
                <div
                  key={stat.label}
                  className={[
                    "px-4 pt-[26px] text-center",
                    i < 2 ? "sm:border-r sm:border-[rgba(26,22,17,0.1)]" : "",
                  ].join(" ")}
                >
                  <p
                    className={[
                      "ui-display text-[44px] leading-none",
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
          </div>
        </section>

        <div className="relative z-[5] overflow-hidden border-y border-[var(--line)] bg-[var(--surface-deep)] py-4">
          <div className="mkt-marquee flex w-max">
            {[...MARQUEE_KEYS, ...MARQUEE_KEYS].map((key, i) => (
              <span
                key={`${key}-${i}`}
                className="inline-flex items-center gap-[22px] pr-[22px] font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.16em] text-[rgba(26,22,17,0.6)] whitespace-nowrap"
              >
                {t(`marketingLanding.marquee.${key}`)}{" "}
                <span className="text-[var(--accent)]">✦</span>
              </span>
            ))}
          </div>
        </div>

        <section id="avantages" className="mkt-section relative z-[5] px-6 py-[100px] sm:px-10">
          <div className="mx-auto max-w-[1280px]">
            <ScrollReveal>
              <span className="ui-kicker text-[12px] tracking-[0.18em]">
                {t("marketingLanding.benefits.kicker")}
              </span>
              <h2 className="ui-display mt-6 max-w-[820px] text-[clamp(2.2rem,4vw,3.4rem)] tracking-[-0.02em] text-[var(--ink)]">
                {t("marketingLanding.benefits.title1")}
                <br />
                <em className="text-[var(--accent)] italic">
                  {t("marketingLanding.benefits.titleEmphasis")}
                </em>
              </h2>
              <p className="mt-5 max-w-[620px] text-base leading-relaxed text-[var(--ink-muted)]">
                {t("marketingLanding.benefits.intro")}
              </p>
            </ScrollReveal>

            <div className="mt-14 grid grid-cols-1 gap-0 border-t border-[rgba(26,22,17,0.18)] md:grid-cols-2">
              {BENEFIT_KEYS.map((key, index) => (
                <ScrollReveal key={key} delay={index * 90}>
                  <div
                    className={[
                      "border-b border-[rgba(26,22,17,0.12)] px-0 py-8 md:px-6",
                      index % 2 === 0
                        ? "md:border-r md:border-[rgba(26,22,17,0.12)] md:pl-0"
                        : "",
                    ].join(" ")}
                  >
                    <h3 className="ui-display text-[1.55rem] tracking-[-0.01em] text-[var(--ink)]">
                      {t(`marketingLanding.benefits.${key}Title`)}
                    </h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-[rgba(26,22,17,0.65)]">
                      {t(`marketingLanding.benefits.${key}Body`)}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="relative z-[5] px-6 pb-[80px] sm:px-10">
          <div className="mx-auto max-w-[1280px]">
            <ScrollReveal>
              <span className="ui-kicker text-[12px] tracking-[0.18em]">
                {t("marketingLanding.useCases.kicker")}
              </span>
              <h2 className="ui-display mt-6 text-[clamp(2rem,3.5vw,2.8rem)] tracking-[-0.02em] text-[var(--ink)]">
                {t("marketingLanding.useCases.title")}{" "}
                <em className="text-[var(--accent)] italic">
                  {t("marketingLanding.useCases.titleEmphasis")}
                </em>
              </h2>
            </ScrollReveal>
            <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
              {USE_CASE_KEYS.map((key, index) => (
                <ScrollReveal key={key} delay={index * 100}>
                  <div className="border-t border-[rgba(26,22,17,0.2)] pt-6">
                    <h3 className="ui-display text-xl text-[var(--ink)]">
                      {t(`marketingLanding.useCases.${key}Title`)}
                    </h3>
                    <ul className="mt-5 space-y-3">
                      {[1, 2, 3].map((n) => (
                        <li
                          key={n}
                          className="flex gap-3 text-[14.5px] leading-relaxed text-[rgba(26,22,17,0.7)]"
                        >
                          <span
                            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]"
                            aria-hidden
                          />
                          {t(`marketingLanding.useCases.${key}${n}`)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section id="modules" className="mkt-section relative z-[5] px-6 py-[100px] sm:px-10">
          <div className="mx-auto max-w-[1280px]">
            <ScrollReveal>
              <div className="flex flex-wrap items-baseline justify-between gap-6">
                <h2 className="ui-display text-[clamp(2.4rem,4.5vw,3.6rem)] tracking-[-0.02em] text-[var(--ink)]">
                  {t("marketingLanding.modules.title1")}
                  <br />
                  <em className="text-[var(--accent)] italic">
                    {t("marketingLanding.modules.titleEmphasis")}
                  </em>
                </h2>
                <p className="max-w-[400px] text-base leading-relaxed text-[var(--ink-muted)]">
                  {t("marketingLanding.modules.intro", priceParams)}
                </p>
              </div>
            </ScrollReveal>

            <div className="mt-14 border-t border-[rgba(26,22,17,0.18)]">
              {LANDING_MODULE_ORDER.map((moduleId, index) => (
                <ModuleRow key={moduleId} moduleId={moduleId} index={index} t={t} />
              ))}
              <ScrollReveal delay={80}>
                <div className="grid grid-cols-[56px_1fr] items-center gap-6 rounded-b-[18px] bg-[var(--ink)] px-5 py-[26px] sm:grid-cols-[80px_1fr_1.2fr_auto]">
                  <span className="font-[family-name:var(--font-mono)] text-[13px] text-[rgba(246,241,231,0.45)]">
                    12
                  </span>
                  <h3 className="ui-display text-[27px] tracking-[-0.01em] text-[var(--background)]">
                    {t("marketingLanding.modules.aiTitle")}{" "}
                    <em className="text-[var(--accent-on-dark)] italic">
                      {t("marketingLanding.modules.aiTitleEmphasis")}
                    </em>
                  </h3>
                  <p className="col-span-2 text-[15px] leading-[1.55] text-[rgba(246,241,231,0.6)] sm:col-span-1">
                    {t("marketingLanding.modules.aiDesc")}
                  </p>
                  <span className="hidden h-[42px] w-[42px] items-center justify-center rounded-full bg-[var(--accent)] sm:inline-flex">
                    <span
                      className="atelier-star atelier-star--spin h-3.5 w-3.5 bg-[var(--background)]"
                      aria-hidden
                    />
                  </span>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        <section id="tarifs" className="mkt-section relative z-[5] px-6 pb-[100px] pt-10 sm:px-10">
          <div className="mx-auto max-w-[1280px]">
            <ScrollReveal>
              <span className="ui-kicker text-[12px] tracking-[0.18em]">
                {t("marketingLanding.why.kicker")}
              </span>
              <div className="mt-7 grid grid-cols-1 items-start gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
                <div>
                  <p className="ui-display text-[clamp(1.8rem,3.2vw,2.6rem)] leading-[1.2] tracking-[-0.01em] text-[var(--ink)]">
                    {t("marketingLanding.why.quote", priceParams)}
                  </p>
                  <ul className="mt-9 flex flex-col">
                    {whyPoints.map((text, index) => (
                      <ScrollReveal key={text} delay={index * 70}>
                        <li className="border-b border-[rgba(26,22,17,0.12)] py-[15px] text-base text-[rgba(26,22,17,0.8)]">
                          {text}
                        </li>
                      </ScrollReveal>
                    ))}
                  </ul>
                </div>
                <ScrollReveal direction="right" delay={120}>
                  <LandingPricingSection />
                </ScrollReveal>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section className="relative z-[5] mx-6 mb-10 overflow-hidden rounded-[28px] bg-[var(--ink)] px-6 py-[100px] text-center sm:mx-10">
          <GrainBand aria-hidden />
          <ScrollReveal direction="scale">
            <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.18em] text-[var(--accent-on-dark)]">
              {t("marketingLanding.cta.kicker")}
            </span>
            <h2 className="ui-display mx-auto mt-6 max-w-[760px] text-[clamp(2.6rem,5vw,4.2rem)] leading-[1.05] tracking-[-0.02em] text-[var(--background)]">
              {t("marketingLanding.cta.title1")}{" "}
              <em className="text-[var(--accent-on-dark)] italic">
                {t("marketingLanding.cta.titleEmphasis")}
              </em>
              {t("marketingLanding.cta.titleEnd")}
            </h2>
            <p className="mx-auto mt-[22px] max-w-[520px] text-[17px] text-[rgba(246,241,231,0.6)]">
              {t("marketingLanding.cta.body", priceParams)}
            </p>
            <Link
              href="/signup"
              className="mkt-cta-band mt-9 inline-flex items-center gap-2.5 rounded-[100px] bg-[var(--background)] px-9 py-[18px] text-base font-semibold text-[var(--ink)]"
            >
              {t("marketingLanding.cta.button", priceParams)}{" "}
              <span className="font-[family-name:var(--font-mono)]">→</span>
            </Link>
          </ScrollReveal>
        </section>
      </main>

      <footer className="relative z-[5] border-t border-[var(--line)] px-6 py-9 sm:px-10">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4">
          <AppWordmark size="compact" />
          <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[rgba(26,22,17,0.45)]">
            {t("marketingLanding.footer.madeIn")}
          </span>
          <nav className="flex flex-wrap gap-6 text-[13.5px] text-[rgba(26,22,17,0.6)]">
            <Link href="/privacy" className="hover:text-[var(--accent)]">
              {t("legal.footer.privacy")}
            </Link>
            <Link href="/terms" className="hover:text-[var(--accent)]">
              {t("legal.footer.terms")}
            </Link>
            <Link href="/legal" className="hover:text-[var(--accent)]">
              {t("legal.footer.legal")}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function ModuleRow({
  moduleId,
  index,
  t,
}: {
  moduleId: AppModuleId;
  index: number;
  t: (key: string) => string;
}) {
  const num = String(index + 1).padStart(2, "0");
  return (
    <ScrollReveal delay={Math.min(index * 40, 200)}>
      <div className="mkt-module-row group grid grid-cols-[56px_1fr] items-center gap-6 border-b border-[var(--line)] py-[26px] sm:grid-cols-[80px_1fr_1.2fr_auto] sm:px-2">
        <span className="font-[family-name:var(--font-mono)] text-[13px] text-[rgba(26,22,17,0.4)]">
          {num}
        </span>
        <h3 className="ui-display text-[27px] tracking-[-0.01em] text-[var(--ink)]">
          {t(`modules.${moduleId}.name`)}
        </h3>
        <p className="col-span-2 text-[15px] leading-[1.55] text-[rgba(26,22,17,0.6)] sm:col-span-1">
          {t(`modules.${moduleId}.description`)}
        </p>
        <div className="hidden sm:block">
          <ModuleGlyph moduleId={moduleId} size="md" />
        </div>
      </div>
    </ScrollReveal>
  );
}

function GrainBand({ "aria-hidden": ariaHidden }: { "aria-hidden"?: boolean }) {
  return (
    <div
      aria-hidden={ariaHidden}
      className="pointer-events-none absolute inset-0 opacity-40"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 0.95 0 0 0 0 0.85 0 0 0 0.06 0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  );
}
