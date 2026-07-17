-- Demandes de RDV publiques : validation par l'organisation avant confirmation.

create table if not exists public.agenda_appointment_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  agenda_settings_id uuid not null references public.agenda_settings (id) on delete cascade,
  requested_starts_at timestamptz not null,
  requested_ends_at timestamptz not null,
  guest_name text not null default '',
  guest_email text not null default '',
  guest_phone text not null default '',
  guest_message text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected')),
  appointment_id uuid references public.agenda_appointments (id) on delete set null,
  rejection_reason text not null default '',
  decided_at timestamptz,
  decided_by_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agenda_appointment_requests_time_check check (requested_ends_at > requested_starts_at)
);

create index if not exists agenda_appointment_requests_org_status_idx
  on public.agenda_appointment_requests (organization_id, status, created_at desc);

create index if not exists agenda_appointment_requests_settings_starts_idx
  on public.agenda_appointment_requests (agenda_settings_id, requested_starts_at);

alter table public.agenda_appointment_requests enable row level security;

grant select, insert, update, delete on public.agenda_appointment_requests to authenticated;
grant select, insert, update, delete on public.agenda_appointment_requests to service_role;

drop trigger if exists agenda_appointment_requests_enforce_org on public.agenda_appointment_requests;
create trigger agenda_appointment_requests_enforce_org
  before insert or update on public.agenda_appointment_requests
  for each row execute function public.enforce_row_organization_id();

drop policy if exists agenda_appointment_requests_isolation on public.agenda_appointment_requests;
create policy agenda_appointment_requests_isolation on public.agenda_appointment_requests
  for all to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());
