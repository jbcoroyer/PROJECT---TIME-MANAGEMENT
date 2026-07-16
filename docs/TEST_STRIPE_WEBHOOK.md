# Tester le webhook Stripe en local

Guide pour valider `app/api/webhooks/stripe/route.ts` avant mise en production.

---

## Prérequis

### Variables d'environnement locales (`.env.local`)

| Variable | Rôle |
|----------|------|
| `STRIPE_SECRET_KEY` | Clé secrète **test** (`sk_test_…`) |
| `STRIPE_WEBHOOK_SECRET` | Secret du webhook local (fourni par `stripe listen`, voir ci-dessous) |
| `STRIPE_PRICE_SINGLE_PLAN` | ID du prix unique (tiered) en mode test (`price_…`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clé publique test (`pk_test_…`) — utile pour un checkout réel |
| `SUPABASE_SERVICE_ROLE_KEY` | Requis : le webhook met à jour `organizations` via le service role |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` |

### Base Supabase

- La migration `20260713160000_stripe_billing.sql` doit être appliquée.
- Avoir au moins une ligne dans `organizations` (créée à l'inscription ou manuellement).
- Noter l’**UUID de l’organisation** à tester :

```sql
select
  id,
  name,
  plan,
  billing_status,
  trial_ends_at,
  stripe_customer_id,
  stripe_subscription_id,
  plan_updated_at
from public.organizations
order by created_at desc
limit 5;
```

### Colonnes mises à jour par le webhook

| Colonne | Valeurs possibles |
|---------|-------------------|
| `plan` | `trial`, `starter`, `pro` |
| `billing_status` | `trialing`, `active`, `past_due`, `canceled`, `unpaid` |
| `stripe_customer_id` | `cus_…` ou `null` |
| `stripe_subscription_id` | `sub_…` ou `null` |
| `trial_ends_at` | timestamp ou `null` |
| `plan_updated_at` | mis à jour à chaque sync |

---

## 1. Installer la Stripe CLI

### Windows

**Option A — Scoop (recommandé)**

```powershell
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

**Option B — Téléchargement manuel**

1. Télécharger l’exécutable : [https://github.com/stripe/stripe-cli/releases](https://github.com/stripe/stripe-cli/releases)
2. Ajouter le binaire au `PATH`.
3. Vérifier : `stripe --version`

### macOS

```bash
brew install stripe/stripe-cli/stripe
```

### Linux

```bash
# Exemple Debian/Ubuntu
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee /etc/apt/sources.list.d/stripe.list
sudo apt update && sudo apt install stripe
```

### Authentification

```bash
stripe login
```

Suivre le lien dans le navigateur pour lier la CLI au compte Stripe (mode **test**).

---

## 2. Lancer l’application et le tunnel webhook

### Terminal 1 — serveur Next.js

```bash
npm run dev
```

L’app doit répondre sur `http://localhost:3000`.

### Terminal 2 — écoute Stripe

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Au démarrage, la CLI affiche un secret du type :

```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

**Copier ce `whsec_…` dans `.env.local` :**

```
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**Redémarrer** `npm run dev` (Terminal 1) pour prendre en compte le nouveau secret.

> Le secret `whsec_…` de `stripe listen` est **différent** de celui configuré dans le Dashboard Stripe production. En local, utilisez uniquement celui affiché par la CLI.

### Vérifier que le tunnel fonctionne

Dans un **Terminal 3**, envoyer un événement de test :

```bash
stripe trigger ping
```

Dans le Terminal 2, vous devez voir l’événement transmis. Dans le Terminal 1, pas d’erreur `Signature invalide` ni `STRIPE_WEBHOOK_SECRET manquant`.

---

## 3. Déclencher les événements avec `stripe trigger`

### Comportement attendu par événement

Le handler lie les événements Stripe à une organisation via :

1. `metadata.organization_id` sur la session / l’abonnement, **ou**
2. `client_reference_id` (checkout), **ou**
3. `stripe_subscription_id` / `stripe_customer_id` déjà enregistrés dans `organizations`.

> **Limitation importante** : les fixtures par défaut de `stripe trigger` créent des objets Stripe **génériques**, sans lien avec votre organisation Supabase.  
> Vous verrez souvent un `200` avec `{ "received": true }` mais **aucune mise à jour** en base, et un log serveur du type `organisation introuvable pour abonnement`.  
> Pour valider la **sync Supabase**, privilégiez le **parcours checkout réel** (section 4) puis utilisez `stripe trigger` pour les événements suivants une fois les IDs Stripe liés.

---

### 3.1 `checkout.session.completed`

```bash
stripe trigger checkout.session.completed
```

**Effet attendu dans le handler** (si l’organisation est identifiable) :

- Mise à jour de `stripe_customer_id` et `stripe_subscription_id`
- Puis sync de l’abonnement : `plan`, `billing_status`, `trial_ends_at`

**Vérification Supabase** (remplacer `ORG_UUID`) :

```sql
select id, plan, billing_status, stripe_customer_id, stripe_subscription_id, plan_updated_at
from public.organizations
where id = 'ORG_UUID';
```

**Override optionnel** (remplacer `ORG_UUID` par l’UUID réel) :

```bash
stripe trigger checkout.session.completed \
  --override checkout_session:metadata[organization_id]=ORG_UUID \
  --override checkout_session:client_reference_id=ORG_UUID
```

Même avec override, la fixture peut ne pas produire un abonnement récupérable ; le test le plus fiable reste le checkout réel (section 4).

---

### 3.2 `customer.subscription.updated`

```bash
stripe trigger customer.subscription.updated
```

**Effet attendu** (si abonnement lié à une org) :

- `plan` déduit du `price_id` (`STRIPE_PRICE_SINGLE_PLAN`) → `active`
- `billing_status` mappé depuis le statut Stripe (`active`, `trialing`, `past_due`, etc.)
- `stripe_customer_id`, `stripe_subscription_id`, `trial_ends_at` synchronisés

**Vérification Supabase** :

```sql
select id, plan, billing_status, stripe_subscription_id, plan_updated_at
from public.organizations
where stripe_subscription_id is not null;
```

---

### 3.3 `customer.subscription.deleted`

```bash
stripe trigger customer.subscription.deleted
```

**Effet attendu** (si abonnement lié à une org) :

- `plan` → `trial`
- `billing_status` → `canceled`
- `stripe_subscription_id` → `null`

**Vérification Supabase** :

```sql
select id, plan, billing_status, stripe_subscription_id, plan_updated_at
from public.organizations
where id = 'ORG_UUID';
```

---

### 3.4 `invoice.payment_failed`

```bash
stripe trigger invoice.payment_failed
```

**Effet attendu** (si la facture référence un abonnement dont `stripe_subscription_id` existe en base) :

- `billing_status` → `past_due`

**Vérification Supabase** :

```sql
select id, billing_status, stripe_subscription_id, plan_updated_at
from public.organizations
where billing_status = 'past_due';
```

---

## 4. Parcours recommandé — test bout en bout (sync Supabase garantie)

Ce parcours lie réellement Stripe et Supabase, contrairement aux fixtures isolées.

1. Démarrer `npm run dev` et `stripe listen` (section 2).
2. Se connecter en tant qu’**admin** de l’organisation à tester.
3. Aller sur `/billing` (ou Paramètres → Facturation) et lancer le checkout de l'abonnement unique (carte test Stripe : `4242 4242 4242 4242`).
4. Après paiement, Stripe envoie `checkout.session.completed` → vérifier en Supabase :

```sql
select id, plan, billing_status, stripe_customer_id, stripe_subscription_id, trial_ends_at, plan_updated_at
from public.organizations
where id = 'ORG_UUID';
```

Attendu : `stripe_customer_id` et `stripe_subscription_id` renseignés, `plan` = `active`, `billing_status` = `active` ou `trialing`.

5. Dans le **Dashboard Stripe (mode test)** → **Clients** → ouvrir le client → modifier l’abonnement (changer la quantity, annuler, simuler impayé) pour déclencher `customer.subscription.updated`, `customer.subscription.deleted` ou `invoice.payment_failed`.

6. Rejouer la requête SQL après chaque événement et contrôler `plan_updated_at` (doit changer).

### Cartes de test utiles

| Scénario | Numéro de carte |
|----------|-----------------|
| Paiement réussi | `4242 4242 4242 4242` |
| Paiement refusé | `4000 0000 0000 0002` |
| Authentification 3DS | `4000 0025 0000 3155` |

---

## 5. Contrôles de débogage

### Logs serveur Next.js

Rechercher :

- `[stripe/webhook] verify` → secret ou signature incorrecte
- `[stripe/webhook] organisation introuvable` → événement non lié à une org
- `[stripe/webhook] handler` → erreur Supabase ou Stripe API

### Réponses HTTP

| Code | Cause probable |
|------|----------------|
| `503` | `STRIPE_WEBHOOK_SECRET` absent |
| `400` | En-tête `stripe-signature` manquant ou secret invalide |
| `500` | Erreur lors de la mise à jour Supabase |
| `200` `{ "received": true }` | Événement accepté (même si aucune org n’a été trouvée) |

### Terminal `stripe listen`

Chaque événement affiche `--> POST /api/webhooks/stripe [200]` en cas de succès.

---

## 6. Checklist de mise en production

### 6.1 Variables d’environnement Vercel

Configurer pour l’environnement **Production** (et **Preview** si besoin de tester les PR) :

| Variable | Valeur | Notes |
|----------|--------|-------|
| `STRIPE_SECRET_KEY` | `sk_live_…` | Clé secrète **live** — jamais côté client |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` | Secret de l’endpoint webhook **production** (Dashboard Stripe, pas `stripe listen`) |
| `STRIPE_PRICE_SINGLE_PLAN` | `price_…` | Prix unique (tiered) **live** |
| `NEXT_PUBLIC_APP_URL` | `https://project-time-management.vercel.app` | URL canonique de production |
| `SUPABASE_SERVICE_ROLE_KEY` | (existant) | Indispensable pour `updateOrganizationBilling` |
| `BILLING_ENFORCEMENT` | `true` ou `false` | `true` pour bloquer l'accès sans abonnement actif après l'essai |

> Les prix et clés **test** (`sk_test_`, `price_` test) ne doivent **pas** être utilisés en production.

### 6.2 Endpoint webhook dans le Dashboard Stripe (mode Live)

1. [Dashboard Stripe](https://dashboard.stripe.com) → basculer en **mode Live** (interrupteur en haut à droite).
2. **Developers** → **Webhooks** → **Add endpoint**.
3. **Endpoint URL** :  
   `https://project-time-management.vercel.app/api/webhooks/stripe`
4. **Événements à écouter** (minimum requis par le handler) :
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Créer l’endpoint et copier le **Signing secret** (`whsec_…`).
6. Coller ce secret dans Vercel → `STRIPE_WEBHOOK_SECRET` (Production).
7. Redéployer l’application pour appliquer la variable.

### 6.3 Vérifications post-déploiement

- [ ] Un checkout live de test (petit montant ou remboursement immédiat) met à jour `organizations` en production.
- [ ] Le Dashboard Stripe → Webhooks affiche des livraisons `200` pour les événements ci-dessus.
- [ ] Aucun secret `whsec_` de `stripe listen` n’est présent dans les variables Vercel production.
- [ ] `STRIPE_PRICE_SINGLE_PLAN` correspond au prix **live** actif (tiered volume).
- [ ] `NEXT_PUBLIC_APP_URL` pointe vers le domaine de production (URLs de retour checkout / portail).
- [ ] La migration `20260713160000_stripe_billing.sql` est appliquée sur la base Supabase de production.
- [ ] `BILLING_ENFORCEMENT` est défini selon la politique commerciale souhaitée.

### 6.4 Sécurité

- Ne jamais committer `STRIPE_SECRET_KEY` ni `STRIPE_WEBHOOK_SECRET`.
- Limiter l’accès au service role Supabase aux seules routes serveur (webhook, actions admin).
- Surveiller les échecs de livraison webhook dans le Dashboard Stripe (alertes e-mail activées).

---

## Récapitulatif rapide

```bash
# Terminal 1
npm run dev

# Terminal 2
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# → copier whsec_… dans .env.local → redémarrer Terminal 1

# Terminal 3 — smoke tests
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_failed

# Vérification Supabase
# → select sur organizations (plan, billing_status, stripe_*_id, plan_updated_at)
```

Pour une validation complète de la sync base de données : **checkout test réel** via `/billing`, puis manipulation de l’abonnement dans le Dashboard Stripe test.
