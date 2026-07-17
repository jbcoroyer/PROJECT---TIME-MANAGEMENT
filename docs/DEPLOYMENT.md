# Déploiement — Workspace

Guide pour **https://project-time-management.vercel.app/**

Projet Supabase : `tjzagxyvjnkbwfpsppqw` (Project Manager - Public)  
Dépôt GitHub : [jbcoroyer/PROJECT---TIME-MANAGEMENT](https://github.com/jbcoroyer/PROJECT---TIME-MANAGEMENT)

---

## 1. Variables Vercel (Production)

Dashboard : [project-time-management → Settings → Environment Variables](https://vercel.com/jean-baptiste-coroyers-projects/project-time-management/settings/environment-variables)

### Obligatoires

| Variable | Valeur |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://tjzagxyvjnkbwfpsppqw.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé **publishable** Supabase (Dashboard → API) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé **secret** service role (serveur uniquement) |
| `NEXT_PUBLIC_APP_URL` | `https://project-time-management.vercel.app` |
| `CRON_SECRET` | Secret aléatoire 32+ caractères (voir `.env.local`) |

### Facturation Stripe (si activée)

| Variable | Valeur |
|----------|--------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_…` ou `pk_live_…` |
| `STRIPE_SECRET_KEY` | `sk_test_…` ou `sk_live_…` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` du webhook **production** (voir §5) |
| `STRIPE_PRICE_SINGLE_PLAN` | `price_…` (prix unique tiered mensuel) |
| `STRIPE_PRICE_SINGLE_PLAN_ANNUAL` | `price_…` (prix annuel tiered — 2 mois offerts) |
| `BILLING_ENFORCEMENT` | `true` |

### Recommandées

| Variable | Usage |
|----------|--------|
| `PLATFORM_ADMIN_EMAILS` | Votre e-mail → accès `/platform` |
| `RESEND_API_KEY` + `RESEND_FROM_EMAIL` | Invitations équipe, rappels essai J-3/J-1 |
| `OPENROUTER_API_KEY` | Assistant IA, repurposing social |
| `MS_CLIENT_ID` + `MS_CLIENT_SECRET` | Sync Outlook (voir §4) |
| `SLACK_WEBHOOK_URL` | Alertes stock |
| `SENTRY_DSN` | Monitoring erreurs |

### Ne pas mettre sur Vercel

- `SUPABASE_DB_PASSWORD` — CLI local uniquement
- `SUPABASE_ACCESS_TOKEN` — CLI local uniquement
- `INTERNAL_API_SECRET` — optionnel ; `CRON_SECRET` suffit pour le cron Vercel

Après toute modification → **Redeploy** (Deployments → ⋯ → Redeploy).

---

## 2. Supabase — URLs Auth

Dashboard : [Authentication → URL Configuration](https://supabase.com/dashboard/project/tjzagxyvjnkbwfpsppqw/auth/url-configuration)

| Champ | Valeur |
|-------|--------|
| **Site URL** | `https://project-time-management.vercel.app` |
| **Redirect URLs** | `https://project-time-management.vercel.app/**` |
| | `http://localhost:3000/**` |

Le wildcard `/**` est **obligatoire** pour Google OAuth (callback avec ou sans paramètres).

**Email** : confirmer que « Confirm email » est activé si vous l'utilisez en production.

---

## 3. Google OAuth (connexion « Continuer avec Google »)

### 3.1 Google Cloud Console

1. [APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)
2. **Create credentials** → **OAuth client ID** → **Web application**
3. **Authorized JavaScript origins** (optionnel) :
   - `https://project-time-management.vercel.app`
   - `http://localhost:3000`
4. **Authorized redirect URIs** (obligatoire) :
   ```
   https://tjzagxyvjnkbwfpsppqw.supabase.co/auth/v1/callback
   ```
5. Copier **Client ID** et **Client Secret**

### 3.2 Supabase

[Authentication → Providers → Google](https://supabase.com/dashboard/project/tjzagxyvjnkbwfpsppqw/auth/providers)

- Activer Google
- Coller Client ID + Client Secret
- **Save**

---

## 4. Outlook 365 (sync calendrier — inclus)

Connexion utilisateur : **email/mot de passe** ou **Google** uniquement. Outlook est une intégration calendrier distincte (variables `MS_*`), incluse dans l'abonnement.

### 4.1 Azure (API Graph)

1. Même app Azure ou une **deuxième** app registration
2. **Redirect URI** Web :
   ```
   https://project-time-management.vercel.app/api/outlook/callback
   ```
3. Permissions déléguées : `Calendars.ReadWrite`, `MailboxSettings.ReadWrite`, `User.Read`, `offline_access`
4. Variables Vercel :
   - `MS_CLIENT_ID`
   - `MS_CLIENT_SECRET`
   - `MS_TENANT_ID=common` (ou votre tenant)

`MS_REDIRECT_URI` est **optionnel** — calculé automatiquement depuis `NEXT_PUBLIC_APP_URL`.

---

## 5. Stripe Webhook (nouvelle URL Vercel)

L'ancien projet Vercel avait une autre URL → **créer un nouvel endpoint webhook** :

1. [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. **Add endpoint** :
   ```
   https://project-time-management.vercel.app/api/webhooks/stripe
   ```
3. Événements : `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
4. Copier le **Signing secret** (`whsec_…`) → Vercel `STRIPE_WEBHOOK_SECRET`
5. Redéployer

Détails : [docs/TEST_STRIPE_WEBHOOK.md](./TEST_STRIPE_WEBHOOK.md)

---

## 6. Cron rappels essai

Déjà configuré dans `vercel.json` : `GET /api/cron/trial-reminders` à 8h UTC.

- Vercel envoie `Authorization: Bearer <CRON_SECRET>`
- Définir `CRON_SECRET` sur Vercel (même valeur que dans `.env.local`)

Test manuel :

```powershell
$secret = "VOTRE_CRON_SECRET"
Invoke-WebRequest "https://project-time-management.vercel.app/api/cron/trial-reminders" -Headers @{ Authorization = "Bearer $secret" }
```

---

## 7. Vérifications post-déploiement

| Test | URL / action |
|------|----------------|
| Health | https://project-time-management.vercel.app/api/health |
| Landing | https://project-time-management.vercel.app/ |
| Tarifs | https://project-time-management.vercel.app/pricing |
| Login Google | `/login` → Google |
| Login email | `/login` → email + mot de passe |
| Super-admin | `/platform` (si `PLATFORM_ADMIN_EMAILS` = votre e-mail) |

---

## 9. Local vs Production

| | Local (`.env.local`) | Vercel (Production) |
|--|----------------------|---------------------|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://project-time-management.vercel.app` |
| Stripe | Clés `test` + `stripe listen` | Webhook prod + clés test ou live |
| CLI Supabase | `SUPABASE_DB_PASSWORD`, `SUPABASE_ACCESS_TOKEN` | ❌ Ne pas ajouter |

Copiez les **valeurs** de `.env.local` vers Vercel, pas le fichier entier — adaptez `NEXT_PUBLIC_APP_URL` et excluez les variables CLI.
