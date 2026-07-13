-- RETEX événementiel + votes idées stock (remplace localStorage).

alter table public.stock_ideas
  add column if not exists votes integer not null default 0;

create table if not exists public.event_retex (
  event_id uuid primary key references public.events (id) on delete cascade,
  highlights text not null default '',
  improvements text not null default '',
  follow_ups text not null default '',
  updated_at timestamptz not null default now(),
  organization_id uuid not null references public.organizations (id)
);

create index if not exists event_retex_organization_id_idx on public.event_retex (organization_id);

grant select, insert, update, delete on public.event_retex to authenticated;

alter table public.event_retex enable row level security;

drop trigger if exists event_retex_enforce_org on public.event_retex;
create trigger event_retex_enforce_org
  before insert or update on public.event_retex
  for each row
  execute function public.enforce_row_organization_id();

drop policy if exists event_retex_isolation on public.event_retex;
create policy event_retex_isolation on public.event_retex
  for all to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());
