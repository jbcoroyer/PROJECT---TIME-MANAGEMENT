-- Phase 5 : taxonomies métier configurables (thématiques social, espèces print).
-- Phase 6 : neutralisation des libellés de questionnaires amorcés.

alter table public.app_settings
  add column if not exists social_thematics jsonb not null default '[
    "Événement",
    "Marque",
    "Vie entreprise",
    "Produit",
    "Clients",
    "Presse"
  ]'::jsonb,
  add column if not exists print_species jsonb not null default '[
    {"value": "general", "label": "Général"}
  ]'::jsonb;

-- Questionnaires : titres et descriptions neutres (contenu JSON inchangé).
update public.survey_definitions
set
  title = 'Questionnaire de satisfaction',
  description = 'Recueillez l''avis de vos publics sur vos prestations et votre accompagnement.'
where id = 'satisfaction-2026';

update public.survey_definitions
set
  title = 'Questionnaire interne — Fonctionnement',
  description = 'Évaluez le fonctionnement de l''équipe et les processus internes.'
where id = 'service-interne-2026';
