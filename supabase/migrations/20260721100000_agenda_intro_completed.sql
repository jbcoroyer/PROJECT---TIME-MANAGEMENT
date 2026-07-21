-- Flag intro agenda (popup obligatoire à la première visite du module).
alter table public.app_settings
  add column if not exists agenda_intro_completed boolean not null default false;
