import Link from "next/link";
import {
  CalendarRange,
  Check,
  ClipboardList,
  FolderOpen,
  ImageIcon,
  LayoutGrid,
  Lightbulb,
  Megaphone,
  Package,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { AppMark, AppWordmark } from "../AppBrand";
import LegalFooter from "../legal/LegalFooter";
import PricingCard from "./PricingCard";
import ScrollReveal from "./ScrollReveal";
import { PLAN_MARKETING_FEATURES, TRIAL_DAYS, type PublicPlan } from "../../lib/billing/plans";
import "./marketing.css";

const MODULE_HIGHLIGHTS = [
  {
    icon: LayoutGrid,
    title: "Tableau de bord",
    desc: "Kanban, listes et calendrier pour voir où en est chaque projet.",
  },
  {
    icon: ClipboardList,
    title: "Mon agenda",
    desc: "Vos tâches du jour, vos priorités — votre coin perso dans l'outil.",
  },
  {
    icon: CalendarRange,
    title: "Planning",
    desc: "Visualisez la charge de l'équipe et anticipez les semaines chargées.",
  },
  {
    icon: Lightbulb,
    title: "Boîte à idées",
    desc: "Collectez les suggestions et votez pour les meilleures pistes.",
  },
  {
    icon: Users,
    title: "Boîte à demandes",
    desc: "Recevez les demandes, triez-les et transformez-les en tâches.",
  },
  {
    icon: CalendarRange,
    title: "Événements",
    desc: "Salons, conférences : planning, matériel, budget et bilan.",
  },
  {
    icon: Megaphone,
    title: "Réseaux sociaux",
    desc: "Calendrier éditorial, visuels et validation avant publication.",
  },
  {
    icon: ImageIcon,
    title: "Fichiers & visuels",
    desc: "Logos, photos et templates partagés — fini les fichiers perdus.",
  },
  {
    icon: Package,
    title: "Stock",
    desc: "Inventaire PLV, impressions et alertes quand il reste peu.",
  },
  {
    icon: Target,
    title: "Objectifs d'équipe",
    desc: "Fixez des objectifs clairs et suivez l'avancement ensemble.",
  },
  {
    icon: FolderOpen,
    title: "Enquêtes",
    desc: "Créez des sondages internes et analysez les retours.",
  },
];

const PUBLIC_PLAN_ORDER: PublicPlan[] = ["free", "starter", "pro"];

const WHY_POINTS = [
  "Activez uniquement les modules dont vous avez besoin",
  "Invitez vos collègues en quelques clics par e-mail",
  "Personnalisez logo et couleurs de votre espace",
  "Passez du gratuit au Pro quand votre projet grandit",
  "Essai complet de 14 jours — sans carte bancaire",
];

export default function LandingPage() {
  return (
    <div className="mkt-page min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-40 border-b border-[var(--line)]/80 bg-[var(--surface)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <AppMark className="h-8 w-8" />
            <AppWordmark size="compact" />
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/pricing"
              className="hidden text-sm font-medium text-[color:var(--foreground)]/65 hover:text-[var(--foreground)] sm:inline"
            >
              Tarifs
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-[color:var(--foreground)]/65 hover:text-[var(--foreground)]"
            >
              Connexion
            </Link>
            <Link href="/signup" className="mkt-cta-primary px-3.5 py-2 text-sm">
              Essai gratuit
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-4 pb-16 pt-14 sm:pb-24 sm:pt-20">
          <div className="mkt-hero-glow mkt-hero-glow--1" aria-hidden />
          <div className="mkt-hero-glow mkt-hero-glow--2" aria-hidden />
          <div className="mkt-hero-glow mkt-hero-glow--3" aria-hidden />

          <div className="relative mx-auto max-w-3xl text-center">
            <ScrollReveal>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--foreground)]/45">
                Votre espace projet, tout-en-un
              </p>
            </ScrollReveal>
            <ScrollReveal delay={80}>
              <h1 className="ui-display mt-4 text-4xl font-bold leading-[1.1] text-[var(--foreground)] sm:text-5xl">
                Vos projets, vos tâches, votre com&apos;
                <span className="text-[var(--brand-primary)]"> — au même endroit</span>
              </h1>
            </ScrollReveal>
            <ScrollReveal delay={160}>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[color:var(--foreground)]/65 sm:text-lg">
                Fini le jonglage entre Notion, Excel et dix fils de discussion. Workspace regroupe kanban,
                planning, événements, réseaux sociaux et fichiers partagés — vous n&apos;activez que ce qui
                vous sert vraiment.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={240}>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <span className="mkt-stat-pill">11 modules à la carte</span>
                <span className="mkt-stat-pill">{TRIAL_DAYS} jours d&apos;essai complet</span>
                <span className="mkt-stat-pill">Gratuit pour 2 personnes</span>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={320}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link href="/signup" className="mkt-cta-primary px-6 py-3 text-sm">
                  Lancer mon espace — {TRIAL_DAYS} jours offerts
                </Link>
                <Link
                  href="/pricing"
                  className="ui-transition rounded-xl border border-[var(--line)] bg-[var(--surface)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-soft)]"
                >
                  Comparer les offres
                </Link>
              </div>
              <p className="mt-4 text-xs text-[color:var(--foreground)]/45">
                Sans carte bancaire · Passez au gratuit (1 à 2 personnes) après l&apos;essai
              </p>
            </ScrollReveal>
          </div>
        </section>

        <section className="border-y border-[var(--line)] bg-[var(--surface-soft)]/50 px-4 py-14 sm:py-18">
          <div className="mx-auto max-w-6xl">
            <ScrollReveal className="text-center">
              <h2 className="text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
                Chaque brique a un nom clair
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-[color:var(--foreground)]/60 sm:text-base">
                Pas de jargon technique : vous voyez tout de suite à quoi sert chaque module. Activez ce
                dont vous avez besoin, ignorez le reste.
              </p>
            </ScrollReveal>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MODULE_HIGHLIGHTS.map(({ icon: Icon, title, desc }, index) => (
                <ScrollReveal key={title} delay={index * 60} className="h-full">
                  <div className="mkt-module-card mkt-card-hover h-full">
                    <div className="mkt-module-icon">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-3 font-semibold text-[var(--foreground)]">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-[color:var(--foreground)]/65">{desc}</p>
                  </div>
                </ScrollReveal>
              ))}
              <ScrollReveal delay={MODULE_HIGHLIGHTS.length * 60} className="h-full sm:col-span-2 lg:col-span-1">
                <div className="mkt-module-card mkt-card-hover flex h-full flex-col border-[color-mix(in_srgb,var(--mkt-pro)_28%,var(--line))] bg-[color-mix(in_srgb,var(--mkt-pro)_6%,var(--surface))]">
                  <div
                    className="mkt-module-icon"
                    style={{
                      background: "color-mix(in srgb, var(--mkt-pro) 14%, var(--surface))",
                      color: "var(--mkt-pro)",
                    }}
                  >
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 font-semibold text-[var(--foreground)]">Assistant IA</h3>
                  <p className="mt-1 flex-1 text-sm leading-relaxed text-[color:var(--foreground)]/65">
                    Reformulez un texte, résumez une réunion, gagnez du temps sur le rédactionnel (plan Pro).
                  </p>
                  <span className="mkt-plan-badge mkt-plan-badge--pro mt-3 self-start">Plan Pro</span>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        <section className="px-4 py-14 sm:py-18">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center">
            <ScrollReveal direction="left">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--foreground)]/70">
                <Users className="h-3.5 w-3.5" />
                Pensé pour les vrais projets
              </div>
              <h2 className="mt-4 text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
                Un outil qui grandit avec vous, pas un usine à gaz
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[color:var(--foreground)]/65 sm:text-base">
                Que vous lanciez une asso, une agence ou un side project à deux, Workspace s&apos;adapte :
                commencez léger, ajoutez des modules quand le besoin arrive.
              </p>
              <ul className="mt-5 space-y-3">
                {WHY_POINTS.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-[color:var(--foreground)]/75">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-primary)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </ScrollReveal>

            <ScrollReveal direction="right" delay={120}>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--foreground)]/45">
                  Trois offres, un seul objectif
                </p>
                <p className="mt-1 text-sm text-[color:var(--foreground)]/60">
                  Du gratuit illimité au pack complet — choisissez selon la taille de votre équipe.
                </p>
                <div className="mt-5 space-y-4">
                  {PUBLIC_PLAN_ORDER.map((planId) => (
                    <PricingCard
                      key={planId}
                      planId={planId}
                      features={PLAN_MARKETING_FEATURES[planId].slice(0, 3)}
                      compact
                    />
                  ))}
                </div>
                <Link
                  href="/pricing"
                  className="ui-transition mt-6 flex w-full items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface)]"
                >
                  Voir le détail des tarifs
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section className="border-t border-[var(--line)] bg-[color-mix(in_srgb,var(--brand-primary)_6%,var(--background))] px-4 py-14 sm:py-16">
          <ScrollReveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
              Prêt à arrêter de courir partout ?
            </h2>
            <p className="mt-3 text-sm text-[color:var(--foreground)]/65 sm:text-base">
              Créez votre espace en moins de 5 minutes. Choisissez vos modules, invitez un collègue, c&apos;est
              parti.
            </p>
            <Link href="/signup" className="mkt-cta-primary mt-6 inline-flex px-6 py-3 text-sm">
              Créer mon espace gratuitement
            </Link>
          </ScrollReveal>
        </section>
      </main>

      <div className="mx-auto max-w-6xl px-4 pb-10">
        <LegalFooter />
      </div>
    </div>
  );
}
