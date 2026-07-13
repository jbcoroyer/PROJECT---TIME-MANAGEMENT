import Link from "next/link";
import {
  CalendarRange,
  Check,
  LayoutGrid,
  Megaphone,
  Package,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { AppMark, AppWordmark } from "../AppBrand";
import LegalFooter from "../legal/LegalFooter";
import { PLAN_MARKETING_FEATURES, TRIAL_DAYS } from "../../lib/billing/plans";

const MODULE_HIGHLIGHTS = [
  { icon: LayoutGrid, title: "Pilotage", desc: "Kanban, tâches, planning et demandes entrantes." },
  { icon: CalendarRange, title: "Événements", desc: "Salons, conférences et suivi opérationnel." },
  { icon: Megaphone, title: "Social & DAM", desc: "Publications, assets et circuit d'approbation." },
  { icon: Package, title: "Stock & idées", desc: "Inventaire PLV, alertes et boîte à suggestions." },
  { icon: Target, title: "OKR & enquêtes", desc: "Objectifs stratégiques et questionnaires." },
  { icon: Sparkles, title: "IA intégrée", desc: "Reformulation et synthèses (plan Pro)." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
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
            <Link
              href="/signup"
              className="rounded-xl bg-[var(--brand-primary)] px-3.5 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Essai gratuit
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-4 pb-16 pt-14 sm:pb-20 sm:pt-20">
          <div
            className="pointer-events-none absolute left-1/2 top-0 h-[28rem] w-[40rem] -translate-x-1/2 rounded-full opacity-[0.12] blur-3xl"
            style={{
              background: "radial-gradient(circle, var(--brand-primary) 0%, transparent 68%)",
            }}
            aria-hidden
          />
          <div className="relative mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--foreground)]/45">
              Plateforme opérationnelle modulaire
            </p>
            <h1 className="ui-display mt-4 text-4xl font-bold leading-tight text-[var(--foreground)] sm:text-5xl">
              Pilotez projets, événements et communication dans un seul espace
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[color:var(--foreground)]/65 sm:text-lg">
              Workspace réunit kanban, planning, social, stock, DAM et OKR — activables à la carte, avec
              branding par organisation. Idéal pour agences, équipes marketing et directions communication.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/signup"
                className="rounded-xl bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-2)] hover:opacity-90"
              >
                Démarrer — {TRIAL_DAYS} jours gratuits
              </Link>
              <Link
                href="/pricing"
                className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-soft)]"
              >
                Voir les tarifs
              </Link>
            </div>
            <p className="mt-4 text-xs text-[color:var(--foreground)]/45">
              Sans carte bancaire · Configuration en quelques minutes
            </p>
          </div>
        </section>

        <section className="border-y border-[var(--line)] bg-[var(--surface-soft)]/50 px-4 py-14">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-2xl font-bold text-[var(--foreground)]">
              Onze modules, une seule plateforme
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-sm text-[color:var(--foreground)]/60">
              Composez votre espace selon vos besoins — chaque client active uniquement ce qui lui sert.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MODULE_HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--brand-primary)]/10 text-[var(--brand-primary)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 font-semibold text-[var(--foreground)]">{title}</h3>
                  <p className="mt-1 text-sm text-[color:var(--foreground)]/65">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-14">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--foreground)]/70">
                <Users className="h-3.5 w-3.5" />
                Pensé pour les équipes
              </div>
              <h2 className="mt-4 text-2xl font-bold text-[var(--foreground)]">
                White-label, multi-tenant, prêt pour le B2B
              </h2>
              <ul className="mt-5 space-y-3">
                {[
                  "Branding par organisation (nom, couleur, logo)",
                  "Isolation des données par espace client",
                  "Invitations collègues par e-mail",
                  "Rôles admin et utilisateur",
                  "Facturation Stripe intégrée (Starter / Pro)",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-[color:var(--foreground)]/75">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-primary)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-2)]">
              <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--foreground)]/45">
                Offre Starter
              </p>
              <ul className="mt-4 space-y-2">
                {PLAN_MARKETING_FEATURES.starter.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[color:var(--foreground)]/80">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-primary)]" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="ui-transition mt-6 flex w-full items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
              >
                Commencer l&apos;essai gratuit
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--line)] bg-[color:var(--brand-primary)]/5 px-4 py-14">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-[var(--foreground)]">Prêt à structurer votre quotidien ?</h2>
            <p className="mt-3 text-sm text-[color:var(--foreground)]/65">
              Rejoignez Workspace et configurez votre espace en moins de 5 minutes.
            </p>
            <Link
              href="/signup"
              className="mt-6 inline-flex rounded-xl bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              Créer mon espace
            </Link>
          </div>
        </section>
      </main>

      <div className="mx-auto max-w-6xl px-4 pb-10">
        <LegalFooter />
      </div>
    </div>
  );
}
