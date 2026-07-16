import Link from "next/link";
import { AppMark, AppWordmark } from "../AppBrand";
import ModuleGlyph from "../modules/ModuleGlyph";
import ScrollReveal from "./ScrollReveal";
import LandingPricingSection from "./LandingPricingSection";
import {
  FLOOR_INCLUDED_SEATS,
  MONTHLY_FLOOR_EUR,
  PRICE_PER_SEAT_EUR,
  TRIAL_DAYS,
} from "../../lib/billing/plans";
import { LANDING_MODULE_ORDER } from "../../lib/modules/moduleGlyphs";
import type { AppModuleId } from "../../lib/modules";
import "./marketing.css";

const MODULE_COPY: Record<AppModuleId, { title: string; desc: string }> = {
  dashboard: {
    title: "Tableau de bord",
    desc: "Kanban, liste, calendrier, charge et archives — pilotez chaque projet sans changer d'outil.",
  },
  workspace: {
    title: "Agenda",
    desc: "RDV, notes internes et page de réservation publique pour vos interlocuteurs.",
  },
  planning: {
    title: "Planning",
    desc: "Rétroplanning Gantt, charge par personne et détection des surcharges.",
  },
  ideas: {
    title: "Boîte à idées",
    desc: "Collectez, votez et priorisez les suggestions — en interne ou via un lien public.",
  },
  asks: {
    title: "Espace demandes",
    desc: "Formulaire client public, file de triage, conversion en tâches Kanban en un clic.",
  },
  events: {
    title: "Événements",
    desc: "Fiches événement, régie, matériel, budget, documents et bilan RETEX.",
  },
  social: {
    title: "Réseaux sociaux",
    desc: "Calendrier éditorial, validation, objectifs mensuels et recyclage de contenus.",
  },
  dam: {
    title: "Fichiers & visuels",
    desc: "Logos, photos et templates centralisés — réutilisables dans tous les modules.",
  },
  stock: {
    title: "Stock",
    desc: "PLV, impressions, mouvements, historique et alertes de rupture.",
  },
  okr: {
    title: "Objectifs d'équipe",
    desc: "OKR mesurables, suivi par période, lien clair entre stratégie et exécution.",
  },
  surveys: {
    title: "Enquêtes",
    desc: "Questionnaires multi-étapes, liens publics et analyse des réponses.",
  },
};

const HERO_STATS = [
  { value: "11", label: "Modules inclus" },
  { value: `${TRIAL_DAYS} j`, label: "Essai complet, sans CB" },
  { value: `${PRICE_PER_SEAT_EUR}€`, label: "Par utilisateur / mois" },
];

const MARQUEE_WORDS = [
  "Kanban",
  "Planning Gantt",
  "Événements",
  "Réseaux sociaux",
  "Stock PLV",
  "Boîte à idées",
  "Demandes clients",
  "Fichiers de marque",
  "Objectifs OKR",
  "Enquêtes",
  "Agenda & réservation",
  "Assistant IA",
  "Outlook 365",
  "Slack / Teams",
];

const PRODUCT_BENEFITS = [
  {
    num: "01",
    title: "Un seul espace pour toute la com'",
    body: "Projets, contenus, events, stock et feedback vivent dans le même outil — fini les allers-retours entre Notion, Trello, Drive et Excel.",
  },
  {
    num: "02",
    title: "Du brief client à la tâche livrée",
    body: "Le formulaire de demandes public alimente une file de triage. Vous validez, mappez les champs, et la demande devient une carte Kanban assignée.",
  },
  {
    num: "03",
    title: "Planifier sans perdre le fil",
    body: "Rétroplanning Gantt, charge équipe, agenda avec réservation de créneaux : chacun voit ce qui est dû, quand, et par qui.",
  },
  {
    num: "04",
    title: "Produire et capitaliser",
    body: "Events (régie, matériel, budget, RETEX), social (validation + calendrier), DAM et stock PLV : la production laisse une trace réutilisable.",
  },
];

const WHY_POINTS = [
  { num: "01", text: "Tout inclus : 11 modules + IA + Outlook + alertes Slack / Teams" },
  {
    num: "02",
    text: `${PRICE_PER_SEAT_EUR} € / utilisateur / mois, minimum ${MONTHLY_FLOOR_EUR} € (jusqu’à ${FLOOR_INCLUDED_SEATS} personnes)`,
  },
  { num: "03", text: "Invitations illimitées — la facture suit le nombre de sièges actifs" },
  { num: "04", text: `Essai ${TRIAL_DAYS} jours sans carte — après, abonnement requis pour continuer` },
  { num: "05", text: "Logo, couleurs et modules : chaque espace s’adapte à votre organisation" },
];

const WORKFLOW_EXAMPLES = [
  {
    title: "Agence / service com'",
    items: [
      "Brief client via formulaire public → triage → Kanban",
      "Planning Gantt partagé avec freelances et équipe",
      "Visuels dans le DAM, posts validés avant publication",
    ],
  },
  {
    title: "Événementiel",
    items: [
      "Fiche événement, créneaux de régie et besoins matériel",
      "Réservation de stock PLV et suivi budgétaire",
      "Bilan RETEX pour capitaliser après chaque opération",
    ],
  },
  {
    title: "Direction & pilotage",
    items: [
      "OKR d’équipe reliés au quotidien opérationnel",
      "Enquêtes internes ou publiques pour mesurer la qualité",
      "Charge de travail et archives pour garder de la visibilité",
    ],
  },
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
            <a href="#avantages" className="mkt-nav-link">
              Avantages
            </a>
            <a href="#modules" className="mkt-nav-link">
              Modules
            </a>
            <a href="#tarifs" className="mkt-nav-link">
              Tarifs
            </a>
            <Link href="/pricing" className="mkt-nav-link">
              Détail
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
              <p className="mkt-hero-sub max-w-[480px] text-lg leading-relaxed text-[var(--ink-muted)]">
                Projets, demandes clients, planning, events, social, stock et feedback — tout au même
                endroit. Un abonnement, tout inclus : {PRICE_PER_SEAT_EUR}&nbsp;€ / utilisateur / mois
                (min. {MONTHLY_FLOOR_EUR}&nbsp;€).
              </p>
              <div className="mkt-hero-cta flex flex-wrap items-center gap-[18px]">
                <Link href="/signup" className="mkt-cta-primary px-8 py-[17px] text-base">
                  Lancer mon espace <span className="font-[family-name:var(--font-mono)]">→</span>
                </Link>
                <a href="#avantages" className="mkt-link-accent text-[15px] font-semibold">
                  Voir les avantages
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

        <section id="avantages" className="relative z-[5] px-6 py-[100px] sm:px-10">
          <div className="mx-auto max-w-[1280px]">
            <ScrollReveal>
              <span className="ui-kicker text-[12px] tracking-[0.18em]">N°02 — Ce que vous gagnez</span>
              <h2 className="ui-display mt-6 max-w-[820px] text-[clamp(2.2rem,4vw,3.4rem)] tracking-[-0.02em] text-[var(--ink)]">
                Remplacez la pile d&apos;outils
                <br />
                <em className="text-[var(--accent)] italic">par un vrai workflow.</em>
              </h2>
              <p className="mt-5 max-w-[560px] text-base leading-relaxed text-[var(--ink-muted)]">
                WorkSpace n&apos;est pas une to-do générique : c&apos;est l&apos;espace opérationnel des
                équipes communication, marketing et événementiel — du brief à la livraison.
              </p>
            </ScrollReveal>

            <div className="mt-14 grid grid-cols-1 gap-0 border-t border-[rgba(26,22,17,0.18)] md:grid-cols-2">
              {PRODUCT_BENEFITS.map((item, index) => (
                <ScrollReveal key={item.num} delay={index * 60}>
                  <div
                    className={[
                      "border-b border-[rgba(26,22,17,0.12)] px-0 py-8 md:px-6",
                      index % 2 === 0 ? "md:border-r md:border-[rgba(26,22,17,0.12)] md:pl-0" : "",
                    ].join(" ")}
                  >
                    <span className="font-[family-name:var(--font-mono)] text-[12px] text-[var(--accent)]">
                      {item.num}
                    </span>
                    <h3 className="ui-display mt-3 text-[1.55rem] tracking-[-0.01em] text-[var(--ink)]">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-[rgba(26,22,17,0.65)]">{item.body}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="relative z-[5] px-6 pb-[80px] sm:px-10">
          <div className="mx-auto max-w-[1280px]">
            <ScrollReveal>
              <span className="ui-kicker text-[12px] tracking-[0.18em]">N°03 — Cas d&apos;usage</span>
              <h2 className="ui-display mt-6 text-[clamp(2rem,3.5vw,2.8rem)] tracking-[-0.02em] text-[var(--ink)]">
                Conçu pour les équipes qui <em className="text-[var(--accent)] italic">exécutent</em>
              </h2>
            </ScrollReveal>
            <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
              {WORKFLOW_EXAMPLES.map((block, index) => (
                <ScrollReveal key={block.title} delay={index * 80}>
                  <div className="border-t border-[rgba(26,22,17,0.2)] pt-6">
                    <h3 className="ui-display text-xl text-[var(--ink)]">{block.title}</h3>
                    <ul className="mt-5 space-y-3">
                      {block.items.map((line) => (
                        <li
                          key={line}
                          className="flex gap-3 text-[14.5px] leading-relaxed text-[rgba(26,22,17,0.7)]"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" aria-hidden />
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section id="modules" className="relative z-[5] px-6 py-[100px] sm:px-10">
          <div className="mx-auto max-w-[1280px]">
            <div className="flex flex-wrap items-baseline justify-between gap-6">
              <h2 className="ui-display text-[clamp(2.4rem,4.5vw,3.6rem)] tracking-[-0.02em] text-[var(--ink)]">
                Onze modules.
                <br />
                <em className="text-[var(--accent)] italic">Tout inclus.</em>
              </h2>
              <p className="max-w-[400px] text-base leading-relaxed text-[var(--ink-muted)]">
                Activez ce dont vous avez besoin. Aucun module n&apos;est payant à part : l&apos;abonnement
                unique ouvre toute la plateforme.
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
                    Reformulez, résumez, recyclez des posts — et synchronisez vos échéances vers Outlook 365.
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
              <span className="ui-kicker text-[12px] tracking-[0.18em]">N°04 — Pourquoi WorkSpace</span>
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
              N°05 — C&apos;est parti
            </span>
            <h2 className="ui-display mx-auto mt-6 max-w-[760px] text-[clamp(2.6rem,5vw,4.2rem)] leading-[1.05] tracking-[-0.02em] text-[var(--background)]">
              Prêt à arrêter de <em className="text-[var(--accent-on-dark)] italic">courir partout</em> ?
            </h2>
            <p className="mx-auto mt-[22px] max-w-[520px] text-[17px] text-[rgba(246,241,231,0.6)]">
              Créez votre espace en quelques minutes, activez vos modules, invitez l&apos;équipe.{" "}
              {TRIAL_DAYS} jours pour tout tester, sans carte bancaire.
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
