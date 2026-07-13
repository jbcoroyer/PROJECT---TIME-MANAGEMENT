import LegalDocument from "../../components/legal/LegalDocument";
import { LEGAL_COMPANY } from "../../lib/legal/company";

export const metadata = {
  title: "Mentions légales",
};

export default function LegalPage() {
  const c = LEGAL_COMPANY;

  return (
    <LegalDocument title="Mentions légales" lastUpdated="13 juillet 2026">
      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Éditeur du site</h2>
        <p className="mt-2">
          {c.name}
          <br />
          {c.legalForm} au capital de {c.capital} €
          <br />
          Siège social : {c.address}
          <br />
          RCS : {c.rcs}
          <br />
          SIRET : {c.siret}
          <br />
          TVA intracommunautaire : {c.vat}
          <br />
          Directeur de la publication : {c.publisher}
          <br />
          Contact :{" "}
          <a href={`mailto:${c.contactEmail}`} className="text-[var(--brand-primary)] hover:underline">
            {c.contactEmail}
          </a>
        </p>
        <p className="mt-2 text-[color:var(--foreground)]/60">
          Informations fictives à titre de démonstration — à remplacer par les données réelles de votre
          société avant tout lancement commercial.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Hébergement</h2>
        <p className="mt-2">
          Vercel Inc.
          <br />
          440 N Barranca Ave #4133, Covina, CA 91723, États-Unis
          <br />
          Site : vercel.com
        </p>
        <p className="mt-2">
          Base de données : Supabase Inc.
          <br />
          Site : supabase.com
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Propriété intellectuelle</h2>
        <p className="mt-2">
          L&apos;ensemble des éléments composant le Service (textes, graphismes, logiciels, marques) est
          protégé par le droit de la propriété intellectuelle. Toute reproduction non autorisée est interdite.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Données personnelles</h2>
        <p className="mt-2">
          Le traitement des données personnelles est décrit dans notre{" "}
          <a href="/privacy" className="text-[var(--brand-primary)] hover:underline">
            politique de confidentialité
          </a>
          . Conformément au RGPD, vous pouvez exercer vos droits en nous contactant à{" "}
          <a href={`mailto:${c.dpoEmail}`} className="text-[var(--brand-primary)] hover:underline">
            {c.dpoEmail}
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Cookies</h2>
        <p className="mt-2">
          Ce site utilise des cookies. Pour en savoir plus, consultez notre politique de confidentialité et
          gérez vos préférences via la bannière cookies affichée lors de votre première visite.
        </p>
      </section>
    </LegalDocument>
  );
}
