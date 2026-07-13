-- Plan Gratuit (1 à 2 utilisateurs) : ajout au catalogue de plans.

alter table public.organizations
  drop constraint if exists organizations_plan_check;

alter table public.organizations
  add constraint organizations_plan_check
  check (plan in ('trial', 'free', 'starter', 'pro'));

-- Rétrograder les essais expirés vers le plan Gratuit.
update public.organizations
set
  plan = 'free',
  billing_status = 'active',
  trial_ends_at = null,
  plan_updated_at = now()
where
  plan = 'trial'
  and trial_ends_at is not null
  and trial_ends_at <= now();
