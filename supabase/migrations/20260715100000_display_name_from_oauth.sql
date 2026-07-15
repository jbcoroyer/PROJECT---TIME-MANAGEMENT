-- Nom affiché : prénom + nom (metadata inscription ou profil Google), pas l’email.

create or replace function public.resolve_user_display_name(meta jsonb, email text)
returns text
language sql
immutable
as $$
  select coalesce(
    nullif(trim(meta->>'display_name'), ''),
    nullif(trim(concat_ws(' ',
      nullif(trim(meta->>'first_name'), ''),
      nullif(trim(meta->>'last_name'), '')
    )), ''),
    nullif(trim(meta->>'full_name'), ''),
    nullif(trim(meta->>'name'), ''),
    nullif(trim(concat_ws(' ',
      nullif(trim(meta->>'given_name'), ''),
      nullif(trim(meta->>'family_name'), '')
    )), ''),
    nullif(split_part(coalesce(email, ''), '@', 1), ''),
    'Utilisateur'
  );
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

  perform set_config('app.bootstrap_org_id', '', true);

  return new;
end;
$$;
