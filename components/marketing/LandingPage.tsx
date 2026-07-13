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
    desc: "Salons, conférences : planning, matériel, budget et bilan.",
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

const WHY_POINTS = [
  "Activez uniquement les modules dont vous avez besoin",
  "Invitez vos collègues en quelques clics par e-mail",
  "Personnalisez logo et couleurs de votre espace",
  "Essai complet de 14 jours, sans carte bancaire",
];

export default function LandingPage() {
  return (
    <div className="mkt-page min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--background)_85%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-4 py-[18px] sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <AppMark className="h-8 w-8" />
            <AppWordmark size="compact" />
          </Link>
          <nav className="hidden items-center gap-8 sm:flex">
            <a
              href="#modules"
              className="text-sm font-medium text-[var(--ink-muted)] hover:text-[var(--ink)]"
            >
              Modules
            </a>
            <a
              href="#tarifs"
              className="text-sm font-medium text-[var(--ink-muted)] hover:text-[var(--ink)]"
            >
              Tarifs
            </a>
            <Link
              href="/pricing"
              className="text-sm font-medium text-[var(--ink-muted)] hover:text-[var(--ink)]"
            >
              Ressources
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold text-[var(--ink)]">
              Connexion
            </Link>
            <Link href="/signup" className="mkt-cta-primary px-5 py-2.5 text-[13.5px]">
              Essai gratuit
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-4 pb-[4.5rem] pt-24 sm:px-8">
          <div className="mkt-hero-glow mkt-hero-glow--1" aria-hidden />
          <div className="mkt-hero-glow mkt-hero-glow--2" aria-hidden />
          <div className="mkt-hero-dots" aria-hidden />

          <div className="relative mx-auto max-w-[840px] text-center">
            <ScrollReveal>
              <div className="mkt-hero-badge">
                <span className="mkt-hero-badge__dot" aria-hidden />
                GESTION D&apos;ÉQUIPE TOUT-EN-UN
              </div>
            </ScrollReveal>
            <ScrollReveal delay={80}>
              <h1 className="ui-display mt-[22px] text-[clamp(2.5rem,6vw,4.25rem)] font-bold leading-[1.03] text-[var(--ink)]">
                Arrêtez de jongler
                <br />
                entre dix outils
              </h1>
            </ScrollReveal>
            <ScrollReveal delay={160}>
              <p className="mx-auto mt-[22px] max-w-[560px] text-lg leading-relaxed text-[var(--ink-muted)]">
                Kanban, planning, événements, réseaux sociaux, stock — un espace de travail unique où
                chaque équipe n&apos;active que ce dont elle a besoin.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={240}>
              <div className="mt-[34px] flex flex-wrap items-center justify-center gap-3">
                <Link href="/signup" className="mkt-cta-primary">
                  Lancer mon espace
                </Link>
                <a href="#modules" className="mkt-cta-secondary">
                  Voir les modules
                </a>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={320}>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
                <span className="mkt-stat-pill">11 modules à la carte</span>
                <span className="mkt-stat-pill">{TRIAL_DAYS} jours d&apos;essai complet</span>
                <span className="mkt-stat-pill">5 modules gratuits</span>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section
          id="modules"
          className="border-y border-[var(--line)] bg-[var(--surface)] px-4 py-[5.5rem] sm:px-8"
        >
          <div className="mx-auto max-w-[1180px]">
            <ScrollReveal className="max-w-[520px]">
              <span className="ui-kicker">// MODULES</span>
              <h2 className="ui-display mt-3 text-[clamp(1.75rem,3.4vw,2.375rem)] font-bold text-[var(--ink)]">
                Chaque brique a un nom clair
              </h2>
              <p className="mt-3.5 text-base leading-relaxed text-[var(--ink-muted)]">
                Pas de jargon. Vous voyez tout de suite à quoi sert chaque module — activez ce dont
                vous avez besoin, ignorez le reste.
              </p>
            </ScrollReveal>

            <div className="mkt-module-grid mt-11">
              {LANDING_MODULE_ORDER.map((moduleId) => {
                const copy = MODULE_COPY[moduleId];
                return (
                  <ScrollReveal key={moduleId} className="mkt-module-cell">
                    <ModuleGlyph moduleId={moduleId} size="md" />
                    <h3>{copy.title}</h3>
                    <p>{copy.desc}</p>
                  </ScrollReveal>
                );
              })}
              <ScrollReveal className="mkt-module-cell mkt-module-cell--inverted">
                <ModuleGlyph moduleId="ai" size="md" />
                <h3>Assistant IA</h3>
                <p>Reformulez, résumez, gagnez du temps sur le rédactionnel.</p>
                <span className="mkt-plan-badge-pro">PLAN PRO</span>
              </ScrollReveal>
            </div>
          </div>
        </section>

        <section className="px-4 py-24 sm:px-8">
          <div className="mx-auto grid max-w-[1180px] gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <ScrollReveal direction="left">
              <span className="ui-kicker">// POURQUOI RECUEIL</span>
              <h2 className="ui-display mt-3 text-[clamp(1.75rem,3.4vw,2.375rem)] font-bold text-[var(--ink)]">
                Un outil qui grandit avec vous
              </h2>
              <p className="mt-3.5 max-w-[460px] text-base leading-relaxed text-[var(--ink-muted)]">
                Asso, agence ou side project à deux : commencez léger, ajoutez des modules quand le
                besoin arrive.
              </p>
              <ul className="mt-7 flex flex-col gap-4">
                {WHY_POINTS.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-[15px] text-[color-mix(in_srgb,var(--ink)_78%,transparent)]"
                  >
                    <span className="mkt-check" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </ScrollReveal>

            <ScrollReveal direction="right" delay={120}>
              <LandingPricingSection />
            </ScrollReveal>
          </div>
        </section>

        <section className="mkt-cta-band">
          <ScrollReveal>
            <h2>Prêt à arrêter de courir partout ?</h2>
            <p>
              Créez votre espace en moins de 5 minutes. Choisissez vos modules, invitez un collègue,
              c&apos;est parti.
            </p>
            <Link href="/signup" className="mkt-cta-accent mt-[26px]">
              Créer mon espace gratuitement
            </Link>
          </ScrollReveal>
        </section>
      </main>

      <footer className="border-t border-[var(--line)] bg-[var(--background)] px-4 py-10 sm:px-8">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3">
          <AppWordmark size="compact" />
          <nav className="flex flex-wrap gap-5 text-[13px] text-[var(--ink-muted)]">
            <Link href="/privacy" className="hover:text-[var(--ink)]">
              Confidentialité
            </Link>
            <Link href="/terms" className="hover:text-[var(--ink)]">
              CGU
            </Link>
            <Link href="/legal" className="hover:text-[var(--ink)]">
              Mentions légales
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
