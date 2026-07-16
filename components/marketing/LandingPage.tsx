import Link from "next/link";
import { AppMark, AppWordmark } from "../AppBrand";
import ModuleGlyph from "../modules/ModuleGlyph";
import ScrollReveal from "./ScrollReveal";
import LandingPricingSection from "./LandingPricingSection";
import { TRIAL_DAYS } from "../../lib/billing/plans";
import { LANDING_MODULE_ORDER } from "../../lib/modules/moduleGlyphs";
import type { AppModuleId } from "../../lib/modules";
import "./marketing.css";

const MODULE_COPY: Record<AppModuleId, { title: string; desc: string }> = {
  dashboard: {
    title: "Tableau de bord",
    desc: "Kanban, listes et calendrier pour voir où en est chaque projet.",
  },
  workspace: {
    title: "Mon agenda",
    desc: "Vos tâches du jour, vos priorités — votre coin perso dans l'outil.",
  },
  planning: {
    title: "Planning",
    desc: "Visualisez la charge de l'équipe et anticipez les semaines chargées.",
  },
  ideas: {
    title: "Boîte à idées",
    desc: "Collectez les suggestions et votez pour les meilleures pistes.",
  },
  asks: {
    title: "Boîte à demandes",
    desc: "Recevez les demandes, triez-les et transformez-les en tâches.",
  },
  events: {
    title: "Événements",
    desc: "Événements, conférences : planning, matériel, budget et bilan.",
  },
  social: {
    title: "Réseaux sociaux",
    desc: "Calendrier éditorial, visuels et validation avant publication.",
  },
  dam: {
    title: "Fichiers & visuels",
    desc: "Logos, photos et templates partagés — fini les fichiers perdus.",
  },
  stock: {
    title: "Stock",
    desc: "Inventaire PLV, impressions et alertes quand il reste peu.",
  },
  okr: {
    title: "Objectifs d'équipe",
    desc: "Fixez des objectifs clairs et suivez l'avancement ensemble.",
  },
  surveys: {
    title: "Enquêtes",
    desc: "Créez des sondages internes et analysez les retours.",
  },
};

const HERO_STATS = [
  { value: "11", label: "Modules inclus" },
  { value: `${TRIAL_DAYS} j`, label: "Essai complet, sans CB" },
  { value: "2€", label: "Par utilisateur / mois" },
];

const MARQUEE_WORDS = [
  "Kanban",
  "Planning",
  "Événements",
  "Réseaux sociaux",
  "Stock",
  "Boîte à idées",
  "Demandes",
  "Fichiers",
  "Objectifs",
  "Enquêtes",
  "Mon agenda",
  "Assistant IA",
];

const WHY_POINTS = [
  { num: "01", text: "Tout inclus : les 11 modules, IA, Outlook et alertes" },
  { num: "02", text: "2 € par utilisateur / mois, minimum 10 € (jusqu’à 5 personnes)" },
  { num: "03", text: "Invitez vos collègues — la facture suit le nombre de sièges" },
  { num: "04", text: `Essai complet de ${TRIAL_DAYS} jours, sans carte bancaire` },
];

export default function LandingPage() {
  return (
    <div className="mkt-page relative min-h-screen overflow-hidden bg-[var(--background)]">
      <header className="relative z-10 border-b border-[var(--line)]">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-4 px-6 py-5 sm:grid-cols-[1fr_auto_1fr] sm:px-10">
          <Link href="/" className="flex items-center gap-3">
            <AppMark className="h-[34px] w-[34px]" />
            <AppWordmark size="compact" />
          </Link>
          <nav className="hidden items-center justify-center gap-9 sm:flex">
            <a href="#modules" className="mkt-nav-link">
              Modules
            </a>
            <a href="#tarifs" className="mkt-nav-link">
              Tarifs
            </a>
            <Link href="/pricing" className="mkt-nav-link">
              Manifeste
            </Link>
          </nav>
          <div className="flex items-center justify-end gap-5">
            <Link href="/login" className="mkt-link-underline text-sm font-semibold">
              Connexion
            </Link>
            <Link href="/signup" className="mkt-cta-primary px-[22px] py-[11px] text-sm">
              Essai gratuit <span className="font-[family-name:var(--font-mono)]">→</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-[5]">
        <section className="relative px-6 pb-[90px] pt-[110px] sm:px-10">
          <div className="ui-hero-halo ui-hero-halo--orange absolute -right-[120px] -top-[180px] h-[700px] w-[700px]" aria-hidden />
          <div className="relative mx-auto max-w-[1280px]">
            <div className="mkt-hero-kicker flex items-center gap-3.5">
              <span className="ui-kicker text-[12px] tracking-[0.18em]">
                N°01 — L&apos;espace de travail des équipes com&apos;
              </span>
              <span className="mkt-hero-line h-px max-w-[220px] flex-1 bg-[rgba(26,22,17,0.25)]" aria-hidden />
            </div>
            <h1 className="ui-display mt-9 max-w-[1100px] text-[clamp(3.5rem,8.5vw,7.5rem)] leading-[0.98] tracking-[-0.02em] text-[var(--ink)]">
              <span className="mkt-hero-line-reveal block overflow-hidden">
                <span className="mkt-hero-line-inner block">Dix outils en moins.</span>
              </span>
              <span className="mkt-hero-line-reveal block overflow-hidden">
                <span className="mkt-hero-line-inner mkt-hero-line-inner--2 block">
                  <em className="italic text-[var(--accent)]">Une équipe</em> en plus.
                </span>
              </span>
            </h1>
            <div className="mt-11 flex flex-wrap items-end justify-between gap-10">
              <p className="mkt-hero-sub max-w-[440px] text-lg leading-relaxed text-[var(--ink-muted)]">
                Kanban, planning, événements, réseaux sociaux, stock — un seul abonnement, tout inclus.
                2&nbsp;€ par utilisateur / mois, minimum 10&nbsp;€.
              </p>
              <div className="mkt-hero-cta flex flex-wrap items-center gap-[18px]">
                <Link href="/signup" className="mkt-cta-primary px-8 py-[17px] text-base">
                  Lancer mon espace <span className="font-[family-name:var(--font-mono)]">→</span>
                </Link>
                <a href="#modules" className="mkt-link-accent text-[15px] font-semibold">
                  Voir les modules
                </a>
              </div>
            </div>
            <div className="mkt-hero-stats mt-[70px] grid grid-cols-1 border-t border-[var(--line)] sm:grid-cols-3">
              {HERO_STATS.map((stat, i) => (
                <div
                  key={stat.label}
                  className={[
                    "pt-[26px] pr-6",
                    i < 2 ? "sm:border-r sm:border-[rgba(26,22,17,0.1)]" : "",
                  ].join(" ")}
                >
                  <p className="ui-display text-[40px] leading-none text-[var(--ink)]">{stat.value}</p>
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
            {[...MARQUEE_WORDS, ...MARQUEE_WORDS].map((word, i) => (
              <span
                key={`${word}-${i}`}
                className="inline-flex items-center gap-[22px] pr-[22px] font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.16em] text-[rgba(26,22,17,0.6)] whitespace-nowrap"
              >
                {word} <span className="text-[var(--accent)]">✦</span>
              </span>
            ))}
          </div>
        </div>

        <section id="modules" className="relative z-[5] px-6 py-[100px] sm:px-10">
          <div className="mx-auto max-w-[1280px]">
            <div className="flex flex-wrap items-baseline justify-between gap-6">
              <h2 className="ui-display text-[clamp(2.4rem,4.5vw,3.6rem)] tracking-[-0.02em] text-[var(--ink)]">
                Onze modules.
                <br />
                <em className="text-[var(--accent)] italic">Zéro jargon.</em>
              </h2>
              <p className="max-w-[380px] text-base leading-relaxed text-[var(--ink-muted)]">
                Activez ce dont vous avez besoin, ignorez le reste. Chaque brique porte un nom que toute
                l&apos;équipe comprend.
              </p>
            </div>

            <div className="mt-14 border-t border-[rgba(26,22,17,0.18)]">
              {LANDING_MODULE_ORDER.map((moduleId, index) => {
                const copy = MODULE_COPY[moduleId];
                const num = String(index + 1).padStart(2, "0");
                return (
                  <ScrollReveal key={moduleId}>
                    <div className="mkt-module-row group grid grid-cols-[56px_1fr] items-center gap-6 border-b border-[var(--line)] py-[26px] sm:grid-cols-[80px_1fr_1.2fr_auto] sm:px-2">
                      <span className="font-[family-name:var(--font-mono)] text-[13px] text-[rgba(26,22,17,0.4)]">
                        {num}
                      </span>
                      <h3 className="ui-display text-[27px] tracking-[-0.01em] text-[var(--ink)]">
                        {copy.title}
                      </h3>
                      <p className="col-span-2 text-[15px] leading-[1.55] text-[rgba(26,22,17,0.6)] sm:col-span-1">
                        {copy.desc}
                      </p>
                      <div className="hidden sm:block">
                        <ModuleGlyph moduleId={moduleId} size="md" />
                      </div>
                    </div>
                  </ScrollReveal>
                );
              })}
              <ScrollReveal>
                <div className="grid grid-cols-[56px_1fr] items-center gap-6 rounded-b-[18px] bg-[var(--ink)] px-5 py-[26px] sm:grid-cols-[80px_1fr_1.2fr_auto]">
                  <span className="font-[family-name:var(--font-mono)] text-[13px] text-[rgba(246,241,231,0.45)]">
                    12
                  </span>
                  <h3 className="ui-display text-[27px] tracking-[-0.01em] text-[var(--background)]">
                    Assistant IA <em className="text-[var(--accent-on-dark)] italic">— inclus</em>
                  </h3>
                  <p className="col-span-2 text-[15px] leading-[1.55] text-[rgba(246,241,231,0.6)] sm:col-span-1">
                    Reformulez, résumez, gagnez du temps sur le rédactionnel.
                  </p>
                  <span className="hidden h-[42px] w-[42px] items-center justify-center rounded-full bg-[var(--accent)] sm:inline-flex">
                    <span className="atelier-star atelier-star--spin h-3.5 w-3.5 bg-[var(--background)]" aria-hidden />
                  </span>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        <section className="relative z-[5] px-6 pb-[100px] pt-10 sm:px-10">
          <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-20 lg:grid-cols-[1.1fr_0.9fr]">
            <ScrollReveal direction="left">
              <span className="ui-kicker text-[12px] tracking-[0.18em]">N°02 — Pourquoi WorkSpace</span>
              <p className="ui-display mt-7 text-[clamp(1.8rem,3.2vw,2.6rem)] leading-[1.2] tracking-[-0.01em] text-[var(--ink)]">
                « Un seul prix, tout inclus. Vous payez au siège —{" "}
                <em className="text-[var(--accent)] italic">l&apos;équipe grandit, la facture reste claire</em>,
                sans paliers cachés. »
              </p>
              <ul className="mt-9 flex flex-col">
                {WHY_POINTS.map((pt) => (
                  <li
                    key={pt.num}
                    className="flex items-center gap-4 border-b border-[rgba(26,22,17,0.12)] py-[15px] text-base text-[rgba(26,22,17,0.8)]"
                  >
                    <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--accent)]">
                      {pt.num}
                    </span>
                    {pt.text}
                  </li>
                ))}
              </ul>
            </ScrollReveal>
            <ScrollReveal direction="right" delay={120}>
              <LandingPricingSection />
            </ScrollReveal>
          </div>
        </section>

        <section className="relative z-[5] mx-6 mb-10 overflow-hidden rounded-[28px] bg-[var(--ink)] px-6 py-[100px] text-center sm:mx-10">
          <GrainBand aria-hidden />
          <ScrollReveal>
            <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.18em] text-[var(--accent-on-dark)]">
              N°03 — C&apos;est parti
            </span>
            <h2 className="ui-display mx-auto mt-6 max-w-[760px] text-[clamp(2.6rem,5vw,4.2rem)] leading-[1.05] tracking-[-0.02em] text-[var(--background)]">
              Prêt à arrêter de <em className="text-[var(--accent-on-dark)] italic">courir partout</em> ?
            </h2>
            <p className="mx-auto mt-[22px] max-w-[460px] text-[17px] text-[rgba(246,241,231,0.6)]">
              Créez votre espace en moins de 5 minutes. {TRIAL_DAYS} jours pour tout tester, sans carte
              bancaire.
            </p>
            <Link
              href="/signup"
              className="mkt-cta-band mt-9 inline-flex items-center gap-2.5 rounded-[100px] bg-[var(--background)] px-9 py-[18px] text-base font-semibold text-[var(--ink)]"
            >
              Essayer {TRIAL_DAYS} jours gratuits{" "}
              <span className="font-[family-name:var(--font-mono)]">→</span>
            </Link>
          </ScrollReveal>
        </section>
      </main>

      <footer className="relative z-[5] border-t border-[var(--line)] px-6 py-9 sm:px-10">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4">
          <AppWordmark size="compact" />
          <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.14em] text-[rgba(26,22,17,0.45)]">
            © 2026 — Fait avec soin
          </span>
          <nav className="flex flex-wrap gap-6 text-[13.5px] text-[rgba(26,22,17,0.6)]">
            <Link href="/privacy" className="hover:text-[var(--accent)]">
              Confidentialité
            </Link>
            <Link href="/terms" className="hover:text-[var(--accent)]">
              CGU
            </Link>
            <Link href="/legal" className="hover:text-[var(--accent)]">
              Mentions légales
            </Link>
          </nav>
        </div>
      </footer>
    </div>
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
