-- Facturation Stripe : colonnes billing sur organizations + essai 14 jours à l'inscription.

alter table public.organizations
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists billing_status text not null default 'trialing',
  add column if not exists trial_ends_at timestamptz,
  add column if not exists plan_updated_at timestamptz;

create unique index if not exists organizations_stripe_customer_id_uidx
  on public.organizations (stripe_customer_id)
  where stripe_customer_id is not null;

create unique index if not exists organizations_stripe_subscription_id_uidx
  on public.organizations (stripe_subscription_id)
  where stripe_subscription_id is not null;

alter table public.organizations
  drop constraint if exists organizations_billing_status_check;

alter table public.organizations
  add constraint organizations_billing_status_check
  check (billing_status in ('trialing', 'active', 'past_due', 'canceled', 'unpaid'));

alter table public.organizations
  drop constraint if exists organizations_plan_check;

alter table public.organizations
  add constraint organizations_plan_check
  check (plan in ('trial', 'starter', 'pro'));

-- Essai 14 jours pour les nouvelles organisations B2C.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_member_id uuid;
  new_org_id uuid;
  display text;
  job text;
  org_name text;
  org_slug text;
begin
  display := coalesce(
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    split_part(coalesce(new.email, ''), '@', 1),
    'Utilisateur'
  );
  job := nullif(trim(new.raw_user_meta_data->>'job_title'), '');

  org_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'organization_name'), ''),
    'Mon espace'
  );
  org_slug := public.unique_org_slug(org_name);

  insert into public.organizations (name, slug, plan, billing_status, trial_ends_at)
  values (org_name, org_slug, 'trial', 'trialing', now() + interval '14 days')
  returning id into new_org_id;

  perform set_config('app.bootstrap_org_id', new_org_id::text, true);

  insert into public.team_members (display_name, job_title, organization_id)
  values (display, job, new_org_id)
  returning id into new_member_id;

  insert into public.profiles (id, team_member_id, display_name, role, organization_id)
  values (new.id, new_member_id, display, 'admin', new_org_id);

  insert into public.app_settings (id, organization_id, app_name, app_short_name, is_configured)
  values (new_org_id::text, new_org_id, org_name, org_name, false)
  on conflict (organization_id) do nothing;

  perform set_config('app.bootstrap_org_id', '', true);

  return new;
end;
$$;

-- Backfill essai pour les orgs existantes sans date de fin.
update public.organizations
set
  trial_ends_at = coalesce(trial_ends_at, created_at + interval '14 days'),
  billing_status = case when plan = 'trial' then coalesce(billing_status, 'trialing') else billing_status end
where trial_ends_at is null or billing_status is null;
