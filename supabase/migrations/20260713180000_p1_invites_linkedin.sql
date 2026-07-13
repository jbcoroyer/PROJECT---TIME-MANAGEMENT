-- P1 : métriques LinkedIn + invitations équipe (handle_new_user)

-- Table linkedin_company_metrics (manquante en prod fraîche)
create table if not exists public.linkedin_company_metrics (
  company_slug text not null,
  captured_date date not null,
  source_url text,
  followers_count integer not null default 0,
  organization_id uuid references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (company_slug, captured_date)
);

create index if not exists linkedin_company_metrics_org_idx
  on public.linkedin_company_metrics (organization_id);

alter table public.linkedin_company_metrics enable row level security;

drop policy if exists linkedin_metrics_select on public.linkedin_company_metrics;
create policy linkedin_metrics_select on public.linkedin_company_metrics
  for select to authenticated
  using (organization_id is null or organization_id = public.current_org_id());

drop policy if exists linkedin_metrics_insert on public.linkedin_company_metrics;
create policy linkedin_metrics_insert on public.linkedin_company_metrics
  for insert to authenticated
  with check (organization_id is null or organization_id = public.current_org_id());

drop policy if exists linkedin_metrics_update on public.linkedin_company_metrics;
create policy linkedin_metrics_update on public.linkedin_company_metrics
  for update to authenticated
  using (organization_id is null or organization_id = public.current_org_id())
  with check (organization_id is null or organization_id = public.current_org_id());

-- handle_new_user : rejoindre une org existante si invitation (metadata organization_id)
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
  display := coalesce(
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    split_part(coalesce(new.email, ''), '@', 1),
    'Utilisateur'
  );
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
