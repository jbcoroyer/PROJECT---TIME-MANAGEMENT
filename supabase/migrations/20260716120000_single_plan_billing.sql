-- Modèle billing unique : trial | active | canceled (remplace free/starter/pro).

alter table public.organizations
  drop constraint if exists organizations_plan_check;

update public.organizations
set plan = 'active'
where plan in ('starter', 'pro');

update public.organizations
set
  plan = 'canceled',
  billing_status = case when billing_status = 'active' then 'canceled' else billing_status end
where plan = 'free';

alter table public.organizations
  add constraint organizations_plan_check
  check (plan in ('trial', 'active', 'canceled'));
