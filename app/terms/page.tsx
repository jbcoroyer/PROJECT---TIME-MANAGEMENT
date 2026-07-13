import LegalDocument from "../../components/legal/LegalDocument";

export const metadata = {
  title: "Conditions générales d'utilisation",
};

export default function TermsPage() {
  return (
    <LegalDocument title="Conditions générales d'utilisation" lastUpdated="13 juillet 2026">
      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">1. Objet</h2>
        <p className="mt-2">
          Les présentes conditions générales d&apos;utilisation (CGU) régissent l&apos;accès et
          l&apos;utilisation de la plateforme SaaS de gestion de projet et de communication (ci-après « le
          Service »).
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">2. Acceptation</h2>
        <p className="mt-2">
          L&apos;inscription ou l&apos;utilisation du Service vaut acceptation pleine et entière des
          présentes CGU et de la{" "}
          <a href="/privacy" className="text-[var(--brand-primary)] hover:underline">
            politique de confidentialité
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">3. Description du Service</h2>
        <p className="mt-2">
          Le Service propose des outils de pilotage de projet, de communication et de collaboration au sein
          d&apos;organisations. Les fonctionnalités disponibles dépendent du plan souscrit (Gratuit, Starter,
          Pro ou essai gratuit de 14 jours).
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">4. Compte utilisateur</h2>
        <p className="mt-2">
          L&apos;utilisateur s&apos;engage à fournir des informations exactes et à maintenir la
          confidentialité de ses identifiants. Toute activité réalisée depuis son compte est réputée effectuée
          par lui.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">5. Abonnements et facturation</h2>
        <p className="mt-2">
          Les abonnements payants sont facturés mensuellement via Stripe. L&apos;essai gratuit de 14 jours donne
          accès à l&apos;ensemble des fonctionnalités. À l&apos;issue de l&apos;essai, l&apos;organisation
          bascule automatiquement sur le plan Gratuit (1 à 2 utilisateurs) sans carte bancaire. Les tarifs en
          vigueur sont consultables sur la page{" "}
          <a href="/pricing" className="text-[var(--brand-primary)] hover:underline">
            Tarifs
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">6. Obligations de l&apos;utilisateur</h2>
        <p className="mt-2">
          L&apos;utilisateur s&apos;engage à ne pas utiliser le Service à des fins illicites, à ne pas porter
          atteinte aux droits de tiers et à respecter la réglementation applicable, notamment en matière de
          protection des données personnelles.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">7. Propriété intellectuelle</h2>
        <p className="mt-2">
          Le Service et ses composants restent la propriété de l&apos;éditeur. L&apos;utilisateur conserve la
          propriété des contenus qu&apos;il importe ou crée via le Service.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">8. Responsabilité</h2>
        <p className="mt-2">
          Le Service est fourni « en l&apos;état ». L&apos;éditeur s&apos;efforce d&apos;assurer une
          disponibilité optimale mais ne garantit pas l&apos;absence d&apos;interruptions. La responsabilité de
          l&apos;éditeur est limitée aux dommages directs prévisibles.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">9. Résiliation</h2>
        <p className="mt-2">
          L&apos;utilisateur peut résilier son abonnement à tout moment via le portail de facturation Stripe.
          L&apos;éditeur peut suspendre ou résilier l&apos;accès en cas de violation des présentes CGU.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">10. Droit applicable</h2>
        <p className="mt-2">
          Les présentes CGU sont soumises au droit français. Tout litige relève de la compétence des
          tribunaux français.
        </p>
      </section>
    </LegalDocument>
  );
}
