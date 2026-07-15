-- Définition éditable du formulaire de demandes (structure type questionnaire).

alter table public.intake_forms
  add column if not exists definition jsonb not null default '{}'::jsonb;
