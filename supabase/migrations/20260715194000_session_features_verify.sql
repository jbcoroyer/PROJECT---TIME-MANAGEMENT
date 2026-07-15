-- Vérification idempotente : schéma des fonctionnalités récentes
-- (demandes éditables, agenda, image événement, sécurité questionnaires, realtime agenda)

-- ─── Demandes : formulaire JSON éditable ───────────────────────────────────
alter table public.intake_forms
  add column if not exists definition jsonb not null default '{}'::jsonb;

alter table public.intake_requests
  add column if not exists intake_form_id uuid references public.intake_forms (id) on delete set null;

create index if not exists intake_requests_form_id_idx on public.intake_requests (intake_form_id);

-- ─── Événements : image de couverture ──────────────────────────────────────
alter table public.events
  add column if not exists cover_image_path text;

comment on column public.events.cover_image_path is
  'Chemin storage (bucket event-documents) de l''image de couverture.';

-- ─── Questionnaires : RLS org-only pour les utilisateurs authentifiés ───────
drop policy if exists survey_definitions_select on public.survey_definitions;
drop policy if exists survey_definitions_select_auth on public.survey_definitions;

create policy survey_definitions_select_auth on public.survey_definitions
  for select to authenticated
  using (organization_id = public.current_org_id());

revoke select on public.survey_definitions from anon;

-- ─── Agenda : Realtime pour rafraîchissement calendrier ─────────────────────
do $$ begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'agenda_appointments'
  ) and not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'agenda_appointments'
  ) then
    alter publication supabase_realtime add table public.agenda_appointments;
  end if;
end $$;

notify pgrst, 'reload schema';
