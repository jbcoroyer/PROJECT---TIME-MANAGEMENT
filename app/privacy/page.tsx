import LegalDocument from "../../components/legal/LegalDocument";
import { LEGAL_COMPANY } from "../../lib/legal/company";

export const metadata = {
  title: "Politique de confidentialité",
};

export default function PrivacyPage() {
  return (
    <LegalDocument title="Politique de confidentialité" lastUpdated="13 juillet 2026">
      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">1. Responsable du traitement</h2>
        <p className="mt-2">
          Le responsable du traitement est {LEGAL_COMPANY.name}, {LEGAL_COMPANY.address}. Contact RGPD :{" "}
          <a
            href={`mailto:${LEGAL_COMPANY.dpoEmail}`}
            className="text-[var(--brand-primary)] hover:underline"
          >
            {LEGAL_COMPANY.dpoEmail}
          </a>
          . Informations complètes dans les{" "}
          <a href="/legal" className="text-[var(--brand-primary)] hover:underline">
            mentions légales
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">2. Données collectées</h2>
        <p className="mt-2">Nous collectons les catégories de données suivantes :</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Données d&apos;identification : nom, prénom, adresse e-mail, photo de profil</li>
          <li>Données professionnelles : organisation, fonction, contenus créés dans l&apos;application</li>
          <li>Données techniques : logs de connexion, adresse IP, cookies de session</li>
          <li>Données de facturation : transmises à Stripe pour la gestion des abonnements</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">3. Finalités et bases légales</h2>
        <p className="mt-2">
          Les données sont traitées pour fournir le service (exécution du contrat), assurer la sécurité
          (intérêt légitime), respecter nos obligations légales et, le cas échéant, avec votre consentement
          (cookies non essentiels).
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">4. Durée de conservation</h2>
        <p className="mt-2">
          Les données de compte sont conservées pendant la durée de la relation contractuelle, puis
          archivées conformément aux obligations légales. Les logs techniques sont conservés 12 mois maximum.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">5. Sous-traitants</h2>
        <p className="mt-2">
          Nous faisons appel à des sous-traitants conformes au RGPD : Supabase (hébergement base de données),
          Vercel (hébergement application), Stripe (paiement). Certains traitements IA peuvent transiter par
          OpenRouter lorsque cette fonctionnalité est activée.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">6. Vos droits</h2>
        <p className="mt-2">
          Conformément au RGPD, vous disposez des droits d&apos;accès, de rectification, d&apos;effacement,
          de limitation, de portabilité et d&apos;opposition. Pour exercer vos droits, contactez-nous via
          l&apos;adresse indiquée dans les mentions légales. Vous pouvez également introduire une réclamation
          auprès de la CNIL (www.cnil.fr).
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">7. Cookies</h2>
        <p className="mt-2">
          Des cookies strictement nécessaires assurent l&apos;authentification et le bon fonctionnement du
          service. D&apos;autres cookies (mesure d&apos;audience) ne sont déposés qu&apos;avec votre
          consentement, modifiable à tout moment via la bannière cookies.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">8. Transferts hors UE</h2>
        <p className="mt-2">
          Certains sous-traitants peuvent être situés hors de l&apos;Union européenne. Dans ce cas, des
          garanties appropriées (clauses contractuelles types) sont mises en place.
        </p>
      </section>
    </LegalDocument>
  );
}
