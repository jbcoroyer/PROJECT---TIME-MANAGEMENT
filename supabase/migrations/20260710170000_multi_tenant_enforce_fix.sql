-- Correctif : handle_new_user peut insérer un profil avec organization_id legacy
-- sans session utilisateur encore établie.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_member_id uuid;
  display text;
  job text;
  v_legacy constant uuid := '00000000-0000-0000-0000-000000000001';
begin
  display := coalesce(
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    split_part(coalesce(new.email, ''), '@', 1),
    'Utilisateur'
  );
  job := nullif(trim(new.raw_user_meta_data->>'job_title'), '');

  insert into public.team_members (display_name, job_title, organization_id)
  values (display, job, v_legacy)
  returning id into new_member_id;

  insert into public.profiles (id, team_member_id, display_name, role, organization_id)
  values (new.id, new_member_id, display, 'user', v_legacy);

  return new;
end;
$$;

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
