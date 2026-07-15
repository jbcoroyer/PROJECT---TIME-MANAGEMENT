-- Seed board « Espace principal » à l'inscription + backfill orgs existantes sans board.

create or replace function public.seed_default_board_for_org(p_org_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_board_id uuid;
begin
  if p_org_id is null then
    return;
  end if;

  insert into public.boards (organization_id, name, position)
  values (p_org_id, 'Espace principal', 0)
  on conflict (organization_id, name) do nothing;

  select b.id into v_board_id
  from public.boards b
  where b.organization_id = p_org_id and b.name = 'Espace principal'
  limit 1;

  if v_board_id is null then
    return;
  end if;

  insert into public.board_columns (organization_id, board_id, label, color, position, is_done)
  select p_org_id, v_board_id, col.label, '#94a3b8', col.pos, (col.label = 'Terminé')
  from (
    values ('À faire', 0), ('En cours', 1), ('En validation', 2), ('Terminé', 3)
  ) as col(label, pos)
  on conflict (board_id, label) do nothing;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_member_id uuid;
  new_org_id uuid;
  invite_org_id uuid;
  invite_role text;
  display text;
  job text;
  org_name text;
  org_slug text;
begin
  display := public.resolve_user_display_name(new.raw_user_meta_data, new.email);
  job := nullif(trim(new.raw_user_meta_data->>'job_title'), '');

  invite_org_id := nullif(trim(new.raw_user_meta_data->>'organization_id'), '')::uuid;
  invite_role := coalesce(nullif(trim(new.raw_user_meta_data->>'role'), ''), 'user');

  if invite_org_id is not null and exists (
    select 1 from public.organizations where id = invite_org_id
  ) then
    perform set_config('app.bootstrap_org_id', invite_org_id::text, true);

    insert into public.team_members (display_name, job_title, organization_id)
    values (display, job, invite_org_id)
    returning id into new_member_id;

    insert into public.profiles (id, team_member_id, display_name, role, organization_id)
    values (
      new.id,
      new_member_id,
      display,
      case when invite_role = 'admin' then 'admin' else 'user' end,
      invite_org_id
    );

    perform public.seed_default_board_for_org(invite_org_id);

    perform set_config('app.bootstrap_org_id', '', true);
    return new;
  end if;

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

  perform public.seed_default_board_for_org(new_org_id);

  perform set_config('app.bootstrap_org_id', '', true);

  return new;
end;
$$;

-- Backfill : orgs créées après reset sans board
alter table public.boards disable trigger boards_enforce_org;
alter table public.board_columns disable trigger board_columns_enforce_org;

select public.seed_default_board_for_org(o.id)
from public.organizations o
where not exists (
  select 1 from public.boards b
  where b.organization_id = o.id and b.name = 'Espace principal'
);

alter table public.boards enable trigger boards_enforce_org;
alter table public.board_columns enable trigger board_columns_enforce_org;
