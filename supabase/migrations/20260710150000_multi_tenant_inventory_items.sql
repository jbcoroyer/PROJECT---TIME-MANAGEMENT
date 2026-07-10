-- Pilote multi-tenant : inventory_items (table témoin).
-- Checklist tables restantes (RLS using(true) → isolation) :
--   team_members, companies, domains, workflow_columns,
--   events, projects, tasks, task_assignees,
--   expenses, social_posts, social_monthly_targets, stock_movements,
--   app_settings, event_run_slots, event_material_needs, event_document_meta,
--   automation_rules, proofs, intake_requests,
--   stock_ideas, survey_responses, survey_definitions,
--   profiles, outlook_connections, outlook_calendar_events

alter table public.inventory_items
  add column if not exists organization_id uuid references public.organizations (id);

update public.inventory_items
set organization_id = '00000000-0000-0000-0000-000000000001'
where organization_id is null;

alter table public.inventory_items
  alter column organization_id set not null;

create index if not exists inventory_items_organization_id_idx
  on public.inventory_items (organization_id);

-- Déduit organization_id côté base (les inserts client n'envoient pas encore ce champ).
create or replace function public.enforce_row_organization_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  v_org_id := public.current_org_id();
  if v_org_id is null then
    raise exception 'Aucune organisation associée au profil utilisateur';
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

drop trigger if exists inventory_items_enforce_org on public.inventory_items;
create trigger inventory_items_enforce_org
  before insert or update on public.inventory_items
  for each row
  execute function public.enforce_row_organization_id();

drop policy if exists inventory_items_all on public.inventory_items;
create policy inventory_items_isolation on public.inventory_items
  for all to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());
