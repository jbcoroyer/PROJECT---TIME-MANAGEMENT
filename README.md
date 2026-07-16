# Workspace — Gestion de projet & communication

Application **SaaS multi-tenant** pour piloter une équipe : Kanban, événements, réseaux sociaux, stock, DAM, OKR et questionnaires. Chaque inscription crée une **organisation isolée** (données, branding, modules) dans la même instance.

**Production :** [project-time-management.vercel.app](https://project-time-management.vercel.app)  
**Dépôt :** [github.com/jbcoroyer/PROJECT---TIME-MANAGEMENT](https://github.com/jbcoroyer/PROJECT---TIME-MANAGEMENT)

---

## Modules

Activables par organisation à l’onboarding (`/setup`) ou dans **Paramètres → Modules**. Seuls les modules choisis apparaissent dans la navigation.

| Module | Route | Description |
|--------|-------|-------------|
| Tableau de bord | `/dashboard/*` | Kanban, inbox, liste, to-do, calendrier, analytics, charge, archives |
| Mon espace | `/todo` | Agenda du jour, suggestions IA |
| Demandes | `/asks` | Espace demandes, triage (`/asks/triage`) |
| Planning | `/planning` | Semaine, mois, timeline, charge |
| Événements | `/events/*` | Événements, budget, run-of-show, RETEX |
| Réseaux sociaux | `/social` | Calendrier éditorial, stats LinkedIn, repurposing IA |
| DAM | `/dam` | Bibliothèque d’assets (logos, visuels, tags) |
| Stock | `/stock/*` | Impressions, PLV, goodies, alertes Slack |
| Boîte à idées | `/ideas` | Soumission publique ou interne, votes |
| OKR | `/okr` | Objectifs et résultats clés |
| Questionnaires | `/questionnaire/reponses` | Création, diffusion, analyse (admin) |
| Paramètres | `/settings` | Équipe, entités, taxonomies, branding, facturation |

---

## Pages publiques (sans compte)

| Route | Usage |
|-------|-------|
| `/` | Landing marketing |
| `/pricing` | Tarifs (abonnement unique au siège) |
| `/login`, `/signup` | Authentification (email + Google OAuth) |
| `/ideas` | Boîte à idées publique |
| `/questionnaire`, `/questionnaire/f/[id]` | Formulaires de satisfaction |
| `/privacy`, `/terms`, `/legal` | Mentions légales |

Routes protégées supplémentaires : `/setup` (onboarding), `/billing`, `/invite/accept`, `/platform` (super-admin).

---

## Démarrage rapide

### Prérequis

- **Node.js 22+** (aligné sur la CI)
- Projet [Supabase](https://supabase.com) (PostgreSQL, Auth, Storage, Realtime)

### Installation

```bash
git clone https://github.com/jbcoroyer/PROJECT---TIME-MANAGEMENT.git
cd PROJECT---TIME-MANAGEMENT
npm install
cp .env.example .env.local
# Renseigner NEXT_PUBLIC_SUPABASE_* et SUPABASE_SERVICE_ROLE_KEY
npx supabase link --project-ref <votre-ref>
npx supabase db push
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

### Variables d’environnement

**Obligatoires :**

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique (anon) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service (serveur uniquement) |
| `NEXT_PUBLIC_APP_URL` | URL publique (`http://localhost:3000` en local) |

**Optionnelles** (liste complète dans `.env.example`) :

| Variable | Usage |
|----------|-------|
| `OPENROUTER_API_KEY` | Assistant IA |
| `MS_*` | Sync calendrier Outlook 365 |
| `SLACK_WEBHOOK_URL` | Alertes stock |
| `STRIPE_*` | Facturation SaaS |
| `CRON_SECRET` | Cron essai expiré (Vercel) |
| `RESEND_*` | E-mails transactionnels |
| `PLATFORM_ADMIN_EMAILS` | Accès `/platform` |
| `SENTRY_DSN` | Monitoring |
| `BILLING_ENFORCEMENT` | `true` → blocage sans abonnement actif |

Branding par défaut (avant `/setup`) :

```env
NEXT_PUBLIC_APP_NAME=Workspace
NEXT_PUBLIC_APP_MARK_SRC=/app-mark.svg
NEXT_PUBLIC_APP_PRIMARY_COLOR=#c25e2a
NEXT_PUBLIC_APP_LOCALE=fr
```

---

## Parcours utilisateur

1. **`/signup`** — Crée le compte, l’organisation et le profil admin (trigger `handle_new_user`).
2. **`/setup`** — 4 étapes : organisation, apparence, modules, réglages régionaux.
3. **Application** — Redirection vers le module par défaut selon les modules activés.
4. **`/login`** — Connexion email ou Google OAuth.

**Invitations équipe :** un admin invite par e-mail → le membre arrive sur `/invite/accept`.

---

## Facturation (Stripe)

| Offre | Détail |
|------|--------|
| **Essai** | 14 jours, tout inclus, sans carte bancaire |
| **Abonnement unique** | 2 € / utilisateur / mois, minimum 10 €/mois (jusqu’à 5 sièges) |
| **Au-delà de 5** | 2 € × nombre de membres actifs |
| **Inclus** | Les 11 modules, IA, Outlook, Slack/Teams |

Après l’essai : un abonnement actif est **requis** (plus de plan Gratuit).

- Checkout : Paramètres → Facturation ou `/pricing`
- Webhook : `POST /api/webhooks/stripe`
- Blocage post-essai : `/billing` si `BILLING_ENFORCEMENT=true`
- Variable prix : `STRIPE_PRICE_SINGLE_PLAN`

Guide Stripe local : [docs/TEST_STRIPE_WEBHOOK.md](docs/TEST_STRIPE_WEBHOOK.md)

---

## Migrations Supabase

Les **46** fichiers dans `supabase/migrations/` s’appliquent **dans l’ordre chronologique** :

```bash
npx supabase db push
```

Migrations récentes (session juillet 2026) :

| Fichier | Contenu |
|---------|---------|
| `20260715130000_modular_boards_foundation.sql` | Boards connectés, colonnes, champs custom |
| `20260715140000_board_fields_relation_type.sql` | Type `relation` + Realtime `board_fields` |
| `20260715150000_seed_board_on_signup.sql` | Board par défaut à l'inscription |
| `20260715160000_intake_forms.sql` | Table `intake_forms`, lien `intake_requests` |
| `20260715170000_intake_forms_definition.sql` | Colonne `definition` JSON éditable |
| `20260715180000_survey_definitions_rls_fix.sql` | RLS org-only sur `survey_definitions` |
| `20260715190000_agenda_module.sql` | Agenda : RDV, notes, booking public |
| `20260715193000_event_cover_image.sql` | Image de couverture par événement |
| `20260715194000_session_features_verify.sql` | Vérification idempotente + Realtime agenda |

> **Important :** ne supprimez pas de fichiers de migration déjà appliqués en production — l’historique Supabase doit rester cohérent. Les migrations « fix » (`*_fix.sql`) corrigent des étapes précédentes et restent nécessaires pour les nouvelles installations.

Storage multi-tenant : les chemins sont préfixés par `{organization_id}/`. Vérification : `npm run audit:storage`.

---

## Stack & scripts

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 16 (App Router), `proxy.ts` pour l’auth |
| UI | React 19, Tailwind CSS 4, direction visuelle « Atelier » |
| Données | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| Paiements | Stripe |
| Tests | Vitest + Playwright (e2e smoke) |
| Déploiement | Vercel |

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build production |
| `npm test` | Tests unitaires Vitest |
| `npm run test:e2e` | Smoke tests Playwright |
| `npm run test:multi-tenant` | Tests isolation RLS (projet Supabase de test requis) |
| `npm run lint` | ESLint |
| `npm run audit:storage` | Audit chemins Storage |

---

## Structure du projet

```
app/
  (workspace)/       # Routes authentifiées
  actions/           # Server Actions
  api/               # Routes API (Stripe, Outlook, IA, cron…)
  auth/callback/     # Échange PKCE OAuth / liens email
  billing/, pricing/ # Facturation et tarifs publics
  login/, signup/    # Auth
  setup/             # Onboarding
components/
  marketing/         # Landing, pricing (style Atelier)
  v2/                # Shell applicatif et pages modules
  setup/, billing/   # Onboarding et facturation
lib/
  billing/           # Plans, essai, enforcement
  i18n/              # Traductions fr / en
  modules/           # Catalogue des modules
  multiTenant/       # Tests d'isolation RLS
  server/            # Code serveur (email, Outlook, billing…)
supabase/migrations/ # Schéma PostgreSQL versionné
docs/
  DEPLOYMENT.md      # Guide Vercel complet
  TEST_STRIPE_WEBHOOK.md
proxy.ts             # Middleware auth Next.js 16
```

---

## Déploiement

Guide complet : **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**

Résumé :

1. Importer le dépôt sur Vercel
2. Copier les variables depuis `.env.example`
3. `NEXT_PUBLIC_APP_URL` = URL de production
4. Supabase → Authentication : ajouter `{APP_URL}/auth/callback` dans les Redirect URLs (+ localhost en dev)
5. Configurer Google OAuth, Stripe webhook, cron `CRON_SECRET`
6. Redéployer après chaque changement de variables

**Outlook 365 :** callback `{APP_URL}/api/outlook/callback`, permission `MailboxSettings.ReadWrite`.

---

## Notes techniques

- **Multi-tenant :** table `organizations`, colonne `organization_id`, isolation RLS.
- **i18n :** fr / en via `app_settings.locale` et `lib/i18n/`.
- **Bucket Storage** pictogramme : `idena-mark` (nom historique).
- **Alias rétro-compat :** `idena_mark_url` → `mark_url`, clés localStorage `idena-*` migrées automatiquement.
- **Table `proofs` :** schéma présent en base (épreuves créatives), module UI non implémenté.

---

## Licence

Projet privé — usage selon les conditions de votre organisation.
