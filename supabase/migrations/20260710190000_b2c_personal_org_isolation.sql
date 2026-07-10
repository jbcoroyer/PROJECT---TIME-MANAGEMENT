-- B2C : 1 inscrit = 1 espace personnel. Source unique d'attribution dans handle_new_user.
-- Correctifs : bootstrap org pour les triggers, questionnaires publics lisibles par lien.

-- Permet à handle_new_user d'insérer profil / réglages pour une org fraîchement créée.
create or replace function public.enforce_row_organization_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_bootstrap text;
  v_legacy constant uuid := '00000000-0000-0000-0000-000000000001';
begin
  v_bootstrap := nullif(current_setting('app.bootstrap_org_id', true), '');
  if v_bootstrap is not null then
    v_org_id := v_bootstrap::uuid;
  else
    v_org_id := public.current_org_id();
  end if;

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

-- Slug unique pour les nouvelles organisations (handle_new_user).
create or replace function public.slugify_org_name(p_name text)
returns text
language plpgsql
immutable
as $$
declare
  v_slug text;
begin
  v_slug := lower(regexp_replace(coalesce(p_name, ''), '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := regexp_replace(v_slug, '^-+|-+$', '', 'g');
  v_slug := left(v_slug, 48);
  return coalesce(nullif(v_slug, ''), 'espace');
end;
$$;

create or replace function public.unique_org_slug(p_base text)
returns text
language plpgsql
as $$
declare
  v_slug text;
  v_suffix int := 0;
begin
  v_slug := public.slugify_org_name(p_base);
  while exists (select 1 from public.organizations where slug = v_slug) loop
    v_suffix := v_suffix + 1;
    v_slug := left(public.slugify_org_name(p_base), 40) || '-' || v_suffix;
  end loop;
  return v_slug;
end;
$$;

-- Inscription : crée directement l'espace personnel (B2C). organization_name optionnel via metadata.
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

  insert into public.organizations (name, slug)
  values (org_name, org_slug)
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

-- Questionnaires : lien public = secret (UUID). Lecture autorisée pour soumission anonyme.
drop policy if exists survey_definitions_select on public.survey_definitions;
create policy survey_definitions_select on public.survey_definitions
  for select to anon, authenticated
  using (true);
