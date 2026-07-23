import LegalDocument from "../../components/legal/LegalDocument";
import { LEGAL_COMPANY } from "../../lib/legal/company";
import { PRODUCTION_APP_URL } from "../../lib/config/deployment";

export const metadata = {
  title: "Sécurité & conformité",
};

export default function SecurityPage() {
  const c = LEGAL_COMPANY;

  return (
    <LegalDocument title="Sécurité & conformité" lastUpdated="21 juillet 2026">
      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Hébergement et localisation des données
        </h2>
        <p className="mt-2">
          Cette page décrit les mesures techniques effectivement présentes dans le code de
          l&apos;application à la date indiquée. Elle ne constitue pas une certification ni une
          garantie contractuelle au-delà de ce qui est documenté ci-dessous.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--line)]">
                <th className="py-2 pr-3 font-semibold text-[var(--foreground)]">Sous-traitant</th>
                <th className="py-2 pr-3 font-semibold text-[var(--foreground)]">Données concernées</th>
                <th className="py-2 pr-3 font-semibold text-[var(--foreground)]">Région constatée</th>
                <th className="py-2 font-semibold text-[var(--foreground)]">Configurable</th>
              </tr>
            </thead>
            <tbody className="text-[color:var(--foreground)]/75">
              <tr className="border-b border-[var(--line)]">
                <td className="py-2 pr-3 align-top font-medium">Supabase</td>
                <td className="py-2 pr-3 align-top">
                  Authentification, base PostgreSQL, fichiers Storage, temps réel (WebSocket)
                </td>
                <td className="py-2 pr-3 align-top">
                  Région du projet Supabase lié à <code>NEXT_PUBLIC_SUPABASE_URL</code> (non
                  forcée dans le code)
                </td>
                <td className="py-2 align-top">Choix du projet Supabase à la création</td>
              </tr>
              <tr className="border-b border-[var(--line)]">
                <td className="py-2 pr-3 align-top font-medium">Vercel</td>
                <td className="py-2 pr-3 align-top">
                  Exécution des fonctions serverless, logs de déploiement, cron interne
                </td>
                <td className="py-2 pr-3 align-top">
                  <code>cdg1</code> (Paris) et <code>fra1</code> (Francfort) via{" "}
                  <code>vercel.json</code>
                </td>
                <td className="py-2 align-top">Oui — <code>regions</code> dans vercel.json</td>
              </tr>
              <tr className="border-b border-[var(--line)]">
                <td className="py-2 pr-3 align-top font-medium">Vercel Analytics</td>
                <td className="py-2 pr-3 align-top">Pages vues, métriques Web Vitals</td>
                <td className="py-2 pr-3 align-top">
                  États-Unis (infrastructure Vercel) — non forcée en Europe dans le code
                </td>
                <td className="py-2 align-top">Non</td>
              </tr>
              <tr className="border-b border-[var(--line)]">
                <td className="py-2 pr-3 align-top font-medium">Stripe</td>
                <td className="py-2 pr-3 align-top">
                  Identifiants client, abonnements, événements de facturation
                </td>
                <td className="py-2 pr-3 align-top">
                  États-Unis (Stripe Inc.) — non forcée en Europe dans le code
                </td>
                <td className="py-2 align-top">Compte Stripe / clés API uniquement</td>
              </tr>
              <tr className="border-b border-[var(--line)]">
                <td className="py-2 pr-3 align-top font-medium">Sentry</td>
                <td className="py-2 pr-3 align-top">
                  Traces d&apos;erreurs, contexte requête (chemin, méthode)
                </td>
                <td className="py-2 pr-3 align-top">
                  Union européenne si le DSN utilise <code>*.ingest.de.sentry.io</code>
                </td>
                <td className="py-2 align-top">Oui — <code>SENTRY_DSN</code></td>
              </tr>
              <tr className="border-b border-[var(--line)]">
                <td className="py-2 pr-3 align-top font-medium">Resend</td>
                <td className="py-2 pr-3 align-top">
                  Adresses e-mail, objet et corps HTML (invitations, bienvenue, rappels essai)
                </td>
                <td className="py-2 pr-3 align-top">
                  États-Unis (api.resend.com) — non forcée en Europe dans le code
                </td>
                <td className="py-2 align-top">Non</td>
              </tr>
              <tr className="border-b border-[var(--line)]">
                <td className="py-2 pr-3 align-top font-medium">OpenRouter</td>
                <td className="py-2 pr-3 align-top">
                  Contenus métier envoyés aux fonctions IA (repurposing social, synthèses)
                </td>
                <td className="py-2 pr-3 align-top">
                  Dépend du modèle ; défaut Mistral (éditeur UE). Désactivable via{" "}
                  <code>AI_ENABLED=false</code>
                </td>
                <td className="py-2 align-top">
                  Oui — <code>OPENROUTER_MODEL</code>, <code>AI_ENABLED</code>
                </td>
              </tr>
              <tr className="border-b border-[var(--line)]">
                <td className="py-2 pr-3 align-top font-medium">Microsoft Graph</td>
                <td className="py-2 pr-3 align-top">
                  Jetons OAuth chiffrés localement, événements calendrier synchronisés (titre,
                  description, créneaux)
                </td>
                <td className="py-2 pr-3 align-top">
                  Infrastructure Microsoft globale — non forcée en Europe dans le code
                </td>
                <td className="py-2 align-top">
                  Partiel — <code>MS_TENANT_ID</code>, identifiants OAuth
                </td>
              </tr>
              <tr className="border-b border-[var(--line)]">
                <td className="py-2 pr-3 align-top font-medium">Slack / Teams</td>
                <td className="py-2 pr-3 align-top">
                  Alertes stock (nom article, quantité restante)
                </td>
                <td className="py-2 pr-3 align-top">
                  Déterminée par l&apos;URL du webhook — non forcée en Europe dans le code
                </td>
                <td className="py-2 align-top">Oui — <code>SLACK_WEBHOOK_URL</code></td>
              </tr>
              <tr>
                <td className="py-2 pr-3 align-top font-medium">Google (via Supabase Auth)</td>
                <td className="py-2 pr-3 align-top">
                  Authentification OAuth (e-mail, profil) — déléguée à Supabase Auth
                </td>
                <td className="py-2 pr-3 align-top">
                  Dépend de la configuration Supabase — non forcée dans le code applicatif
                </td>
                <td className="py-2 align-top">Dashboard Supabase</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[color:var(--foreground)]/60">
          URL de production documentée :{" "}
          <a
            href={PRODUCTION_APP_URL}
            className="text-[var(--brand-primary)] hover:underline"
          >
            {PRODUCTION_APP_URL}
          </a>
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Isolation des données entre organisations
        </h2>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>
            <strong>PostgreSQL — RLS :</strong> les tables métier utilisent le Row Level Security
            avec des policies basées sur <code>organization_id = current_org_id()</code> et le
            déclencheur <code>enforce_row_organization_id()</code> qui empêche l&apos;insertion ou
            la modification hors organisation.
          </li>
          <li>
            <strong>Storage :</strong> les fichiers sont stockés sous un chemin préfixé par
            l&apos;identifiant d&apos;organisation (<code>{"{organizationId}/…"}</code>). Les buckets
            concernés incluent avatars, logos, documents événements, visuels sociaux et stock.
          </li>
          <li>
            <strong>URLs signées :</strong> l&apos;accès aux fichiers sensibles passe par des URLs
            signées à durée limitée (5 minutes par défaut), générées côté serveur après vérification
            de l&apos;appartenance à l&apos;organisation.
          </li>
          <li>
            <strong>Upload serveur :</strong> les envois de fichiers passent par une action serveur
            qui vérifie le contexte organisation avant d&apos;utiliser le rôle service.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Sécurité applicative</h2>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>
            <strong>CSP (enforcing) :</strong> politique de sécurité du contenu active dans{" "}
            <code>next.config.ts</code>, limitant les domaines autorisés (self, Supabase, OpenRouter,
            Microsoft, Vercel Analytics, Sentry EU/US).
          </li>
          <li>
            <strong>HSTS :</strong> en-tête <code>Strict-Transport-Security</code> avec{" "}
            <code>includeSubDomains</code> et <code>preload</code>.
          </li>
          <li>
            <strong>Autres en-têtes :</strong> <code>X-Frame-Options: DENY</code>,{" "}
            <code>X-Content-Type-Options: nosniff</code>,{" "}
            <code>Referrer-Policy: strict-origin-when-cross-origin</code>.
          </li>
          <li>
            <strong>Chiffrement en transit :</strong> HTTPS obligatoire (TLS) pour toutes les
            communications client-serveur et vers les API tierces listées ci-dessus.
          </li>
          <li>
            <strong>Chiffrement au repos :</strong> géré par Supabase (PostgreSQL et Storage) et
            Vercel selon leurs politiques d&apos;hébergement respectives.
          </li>
          <li>
            <strong>Authentification :</strong> Supabase Auth (e-mail / mot de passe, magic links)
            avec connexion Google OAuth via Supabase. Les jetons Outlook sont chiffrés avant stockage
            (<code>OUTLOOK_TOKEN_ENCRYPTION_KEY</code>).
          </li>
          <li>
            <strong>Limitation de débit :</strong> les routes API sensibles (dont l&apos;IA) sont
            soumises à un rate limiting par utilisateur.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Sauvegardes et continuité
        </h2>
        <p className="mt-2 text-[color:var(--foreground)]/60">
          TODO — À compléter manuellement : fréquence des sauvegardes Supabase, rétention, procédure
          de restauration validée et contacts d&apos;escalade en cas d&apos;incident.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Vos droits RGPD</h2>
        <p className="mt-2">
          Conformément au Règlement général sur la protection des données (RGPD), vous disposez des
          droits d&apos;accès, de rectification, d&apos;effacement, de limitation, d&apos;opposition
          et de portabilité sur vos données personnelles.
        </p>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>
            <strong>Export :</strong> contactez-nous pour obtenir une copie structurée de vos
            données.
          </li>
          <li>
            <strong>Suppression :</strong> vous pouvez demander la suppression de votre compte et des
            données associées, sous réserve des obligations légales de conservation.
          </li>
          <li>
            <strong>DPA (accord de sous-traitance) :</strong> disponible sur demande pour les
            clients B2B — écrivez à{" "}
            <a href={`mailto:${c.dpoEmail}`} className="text-[var(--brand-primary)] hover:underline">
              {c.dpoEmail}
            </a>
            .
          </li>
        </ul>
        <p className="mt-2">
          Pour plus de détails sur les finalités et bases légales, consultez notre{" "}
          <a href="/privacy" className="text-[var(--brand-primary)] hover:underline">
            politique de confidentialité
          </a>
          .
        </p>
      </section>
    </LegalDocument>
  );
}
