-- DAM V2 : bibliothèque d'assets partagée par organisation (remplace localStorage).

create table public.dam_assets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  company text not null,
  type text not null
    check (type in ('Logo', 'Visuel', 'Template', 'Document', 'Vidéo', 'Autre')),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  organization_id uuid not null references public.organizations (id)
);

create index dam_assets_organization_id_idx on public.dam_assets (organization_id);
create index dam_assets_created_at_idx on public.dam_assets (created_at desc);

grant select, insert, update, delete on public.dam_assets to authenticated;

alter table public.dam_assets enable row level security;

drop trigger if exists dam_assets_enforce_org on public.dam_assets;
create trigger dam_assets_enforce_org
  before insert or update on public.dam_assets
  for each row
  execute function public.enforce_row_organization_id();

drop policy if exists dam_assets_isolation on public.dam_assets;
create policy dam_assets_isolation on public.dam_assets
  for all to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());
