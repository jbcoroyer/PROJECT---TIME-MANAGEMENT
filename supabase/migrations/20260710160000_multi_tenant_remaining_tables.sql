-- Multi-tenant : tables restantes (hors inventory_items déjà migré).

create or replace function public.enforce_row_organization_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_legacy constant uuid := '00000000-0000-0000-0000-000000000001';
begin
  v_org_id := public.current_org_id();

  if auth.role() = 'service_role' then
    if tg_op = 'INSERT' and new.organization_id is null then
      new.organization_id := v_legacy;
    end if;
    return new;
  end if;

  -- Insertion système (ex. handle_new_user) : org déjà fixée à legacy
  if tg_op = 'INSERT' and new.organization_id is not null and v_org_id is null then
    if new.organization_id is distinct from v_legacy then
      raise exception 'organization_id non autorisé';
    end if;
    return new;
  end if;

  if v_org_id is null then
    if auth.role() = 'anon' then
      v_org_id := v_legacy;
    else
      raise exception 'Aucune organisation associée au profil utilisateur';
    end if;
  end if;

  if tg_op = 'INSERT' then
    if new.organization_id is null then
      new.organization_id := v_org_id;
    elsif new.organization_id is distinct from v_org_id then
      raise exception 'organization_id non autorisé';
    end if;
  elsif tg_op = 'UPDATE' then
    if new.organization_id is distinct from old.organization_id then
      raise exception 'organization_id non modifiable';
    end if;
    if new.organization_id is distinct from v_org_id then
      raise exception 'organization_id non autorisé';
    end if;
  end if;

  return new;
end;
$$;

-- Colonne + trigger + policy « isolation » standard
do $$
declare
  t text;
  tables text[] := array[
    'team_members', 'companies', 'domains', 'workflow_columns',
    'events', 'projects', 'tasks', 'task_assignees',
    'expenses', 'social_posts', 'social_monthly_targets', 'stock_movements',
    'event_run_slots', 'event_material_needs', 'event_document_meta',
    'automation_rules', 'proofs'
  ];
begin
  foreach t in array tables loop
    execute format(
      'alter table public.%I add column if not exists organization_id uuid references public.organizations (id)',
      t
    );
    execute format(
      $sql$
        update public.%I
        set organization_id = '00000000-0000-0000-0000-000000000001'
        where organization_id is null
      $sql$,
      t
    );
    execute format(
      'alter table public.%I alter column organization_id set not null',
      t
    );
    execute format(
      'create index if not exists %I on public.%I (organization_id)',
      t || '_organization_id_idx',
      t
    );
    execute format(
      'drop trigger if exists %I on public.%I',
      t || '_enforce_org',
      t
    );
    execute format(
      'create trigger %I before insert or update on public.%I for each row execute function public.enforce_row_organization_id()',
      t || '_enforce_org',
      t
    );
    execute format('drop policy if exists %I on public.%I', t || '_all', t);
    execute format('drop policy if exists %I on public.%I', t || '_isolation', t);
    execute format(
      $sql$
        create policy %I on public.%I
          for all to authenticated
          using (organization_id = public.current_org_id())
          with check (organization_id = public.current_org_id())
      $sql$,
      t || '_isolation',
      t
    );
  end loop;
end $$;

-- proofs : anciennes policies nommées
drop policy if exists proofs_select_authenticated on public.proofs;
drop policy if exists proofs_insert_authenticated on public.proofs;
drop policy if exists proofs_update_authenticated on public.proofs;
drop policy if exists proofs_delete_authenticated on public.proofs;

-- Colonne + trigger uniquement (accès service_role, pas de policy client)
do $$
declare
  t text;
  tables text[] := array['outlook_connections', 'outlook_calendar_events'];
begin
  foreach t in array tables loop
    execute format(
      'alter table public.%I add column if not exists organization_id uuid references public.organizations (id)',
      t
    );
    execute format(
      $sql$
        update public.%I
        set organization_id = '00000000-0000-0000-0000-000000000001'
        where organization_id is null
      $sql$,
      t
    );
    execute format(
      'alter table public.%I alter column organization_id set not null',
      t
    );
    execute format(
      'create index if not exists %I on public.%I (organization_id)',
      t || '_organization_id_idx',
      t
    );
    execute format(
      'drop trigger if exists %I on public.%I',
      t || '_enforce_org',
      t
    );
    execute format(
      'create trigger %I before insert or update on public.%I for each row execute function public.enforce_row_organization_id()',
      t || '_enforce_org',
      t
    );
    execute format('drop policy if exists %I on public.%I', t || '_all', t);
    execute format('drop policy if exists %I on public.%I', t || '_isolation', t);
  end loop;
end $$;

-- Tables à policies spéciales : colonne + trigger
do $$
declare
  t text;
  tables text[] := array[
    'app_settings', 'intake_requests', 'stock_ideas',
    'survey_responses', 'survey_definitions'
  ];
begin
  foreach t in array tables loop
    execute format(
      'alter table public.%I add column if not exists organization_id uuid references public.organizations (id)',
      t
    );
    execute format(
      $sql$
        update public.%I
        set organization_id = '00000000-0000-0000-0000-000000000001'
        where organization_id is null
      $sql$,
      t
    );
    execute format(
      'alter table public.%I alter column organization_id set not null',
      t
    );
    execute format(
      'create index if not exists %I on public.%I (organization_id)',
      t || '_organization_id_idx',
      t
    );
    execute format(
      'drop trigger if exists %I on public.%I',
      t || '_enforce_org',
      t
    );
    execute format(
      'create trigger %I before insert or update on public.%I for each row execute function public.enforce_row_organization_id()',
      t || '_enforce_org',
      t
    );
    execute format('drop policy if exists %I on public.%I', t || '_all', t);
    execute format('drop policy if exists %I on public.%I', t || '_isolation', t);
  end loop;
end $$;

-- profiles
drop trigger if exists profiles_enforce_org on public.profiles;
create trigger profiles_enforce_org
  before insert or update on public.profiles
  for each row
  execute function public.enforce_row_organization_id();

drop policy if exists profiles_all on public.profiles;
drop policy if exists profiles_isolation on public.profiles;
create policy profiles_isolation on public.profiles
  for all to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

-- app_settings
drop policy if exists app_settings_select on public.app_settings;
drop policy if exists app_settings_write on public.app_settings;

create policy app_settings_select on public.app_settings
  for select to anon
  using (organization_id = '00000000-0000-0000-0000-000000000001');

create policy app_settings_select_auth on public.app_settings
  for select to authenticated
  using (organization_id = public.current_org_id());

create policy app_settings_write on public.app_settings
  for all to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

-- intake_requests
drop policy if exists intake_requests_all on public.intake_requests;
drop policy if exists intake_requests_anon_insert on public.intake_requests;

create policy intake_requests_isolation on public.intake_requests
  for all to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

create policy intake_requests_anon_insert on public.intake_requests
  for insert to anon
  with check (organization_id = '00000000-0000-0000-0000-000000000001');

-- stock_ideas
drop policy if exists stock_ideas_select_anon on public.stock_ideas;
drop policy if exists stock_ideas_insert_anon on public.stock_ideas;
drop policy if exists stock_ideas_select_authenticated on public.stock_ideas;
drop policy if exists stock_ideas_insert_authenticated on public.stock_ideas;
drop policy if exists stock_ideas_update_authenticated on public.stock_ideas;
drop policy if exists stock_ideas_delete_authenticated on public.stock_ideas;

create policy stock_ideas_select_anon on public.stock_ideas
  for select to anon
  using (organization_id = '00000000-0000-0000-0000-000000000001');

create policy stock_ideas_insert_anon on public.stock_ideas
  for insert to anon
  with check (organization_id = '00000000-0000-0000-0000-000000000001');

create policy stock_ideas_select_authenticated on public.stock_ideas
  for select to authenticated
  using (organization_id = public.current_org_id());

create policy stock_ideas_insert_authenticated on public.stock_ideas
  for insert to authenticated
  with check (organization_id = public.current_org_id());

create policy stock_ideas_update_authenticated on public.stock_ideas
  for update to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

create policy stock_ideas_delete_authenticated on public.stock_ideas
  for delete to authenticated
  using (organization_id = public.current_org_id());

-- questionnaires
drop policy if exists survey_responses_insert_anon on public.survey_responses;
drop policy if exists survey_responses_insert_authenticated on public.survey_responses;
drop policy if exists survey_responses_select_admin on public.survey_responses;
drop policy if exists survey_responses_delete_admin on public.survey_responses;

create policy survey_responses_insert_anon on public.survey_responses
  for insert to anon
  with check (organization_id = '00000000-0000-0000-0000-000000000001');

create policy survey_responses_insert_authenticated on public.survey_responses
  for insert to authenticated
  with check (organization_id = public.current_org_id());

create policy survey_responses_select_admin on public.survey_responses
  for select to authenticated
  using (public.is_admin() and organization_id = public.current_org_id());

create policy survey_responses_delete_admin on public.survey_responses
  for delete to authenticated
  using (public.is_admin() and organization_id = public.current_org_id());

drop policy if exists survey_definitions_select on public.survey_definitions;
drop policy if exists survey_definitions_write_admin on public.survey_definitions;

create policy survey_definitions_select on public.survey_definitions
  for select to anon, authenticated
  using (
    organization_id = '00000000-0000-0000-0000-000000000001'
    or organization_id = public.current_org_id()
  );

create policy survey_definitions_write_admin on public.survey_definitions
  for all to authenticated
  using (public.is_admin() and organization_id = public.current_org_id())
  with check (public.is_admin() and organization_id = public.current_org_id());
