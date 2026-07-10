-- OKR V2 : objectifs et résultats clés partagés par organisation (remplace localStorage).

create table public.objectives (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company text,
  period text not null,
  organization_id uuid not null references public.organizations (id)
);

create index objectives_organization_id_idx on public.objectives (organization_id);

grant select, insert, update, delete on public.objectives to authenticated;

alter table public.objectives enable row level security;

drop trigger if exists objectives_enforce_org on public.objectives;
create trigger objectives_enforce_org
  before insert or update on public.objectives
  for each row
  execute function public.enforce_row_organization_id();

drop policy if exists objectives_isolation on public.objectives;
create policy objectives_isolation on public.objectives
  for all to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

create table public.key_results (
  id uuid primary key default gen_random_uuid(),
  objective_id uuid not null references public.objectives (id) on delete cascade,
  label text not null,
  linked_domain text,
  target numeric not null default 0,
  "current" numeric not null default 0,
  organization_id uuid not null references public.organizations (id)
);

create index key_results_objective_id_idx on public.key_results (objective_id);
create index key_results_organization_id_idx on public.key_results (organization_id);

grant select, insert, update, delete on public.key_results to authenticated;

alter table public.key_results enable row level security;

drop trigger if exists key_results_enforce_org on public.key_results;
create trigger key_results_enforce_org
  before insert or update on public.key_results
  for each row
  execute function public.enforce_row_organization_id();

drop policy if exists key_results_isolation on public.key_results;
create policy key_results_isolation on public.key_results
  for all to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());
