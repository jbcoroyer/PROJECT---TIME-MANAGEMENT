-- Module Agenda : rendez-vous, notes et réservation publique.

create table if not exists public.agenda_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  title text not null default 'Prendre rendez-vous',
  welcome_message text not null default '',
  slot_duration_minutes int not null default 30
    check (slot_duration_minutes between 15 and 240),
  buffer_minutes int not null default 10 check (buffer_minutes >= 0 and buffer_minutes <= 120),
  booking_horizon_days int not null default 42
    check (booking_horizon_days between 7 and 180),
  min_notice_hours int not null default 4 check (min_notice_hours >= 0 and min_notice_hours <= 168),
  work_hours jsonb not null default '{
    "mon": {"enabled": true, "start": "09:00", "end": "18:00"},
    "tue": {"enabled": true, "start": "09:00", "end": "18:00"},
    "wed": {"enabled": true, "start": "09:00", "end": "18:00"},
    "thu": {"enabled": true, "start": "09:00", "end": "18:00"},
    "fri": {"enabled": true, "start": "09:00", "end": "17:00"},
    "sat": {"enabled": false, "start": "09:00", "end": "12:00"},
    "sun": {"enabled": false, "start": "09:00", "end": "12:00"}
  }'::jsonb,
  auto_confirm boolean not null default true,
  public_path text not null,
  status text not null default 'active' check (status in ('active', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agenda_settings_org_unique unique (organization_id),
  constraint agenda_settings_public_path_unique unique (public_path)
);

create index if not exists agenda_settings_organization_id_idx on public.agenda_settings (organization_id);

create table if not exists public.agenda_appointments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  host_team_member_id uuid references public.team_members (id) on delete set null,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'confirmed'
    check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  source text not null default 'internal'
    check (source in ('internal', 'public_booking')),
  guest_name text not null default '',
  guest_email text not null default '',
  guest_phone text not null default '',
  guest_message text not null default '',
  location text not null default '',
  meeting_url text not null default '',
  color text not null default '#0d9488',
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agenda_appointments_time_check check (ends_at > starts_at)
);

create index if not exists agenda_appointments_org_starts_idx
  on public.agenda_appointments (organization_id, starts_at);
create index if not exists agenda_appointments_host_idx
  on public.agenda_appointments (host_team_member_id);

create table if not exists public.agenda_appointment_notes (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.agenda_appointments (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  author_user_id uuid references auth.users (id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists agenda_appointment_notes_appointment_idx
  on public.agenda_appointment_notes (appointment_id, created_at);

alter table public.agenda_settings enable row level security;
alter table public.agenda_appointments enable row level security;
alter table public.agenda_appointment_notes enable row level security;

grant select, insert, update, delete on public.agenda_settings to authenticated;
grant select, insert, update, delete on public.agenda_settings to service_role;
grant select, insert, update, delete on public.agenda_appointments to authenticated;
grant select, insert, update, delete on public.agenda_appointments to service_role;
grant select, insert, update, delete on public.agenda_appointment_notes to authenticated;
grant select, insert, update, delete on public.agenda_appointment_notes to service_role;

drop trigger if exists agenda_settings_enforce_org on public.agenda_settings;
create trigger agenda_settings_enforce_org
  before insert or update on public.agenda_settings
  for each row execute function public.enforce_row_organization_id();

drop trigger if exists agenda_appointments_enforce_org on public.agenda_appointments;
create trigger agenda_appointments_enforce_org
  before insert or update on public.agenda_appointments
  for each row execute function public.enforce_row_organization_id();

drop trigger if exists agenda_appointment_notes_enforce_org on public.agenda_appointment_notes;
create trigger agenda_appointment_notes_enforce_org
  before insert or update on public.agenda_appointment_notes
  for each row execute function public.enforce_row_organization_id();

drop policy if exists agenda_settings_isolation on public.agenda_settings;
create policy agenda_settings_isolation on public.agenda_settings
  for all to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

drop policy if exists agenda_appointments_isolation on public.agenda_appointments;
create policy agenda_appointments_isolation on public.agenda_appointments
  for all to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

drop policy if exists agenda_appointment_notes_isolation on public.agenda_appointment_notes;
create policy agenda_appointment_notes_isolation on public.agenda_appointment_notes
  for all to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());
