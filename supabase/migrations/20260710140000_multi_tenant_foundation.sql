-- Fondation multi-tenant : organisations, lien profil → org, helper RLS.
-- Organisation « legacy » pour les données existantes (mono-tenant actuel).

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  plan text not null default 'trial',
  created_at timestamptz not null default now()
);

insert into public.organizations (id, name, slug)
values (
  '00000000-0000-0000-0000-000000000001',
  'Mon organisation actuelle',
  'legacy'
)
on conflict (id) do nothing;

alter table public.profiles
  add column if not exists organization_id uuid references public.organizations (id);

update public.profiles
set organization_id = '00000000-0000-0000-0000-000000000001'
where organization_id is null;

alter table public.profiles
  alter column organization_id set not null;

create index if not exists profiles_organization_id_idx
  on public.profiles (organization_id);

-- Helper central pour toutes les futures policies RLS (même schéma que public.is_admin).
create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from public.profiles
  where id = auth.uid();
$$;

grant usage on schema public to anon, authenticated;
grant select on public.organizations to authenticated;

alter table public.organizations enable row level security;

drop policy if exists organizations_select_own on public.organizations;
create policy organizations_select_own on public.organizations
  for select to authenticated
  using (id = public.current_org_id());

-- Nouveaux comptes : rattachement à l'organisation legacy tant que /signup multi-tenant n'existe pas.
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
begin
  display := coalesce(
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    split_part(coalesce(new.email, ''), '@', 1),
    'Utilisateur'
  );
  job := nullif(trim(new.raw_user_meta_data->>'job_title'), '');

  insert into public.team_members (display_name, job_title, organization_id)
  values (display, job, '00000000-0000-0000-0000-000000000001')
  returning id into new_member_id;

  insert into public.profiles (id, team_member_id, display_name, role, organization_id)
  values (
    new.id,
    new_member_id,
    display,
    'user',
    '00000000-0000-0000-0000-000000000001'
  );

  return new;
end;
$$;
