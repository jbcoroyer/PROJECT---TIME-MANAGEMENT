-- Formulaires de demande publics (un espace par organisation).

create table if not exists public.intake_forms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  title text not null,
  welcome_message text not null default '',
  status text not null default 'active' check (status in ('active', 'draft')),
  public_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint intake_forms_org_unique unique (organization_id),
  constraint intake_forms_public_path_unique unique (public_path)
);

create index if not exists intake_forms_organization_id_idx on public.intake_forms (organization_id);

alter table public.intake_requests
  add column if not exists intake_form_id uuid references public.intake_forms (id) on delete set null;

create index if not exists intake_requests_form_id_idx on public.intake_requests (intake_form_id);

alter table public.intake_forms enable row level security;

grant select, insert, update, delete on public.intake_forms to authenticated;
grant select, insert, update, delete on public.intake_forms to service_role;

drop trigger if exists intake_forms_enforce_org on public.intake_forms;
create trigger intake_forms_enforce_org
  before insert or update on public.intake_forms
  for each row execute function public.enforce_row_organization_id();

drop policy if exists intake_forms_isolation on public.intake_forms;
create policy intake_forms_isolation on public.intake_forms
  for all to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());
