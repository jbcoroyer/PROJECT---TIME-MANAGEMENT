import LegalDocument from "../../components/legal/LegalDocument";
import { LEGAL_COMPANY } from "../../lib/legal/company";

export const metadata = {
  title: "Mentions légales",
};

export default function LegalPage() {
  const c = LEGAL_COMPANY;

  return (
    <LegalDocument title="Mentions légales" lastUpdated="23 juillet 2026">
      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Éditeur du site</h2>
        <p className="mt-2">
          {c.name}
          {c.tradeName ? (
            <>
              <br />
              Enseigne : {c.tradeName}
            </>
          ) : null}
          {c.productName ? (
            <>
              <br />
              Produit : {c.productName}
            </>
          ) : null}
          {c.address ? (
            <>
              <br />
              Adresse : {c.address}
            </>
          ) : null}
          {c.siret ? (
            <>
              <br />
              SIRET : {c.siret}
            </>
          ) : null}
          {c.apeCode ? (
            <>
              <br />
              Code APE : {c.apeCode}
            </>
          ) : null}
          <br />
          {c.vatExempt ? c.vat : <>TVA intracommunautaire : {c.vat}</>}
          <br />
          Directeur de la publication : {c.publisher}
          {c.contactEmail ? (
            <>
              <br />
              Contact :{" "}
              <a href={`mailto:${c.contactEmail}`} className="text-[var(--brand-primary)] hover:underline">
                {c.contactEmail}
              </a>
            </>
          ) : null}
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Hébergement</h2>
        <p className="mt-2">
          {c.hostingProvider}
          {c.hostingProviderAddress ? (
            <>
              <br />
              {c.hostingProviderAddress}
            </>
          ) : null}
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
          .
          {c.dpoEmail ? (
            <>
              {" "}
              Conformément au RGPD, vous pouvez exercer vos droits en nous contactant à{" "}
              <a href={`mailto:${c.dpoEmail}`} className="text-[var(--brand-primary)] hover:underline">
                {c.dpoEmail}
              </a>
              .
            </>
          ) : null}
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
