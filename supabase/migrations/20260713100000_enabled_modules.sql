-- Modules activables à la carte par organisation (onboarding + paramètres).
alter table public.app_settings
  add column if not exists enabled_modules jsonb;

comment on column public.app_settings.enabled_modules is
  'Liste JSON des IDs de modules activés. null = tous les modules (rétro-compatibilité).';
