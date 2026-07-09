-- Schéma de base (export structure projet IDENA, sans données métier).
-- Complété par RLS, grants, index, trigger inscription et buckets storage.

-- ─── Tables de référence ───────────────────────────────────────────────────

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  display_name text not null unique,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  avatar_url text,
  job_title text
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  logo_url text
);

create table if not exists public.domains (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.workflow_columns (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ─── Événements & stock ────────────────────────────────────────────────────

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (btrim(name) <> ''),
  location text not null default '',
  start_date date not null,
  end_date date not null,
  status text not null default 'Brouillon' check (status in ('Brouillon', 'En préparation', 'Terminé')),
  allocated_budget numeric not null default 0 check (allocated_budget >= 0),
  budget_posts jsonb not null default '{}'::jsonb,
  closure_recap jsonb,
  template_key text
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (btrim(name) <> ''),
  status text not null default 'Actif' check (status in ('Actif', 'Terminé'))
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  category text not null check (category in ('Print', 'Goodies', 'PLV')),
  item_type text not null default '',
  name text not null default '',
  quantity integer not null default 0 check (quantity >= 0),
  unit_price numeric not null default 0 check (unit_price >= 0),
  alert_threshold integer not null default 0 check (alert_threshold >= 0),
  last_quote_info text,
  language text,
  visual_url text
);

-- ─── Tâches ────────────────────────────────────────────────────────────────

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_name text,
  company text not null,
  domain text not null,
  admin text not null,
  is_client_request boolean default false,
  client_name text,
  request_date date,
  deadline date,
  budget text,
  description text,
  column_id text not null,
  lane text not null,
  elapsed_ms bigint default 0,
  is_running boolean default false,
  last_start_time_ms bigint,
  created_at timestamptz default now(),
  is_archived boolean default false,
  estimated_hours numeric default 0,
  estimated_days numeric default 0,
  priority text default 'Moyenne',
  projected_work jsonb default '[]'::jsonb,
  company_id uuid references public.companies (id),
  domain_id uuid references public.domains (id),
  workflow_column_id uuid references public.workflow_columns (id),
  parent_task_id uuid references public.tasks (id),
  completed_at timestamptz,
  event_id uuid references public.events (id),
  event_category text
);

create table if not exists public.task_assignees (
  task_id uuid not null references public.tasks (id),
  team_member_id uuid not null references public.team_members (id),
  primary key (task_id, team_member_id)
);

-- ─── Profils utilisateurs ──────────────────────────────────────────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  team_member_id uuid references public.team_members (id),
  display_name text,
  created_at timestamptz not null default now(),
  role text not null default 'user' check (role in ('admin', 'user'))
);

-- ─── Dépenses événements ───────────────────────────────────────────────────

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_id uuid not null references public.events (id) on delete cascade,
  title text not null check (btrim(title) <> ''),
  amount numeric not null check (amount >= 0),
  category text not null default '',
  quoted_amount numeric not null default 0,
  committed_amount numeric not null default 0,
  paid_amount numeric not null default 0,
  expense_status text not null default 'engage',
  budget_post text,
  document_path text
);

-- ─── Réseaux sociaux ───────────────────────────────────────────────────────

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  scheduled_at timestamptz not null,
  all_day boolean not null default true,
  status text not null check (status in ('Idée', 'Rédaction', 'À valider', 'Planifié', 'Publié', 'Annulé')),
  target_networks text[] not null default '{}',
  format text,
  notes text,
  drive_url text,
  responsible_member_id uuid references public.team_members (id),
  company_id uuid not null references public.companies (id),
  campaign_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  thematic text,
  objective text,
  wording text,
  wording_en text,
  visual_url text,
  publication_status text,
  reactions_count integer,
  engagement_rate numeric,
  impressions_count integer,
  followers_count integer,
  time_spent_hours numeric not null default 0 check (time_spent_hours >= 0)
);

create table if not exists public.social_monthly_targets (
  company_id uuid not null references public.companies (id),
  year smallint not null,
  month smallint not null check (month between 1 and 12),
  target_count integer not null default 0 check (target_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (company_id, year, month)
);

-- ─── Mouvements stock ────────────────────────────────────────────────────────

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  item_id uuid not null references public.inventory_items (id) on delete cascade,
  change_amount integer not null check (change_amount <> 0),
  new_quantity integer not null check (new_quantity >= 0),
  project_id uuid references public.projects (id),
  reason text,
  user_name text not null default '',
  event_id uuid references public.events (id),
  unit_price_at_movement numeric
);

-- ─── Réglages application ────────────────────────────────────────────────────

create table if not exists public.app_settings (
  id text primary key default 'default',
  idena_mark_url text,
  updated_at timestamptz not null default now()
);

-- ─── Organisation événementielle ─────────────────────────────────────────────

create table if not exists public.event_run_slots (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_id uuid not null references public.events (id) on delete cascade,
  slot_date date not null,
  start_time time,
  end_time time,
  title text not null,
  notes text,
  sort_order integer not null default 0
);

create index if not exists event_run_slots_event_id_idx on public.event_run_slots (event_id);

create table if not exists public.event_material_needs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_id uuid not null references public.events (id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items (id) on delete cascade,
  quantity_needed integer not null default 1 check (quantity_needed > 0),
  quantity_fulfilled integer not null default 0 check (quantity_fulfilled >= 0),
  notes text,
  unique (event_id, inventory_item_id)
);

create index if not exists event_material_needs_event_id_idx on public.event_material_needs (event_id);

create table if not exists public.event_document_meta (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_id uuid not null references public.events (id) on delete cascade,
  storage_path text not null unique,
  doc_type text not null default 'autre' check (doc_type in ('devis', 'facture', 'brief', 'plan', 'autre')),
  expense_id uuid references public.expenses (id) on delete set null,
  title text
);

create index if not exists event_document_meta_event_id_idx on public.event_document_meta (event_id);

-- ─── Outlook ─────────────────────────────────────────────────────────────────

create table if not exists public.outlook_connections (
  user_id uuid primary key references auth.users (id) on delete cascade,
  ms_user_id text,
  account_email text,
  access_token text not null,
  refresh_token text not null,
  token_expires_at timestamptz not null,
  scope text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.outlook_calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  task_id uuid not null references public.tasks (id) on delete cascade,
  occurrence_key text not null,
  outlook_event_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, task_id, occurrence_key)
);

create index if not exists outlook_calendar_events_user_task_idx
  on public.outlook_calendar_events (user_id, task_id);

-- ─── V2 automations & intake ─────────────────────────────────────────────────

create table if not exists public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  enabled boolean not null default true,
  name text not null,
  trigger_type text not null,
  trigger_params jsonb not null default '{}'::jsonb,
  action_type text not null,
  action_params jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0
);

create index if not exists automation_rules_sort_idx on public.automation_rules (sort_order);

create table if not exists public.intake_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,
  description text not null default '',
  requester_name text not null default '',
  requester_service text not null default '',
  priority text not null default 'Moyenne',
  status text not null default 'triage' check (status in ('triage', 'accepted', 'rejected')),
  suggested_domain text,
  suggested_assignee text,
  linked_task_id uuid references public.tasks (id) on delete set null,
  decided_at timestamptz,
  company text not null default '',
  concern text not null default '',
  deadline date,
  budget text not null default '',
  estimated_hours numeric not null default 0,
  support_format text not null default ''
);

create index if not exists intake_requests_status_idx on public.intake_requests (status);

-- ─── Proofing V2 ─────────────────────────────────────────────────────────────

create table if not exists public.proofs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,
  company_id uuid references public.companies (id) on delete set null,
  status text not null default 'in_review',
  current_version integer not null default 1,
  visual_url text,
  versions jsonb not null default '[]'::jsonb,
  comments jsonb not null default '[]'::jsonb,
  approvers jsonb not null default '[]'::jsonb
);

create index if not exists proofs_company_idx on public.proofs (company_id);
create index if not exists proofs_status_idx on public.proofs (status);

-- ─── Questionnaires ──────────────────────────────────────────────────────────

create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  survey_version text not null default 'satisfaction-2026',
  entity text,
  service text,
  prestations text[] not null default '{}',
  satisfaction smallint,
  nps_score smallint,
  answers jsonb not null default '{}'::jsonb,
  respondent_name text
);

create index if not exists survey_responses_created_at_idx on public.survey_responses (created_at desc);
create index if not exists survey_responses_entity_idx on public.survey_responses (entity);
create index if not exists survey_responses_version_idx on public.survey_responses (survey_version);

create table if not exists public.survey_definitions (
  id text primary key,
  version text not null,
  title text not null,
  definition jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  status text not null default 'active' check (status in ('active', 'draft')),
  created_at timestamptz not null default now(),
  description text not null default '',
  public_path text,
  audience text not null default 'general' check (audience in ('externe', 'interne', 'general'))
);

-- ─── Grants ──────────────────────────────────────────────────────────────────

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on
  public.team_members, public.companies, public.domains, public.workflow_columns,
  public.events, public.projects, public.inventory_items, public.tasks,
  public.task_assignees, public.profiles, public.expenses,
  public.social_posts, public.social_monthly_targets, public.stock_movements,
  public.app_settings, public.event_run_slots, public.event_material_needs,
  public.event_document_meta, public.automation_rules, public.proofs
to authenticated;

grant select, insert, update, delete on public.intake_requests to authenticated;
grant insert on public.intake_requests to anon;

grant insert on public.survey_responses to anon;
grant select, insert, delete on public.survey_responses to authenticated;

grant select on public.survey_definitions to anon, authenticated;
grant insert, update, delete on public.survey_definitions to authenticated;

-- stock_ideas : grants déjà appliqués par migration ultérieure si présente

-- ─── RLS ───────────────────────────────────────────────────────────────────

alter table public.team_members enable row level security;
alter table public.companies enable row level security;
alter table public.domains enable row level security;
alter table public.workflow_columns enable row level security;
alter table public.events enable row level security;
alter table public.projects enable row level security;
alter table public.inventory_items enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;
alter table public.profiles enable row level security;
alter table public.expenses enable row level security;
alter table public.social_posts enable row level security;
alter table public.social_monthly_targets enable row level security;
alter table public.stock_movements enable row level security;
alter table public.app_settings enable row level security;
alter table public.event_run_slots enable row level security;
alter table public.event_material_needs enable row level security;
alter table public.event_document_meta enable row level security;
alter table public.outlook_connections enable row level security;
alter table public.outlook_calendar_events enable row level security;
alter table public.automation_rules enable row level security;
alter table public.intake_requests enable row level security;
alter table public.proofs enable row level security;
alter table public.survey_responses enable row level security;
alter table public.survey_definitions enable row level security;

-- Policies tables internes (utilisateurs connectés)
do $$
declare
  t text;
begin
  foreach t in array array[
    'team_members', 'companies', 'domains', 'workflow_columns',
    'events', 'projects', 'inventory_items', 'tasks', 'task_assignees',
    'expenses', 'social_posts', 'social_monthly_targets', 'stock_movements',
    'event_run_slots', 'event_material_needs', 'event_document_meta',
    'automation_rules', 'proofs'
  ] loop
    execute format('drop policy if exists %I on public.%I', t || '_all', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (true) with check (true)',
      t || '_all', t
    );
  end loop;
end $$;

drop policy if exists profiles_all on public.profiles;
create policy profiles_all on public.profiles for all to authenticated using (true) with check (true);

drop policy if exists app_settings_select on public.app_settings;
create policy app_settings_select on public.app_settings for select to anon, authenticated using (true);

drop policy if exists app_settings_write on public.app_settings;
create policy app_settings_write on public.app_settings for all to authenticated using (true) with check (true);

drop policy if exists intake_requests_anon_insert on public.intake_requests;
create policy intake_requests_anon_insert on public.intake_requests for insert to anon with check (true);

drop policy if exists intake_requests_all on public.intake_requests;
create policy intake_requests_all on public.intake_requests for all to authenticated using (true) with check (true);

-- Outlook : aucune policy (service_role uniquement)

-- Questionnaires
drop policy if exists survey_responses_insert_anon on public.survey_responses;
create policy survey_responses_insert_anon on public.survey_responses for insert to anon with check (true);

drop policy if exists survey_responses_insert_authenticated on public.survey_responses;
create policy survey_responses_insert_authenticated on public.survey_responses for insert to authenticated with check (true);

drop policy if exists survey_definitions_select on public.survey_definitions;
create policy survey_definitions_select on public.survey_definitions for select to anon, authenticated using (true);

-- ─── Admin helper (questionnaires) ───────────────────────────────────────────

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

drop policy if exists survey_responses_select_admin on public.survey_responses;
create policy survey_responses_select_admin on public.survey_responses for select to authenticated using (public.is_admin());

drop policy if exists survey_responses_delete_admin on public.survey_responses;
create policy survey_responses_delete_admin on public.survey_responses for delete to authenticated using (public.is_admin());

drop policy if exists survey_definitions_write_admin on public.survey_definitions;
create policy survey_definitions_write_admin on public.survey_definitions for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ─── Inscription : profil + fiche équipe ─────────────────────────────────────

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

  insert into public.team_members (display_name, job_title)
  values (display, job)
  returning id into new_member_id;

  insert into public.profiles (id, team_member_id, display_name, role)
  values (new.id, new_member_id, display, 'user');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Storage buckets ─────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values
  ('idena-mark', 'idena-mark', true),
  ('member-avatars', 'member-avatars', true),
  ('company-logos', 'company-logos', true),
  ('event-documents', 'event-documents', true),
  ('social-post-visuals', 'social-post-visuals', true),
  ('stock-plv-visuals', 'stock-plv-visuals', true)
on conflict (id) do nothing;

-- Policies storage : lecture publique, écriture utilisateurs connectés
do $$
declare
  b text;
begin
  foreach b in array array[
    'idena-mark', 'member-avatars', 'company-logos',
    'event-documents', 'social-post-visuals', 'stock-plv-visuals'
  ] loop
    execute format('drop policy if exists %I on storage.objects', b || '_public_read');
    execute format(
      'create policy %I on storage.objects for select to public using (bucket_id = %L)',
      b || '_public_read', b
    );
    execute format('drop policy if exists %I on storage.objects', b || '_auth_write');
    execute format(
      'create policy %I on storage.objects for all to authenticated using (bucket_id = %L) with check (bucket_id = %L)',
      b || '_auth_write', b, b
    );
  end loop;
end $$;
