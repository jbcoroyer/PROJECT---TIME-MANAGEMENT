-- OKR v2 : objectifs d'équipe vs personnels, échéances, propriété.

alter table public.objectives
  add column if not exists scope text not null default 'team'
    check (scope in ('team', 'personal')),
  add column if not exists owner_user_id uuid references auth.users (id) on delete set null,
  add column if not exists due_date date,
  add column if not exists description text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by_user_id uuid references auth.users (id) on delete set null;

alter table public.objectives
  drop constraint if exists objectives_personal_owner_check;

alter table public.objectives
  add constraint objectives_personal_owner_check
  check (scope = 'team' or owner_user_id is not null);

create index if not exists objectives_scope_idx on public.objectives (organization_id, scope);
create index if not exists objectives_owner_idx on public.objectives (owner_user_id)
  where scope = 'personal';
create index if not exists objectives_due_date_idx on public.objectives (due_date)
  where due_date is not null;

-- Visibilité : équipe (org) ou personnel (propriétaire + admin).
create or replace function public.okr_objective_visible(o public.objectives)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    o.organization_id = public.current_org_id()
    and (
      o.scope = 'team'
      or o.owner_user_id = auth.uid()
      or public.is_admin()
    );
$$;

grant execute on function public.okr_objective_visible(public.objectives) to authenticated;

create or replace function public.okr_key_result_visible(kr public.key_results)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.objectives o
    where o.id = kr.objective_id
      and public.okr_objective_visible(o)
  );
$$;

grant execute on function public.okr_key_result_visible(public.key_results) to authenticated;

-- Objectives : policies remplacent le modèle standard org-only SELECT.
drop policy if exists objectives_select on public.objectives;
create policy objectives_select on public.objectives
  for select to authenticated
  using (public.okr_objective_visible(objectives));

drop policy if exists objectives_insert on public.objectives;
create policy objectives_insert on public.objectives
  for insert to authenticated
  with check (
    organization_id = public.current_org_id()
    and (
      scope = 'team'
      or (scope = 'personal' and owner_user_id = auth.uid())
    )
  );

drop policy if exists objectives_update on public.objectives;
create policy objectives_update on public.objectives
  for update to authenticated
  using (public.okr_objective_visible(objectives))
  with check (
    organization_id = public.current_org_id()
    and (
      scope = 'team'
      or (scope = 'personal' and owner_user_id = auth.uid())
    )
  );

drop policy if exists objectives_delete on public.objectives;
create policy objectives_delete on public.objectives
  for delete to authenticated
  using (
    organization_id = public.current_org_id()
    and (
      public.is_admin()
      or (scope = 'personal' and owner_user_id = auth.uid())
    )
  );

-- Key results : visibilité et écriture liées à l'objectif parent.
drop policy if exists key_results_select on public.key_results;
create policy key_results_select on public.key_results
  for select to authenticated
  using (public.okr_key_result_visible(key_results));

drop policy if exists key_results_insert on public.key_results;
create policy key_results_insert on public.key_results
  for insert to authenticated
  with check (
    organization_id = public.current_org_id()
    and exists (
      select 1
      from public.objectives o
      where o.id = objective_id
        and o.organization_id = public.current_org_id()
        and (
          o.scope = 'team'
          or o.owner_user_id = auth.uid()
        )
    )
  );

drop policy if exists key_results_update on public.key_results;
create policy key_results_update on public.key_results
  for update to authenticated
  using (public.okr_key_result_visible(key_results))
  with check (
    organization_id = public.current_org_id()
    and exists (
      select 1
      from public.objectives o
      where o.id = objective_id
        and (
          o.scope = 'team'
          or o.owner_user_id = auth.uid()
        )
    )
  );

drop policy if exists key_results_delete on public.key_results;
create policy key_results_delete on public.key_results
  for delete to authenticated
  using (
    organization_id = public.current_org_id()
    and public.okr_key_result_visible(key_results)
    and (
      public.is_admin()
      or exists (
        select 1
        from public.objectives o
        where o.id = objective_id and o.scope = 'team'
      )
      or exists (
        select 1
        from public.objectives o
        where o.id = objective_id
          and o.scope = 'personal'
          and o.owner_user_id = auth.uid()
      )
    )
  );
