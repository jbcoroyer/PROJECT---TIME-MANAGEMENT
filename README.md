# Workspace — Gestion de projet & communication

Application web **SaaS multi-tenant** de pilotage d'équipe : gestion de projet, événements, réseaux sociaux, stock, DAM, OKR et questionnaires. Chaque inscription crée une **organisation isolée** (données, branding, modules activés) au sein d'une même instance déployée.

**Dépôt :** [github.com/jbcoroyer/PROJECT---TIME-MANAGEMENT](https://github.com/jbcoroyer/PROJECT---TIME-MANAGEMENT)

---

## Fonctionnalités principales

Les modules sont **activables par organisation** à l'onboarding ou dans les paramètres. Seuls les modules choisis apparaissent dans la navigation.

| Module | Route | Description |
|---|---|---|
| **Tableau de bord** | `/dashboard/*` | Kanban, inbox, liste, to-do, calendrier, analytics, charge, archives |
| **Mon espace** | `/todo` | Agenda du jour, suggestions IA |
| **Demandes** | `/asks` | Formulaire de demandes entrantes, triage (`/dashboard/triage`) |
| **Planning** | `/planning` | Vues semaine, mois, timeline et charge |
| **Événements** | `/events/*` | Salons, budget, tâches, run-of-show, RETEX |
| **Réseaux sociaux** | `/social` | Calendrier éditorial, posts, stats LinkedIn, repurposing IA |
| **DAM** | `/dam` | Bibliothèque d'assets multi-marques (logos, visuels, tags) |
| **Stock** | `/stock/*` | Impressions, PLV, goodies, alertes Slack |
| **Boîte à idées** | `/ideas` | Soumission publique ou interne, votes |
| **OKR** | `/okr` | Objectifs et résultats clés reliés aux tâches |
| **Questionnaires** | `/questionnaire/reponses` | Création, diffusion, analyse des réponses (admin) |
| **Paramètres** | `/settings` | Équipe, entités, domaines, colonnes, taxonomies, modules, branding, facturation |

---

## Architecture

- **Multi-tenant** : table `organizations`, colonne `organization_id` sur les données métier, isolation via **RLS** Supabase.
- **Inscription B2C** : `/signup` crée le compte, l'organisation et le profil administrateur (trigger `handle_new_user`).
- **Onboarding** : `/setup` configure le branding, les modules et les préférences régionales.
- **Facturation** (optionnelle) : essai gratuit de 14 jours, plan Gratuit (1 à 2 utilisateurs), abonnements Starter / Pro via Stripe.

---

## Installation (développeur)

### 1. Prérequis

- Node.js 20+
- Un projet [Supabase](https://supabase.com) (PostgreSQL, Auth, Storage, Realtime)

### 2. Cloner et installer

```bash
git clone https://github.com/jbcoroyer/PROJECT---TIME-MANAGEMENT.git
cd PROJECT---TIME-MANAGEMENT
npm install
```

### 3. Variables d'environnement

Copiez le modèle et renseignez vos clés :

```bash
cp .env.example .env.local
```

Variables **obligatoires** :

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique (anon) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service (serveur uniquement) |
| `NEXT_PUBLIC_APP_URL` | URL publique de l'app (ex. `http://localhost:3000`) |

Variables **optionnelles** (voir `.env.example` pour la liste complète) :

| Variable | Usage |
|---|---|
| `OPENROUTER_API_KEY` | Génération IA (suggestions, repurposing social) |
| `NEXT_PUBLIC_LINKEDIN_COMPANY_URL` | Statistiques followers LinkedIn |
| `MS_*` | Synchronisation calendrier Outlook 365 |
| `SLACK_WEBHOOK_URL` | Alertes stock |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*` | Facturation SaaS |
| `BILLING_ENFORCEMENT` | `true` pour bloquer l'accès sans abonnement actif (redirige vers `/billing`) |

### 4. Migrations Supabase

Appliquez les fichiers SQL dans `supabase/migrations/` dans l'ordre chronologique :

```bash
npx supabase link --project-ref <votre-ref>
npx supabase db push
```

> Les policies Storage (`storage.objects`) nécessitent le **session pooler** sur Supabase hébergé :
> `npx supabase db query --linked -f supabase/migrations/20260711000000_storage_org_isolation.sql`

La migration `20260520000000_initial_base_schema.sql` crée le schéma de base ; les migrations suivantes ajoutent le multi-tenant, les modules, le DAM, les OKR, la facturation Stripe, etc.

### 5. Lancer l'application

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

---

## Parcours utilisateur

### Inscription

1. Rendez-vous sur `/signup`.
2. Renseignez le nom de l'organisation, vos coordonnées et vos identifiants.
3. Un espace personnel est créé automatiquement ; vous en êtes administrateur.

### Assistant d'installation (`/setup`)

Après la première connexion, l'assistant guide en **4 étapes** :

1. **Votre organisation** — nom et slogan
2. **Apparence** — couleur principale et pictogramme
3. **Vos modules** — sélection des modules à activer
4. **Derniers réglages** — langue, fuseau horaire, secteur d'activité

Une fois terminé, l'application est marquée comme configurée (`is_configured = true`) et vous êtes redirigé vers le module par défaut.

### Connexion ultérieure

- `/login` ou `/` pour les utilisateurs existants.
- Affinage possible dans **Paramètres** : entités, taxonomies, modules, identité visuelle, facturation.

---

## Personnalisation par organisation

| Élément | Où le configurer |
|---|---|
| Nom, slogan, couleur, pictogramme | `/setup` ou Paramètres → Identité visuelle |
| Modules activés | `/setup` ou Paramètres → Modules |
| Langue (fr / en) | `/setup` ou Paramètres → Identité visuelle |
| Entités / sociétés | Paramètres → Entités |
| Thématiques social & catégories print | Paramètres → Taxonomies |
| Équipe, domaines, colonnes Kanban | Paramètres |

Variables d'environnement de secours (avant configuration en base) :

```env
NEXT_PUBLIC_APP_NAME=Mon équipe
NEXT_PUBLIC_APP_MARK_SRC=/app-mark.svg
NEXT_PUBLIC_APP_PRIMARY_COLOR=#2563eb
NEXT_PUBLIC_APP_LOCALE=fr
```

---

## Facturation (Stripe)

- Chaque organisation démarre en **essai gratuit** (14 jours).
- Après l'essai : plan **Gratuit** (1 à 2 utilisateurs, modules essentiels).
- Abonnements **Starter** et **Pro** via Stripe Checkout.
- Webhook : `POST /api/webhooks/stripe`.
- Page de blocage : `/billing` (si `BILLING_ENFORCEMENT=true` et abonnement payant inactif).
- Gestion de l'abonnement : Paramètres → Facturation.

---

## Internationalisation (i18n)

Langues supportées : **français** et **anglais**.

- La langue est stockée dans `app_settings.locale`.
- Écrans traduits : connexion, inscription, assistant d'installation, catalogue de modules, messages communs.
- Le reste de l'interface reste majoritairement en français ; les clés de traduction sont dans `lib/i18n/messages/`.

Pour ajouter une traduction dans un composant client :

```tsx
import { useTranslation } from "@/lib/i18n/useTranslation";

const { t, locale } = useTranslation();
return <button>{t("common.save")}</button>;
```

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| Données | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| Formulaires | React Hook Form + Zod |
| Paiements | Stripe |
| Tests | Vitest |
| Déploiement | Vercel (recommandé) |

---

## Scripts utiles

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run start` | Serveur de production |
| `npm test` | Tests Vitest |
| `npm run test:multi-tenant` | Tests d'isolation multi-tenant (projet Supabase de test requis) |
| `npm run lint` | ESLint |
| `npm run audit:storage` | Vérifie que les chemins Storage sont préfixés par `organization_id` |

---

## Déploiement sur Vercel

**Production :** [https://project-time-management.vercel.app](https://project-time-management.vercel.app)

Guide complet (variables, Google OAuth, Stripe, Outlook, cron) : **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**

Résumé :

1. Importer le dépôt sur [Vercel](https://vercel.com) → projet `project-time-management`
2. Copier les variables depuis `.env.example` / `.env.local` (voir checklist dans `docs/DEPLOYMENT.md`)
3. **`NEXT_PUBLIC_APP_URL`** en production : `https://project-time-management.vercel.app`
4. Configurer Supabase (URLs + provider Google)
5. Webhook Stripe : `https://project-time-management.vercel.app/api/webhooks/stripe`
6. Redéployer après chaque changement de variables

### Outlook 365

Variables `MS_*` sur Vercel. URI de redirection Azure :

`https://project-time-management.vercel.app/api/outlook/callback`

Permission déléguée requise : `MailboxSettings.ReadWrite` (catégorie colorée dans Outlook).

---

## Structure du projet

```
app/
  (workspace)/          # Routes authentifiées (dashboard, stock, events…)
  actions/              # Server Actions (auth, setup, storage…)
  api/                  # Routes API (Outlook, IA, stock, Stripe…)
  billing/              # Page abonnement requis
  login/, signup/       # Authentification
  setup/                # Assistant première installation
  questionnaire/        # Formulaires publics et back-office réponses
components/
  v2/                   # Composants UI principaux (nom historique interne)
  setup/                # Assistant d'onboarding
  billing/              # Écrans de facturation
lib/
  branding.ts           # Configuration organisation
  modules/              # Catalogue et garde-fous des modules
  billing/              # Plans, essai, enforcement
  i18n/                 # Traductions fr / en
  multiTenant/          # Tests d'isolation
  server/               # Code serveur (IA, Outlook, billing…)
supabase/migrations/    # Migrations PostgreSQL
public/                 # Assets statiques (app-mark.svg…)
```

---

## Notes techniques

- Le bucket Storage pour le pictogramme s'appelle `idena-mark` (nom historique conservé en base).
- La colonne `idena_mark_url` est un alias rétro-compatible de `mark_url`.
- Les clés localStorage legacy (`idena-*`) sont migrées automatiquement vers des noms neutres.
- Routes publiques sans compte : `/ideas`, `/questionnaire`, `/questionnaire/f/[surveyId]`.

---

## Licence

Projet privé — usage selon les conditions de votre organisation.
