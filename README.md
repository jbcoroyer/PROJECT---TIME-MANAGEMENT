# Workspace — Gestion de projet & communication

Application web **white-label** de gestion de projet, événements, réseaux sociaux, stock et questionnaires. Chaque organisation installe sa propre instance, personnalise le nom, les couleurs, les entités et les taxonomies métier.

**Dépôt :** [github.com/jbcoroyer/PROJECT---TIME-MANAGEMENT](https://github.com/jbcoroyer/PROJECT---TIME-MANAGEMENT)

---

## Fonctionnalités principales

| Module | Description |
|---|---|
| **Tableau de bord** | Kanban, inbox, triage, liste, to-do, calendrier, analytics, charge |
| **Mon espace** | Agenda du jour, suggestions IA |
| **Planning** | Vues semaine, mois, timeline et charge |
| **Événements** | Salons, budget, tâches, run-of-show, RETEX |
| **Réseaux sociaux** | Calendrier éditorial, posts, stats LinkedIn, repurposing IA |
| **Stock** | Impressions, PLV, goodies, alertes Slack |
| **Questionnaires** | Création, diffusion, analyse des réponses |
| **Boîte à idées** | Soumission publique ou interne, votes |
| **Paramètres** | Équipe, entités, domaines, colonnes, taxonomies, branding |

Une seule interface unifiée — plus de bascule V1/V2.

---

## Première installation

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

Copiez le modèle et renseignez vos clés Supabase :

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

### 4. Migrations Supabase

Appliquez les fichiers SQL dans `supabase/migrations/` dans l'ordre chronologique :

```bash
npx supabase link --project-ref <votre-ref>
npx supabase db push
```

> Les policies Storage (`storage.objects`) nécessitent le **session pooler** sur Supabase hébergé :
> `npx supabase db query --linked -f supabase/migrations/20260711000000_storage_org_isolation.sql`

La migration `20260520000000_initial_base_schema.sql` crée le schéma complet (tables, RLS, buckets Storage).

### 5. Lancer l'application

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

### 6. Assistant d'installation (`/setup`)

Au premier lancement :

1. **Créez un compte** sur `/login` (le premier utilisateur devient administrateur s'il n'y en a pas encore).
2. L'assistant `/setup` vous guide en 3 étapes :
   - Nom et slogan de l'organisation
   - Couleur principale et pictogramme
   - Langue, fuseau horaire, secteur d'activité
3. Une fois terminé, l'application est marquée comme configurée (`is_configured = true`).

Vous pouvez ensuite affiner **Paramètres → Entités**, **Taxonomies** et **Identité visuelle**.

---

## Personnalisation (white-label)

| Élément | Où le configurer |
|---|---|
| Nom, slogan, couleur, pictogramme | `/setup` ou Paramètres → Identité visuelle |
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

## Internationalisation (i18n)

Langues supportées : **français** et **anglais**.

- La langue est stockée dans `app_settings.locale`.
- Écrans traduits : connexion, assistant d'installation, messages communs.
- Le reste de l'interface reste en français pour l'instant ; les clés de traduction sont dans `lib/i18n/messages/`.

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
| `npm run lint` | ESLint |
| `npm run audit:storage` | Vérifie que les chemins Storage sont préfixés par `organization_id` |

---

## Déploiement sur Vercel

1. Importez le dépôt GitHub sur [Vercel](https://vercel.com).
2. Ajoutez toutes les variables d'environnement (voir `.env.example`).
3. Déployez — Next.js est détecté automatiquement.

`NEXT_PUBLIC_APP_URL` peut être dérivé de `VERCEL_URL` au build si non défini.

### Outlook 365

Copiez les variables `MS_*` dans Vercel → Settings → Environment Variables. Dans Azure Portal, ajoutez l'URI de redirection :

`https://<votre-domaine>/api/outlook/callback`

Permission déléguée requise : `MailboxSettings.ReadWrite` (pour la catégorie colorée).

---

## Structure du projet

```
app/                    # Routes Next.js
  setup/                # Assistant première installation
  actions/              # Server Actions (branding, setup…)
  api/                  # Routes API (Outlook, IA, stock…)
  v2/                   # Interface avancée
components/             # Composants React
lib/
  branding.ts           # Configuration organisation
  i18n/                 # Traductions fr / en
  taxonomies.ts         # Thématiques social & catégories print
  server/               # Code serveur (IA, Outlook…)
supabase/migrations/    # Migrations PostgreSQL
public/                 # Assets statiques (app-mark.svg…)
```

---

## Notes techniques

- Le bucket Storage pour le pictogramme s'appelle `idena-mark` (nom historique conservé en base).
- La colonne `idena_mark_url` est un alias rétro-compatible de `mark_url`.
- Les clés localStorage legacy (`idena-*`) sont migrées automatiquement vers des noms neutres.

---

## Licence

Projet privé — usage selon les conditions de votre organisation.
