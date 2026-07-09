-- Phase 1 white-label : configuration centrale (branding + réglages org).

alter table public.app_settings
  add column if not exists app_name text,
  add column if not exists app_short_name text,
  add column if not exists tagline text,
  add column if not exists logo_url text,
  add column if not exists icon_url text,
  add column if not exists mark_url text,
  add column if not exists primary_color text,
  add column if not exists locale text,
  add column if not exists timezone text,
  add column if not exists sector text,
  add column if not exists outlook_category_name text,
  add column if not exists default_public_survey_id text,
  add column if not exists is_configured boolean not null default false;

-- Rétrocompat : ancienne colonne pictogramme → mark_url
update public.app_settings
set mark_url = idena_mark_url
where (mark_url is null or btrim(mark_url) = '')
  and idena_mark_url is not null
  and btrim(idena_mark_url) <> '';

insert into public.app_settings (id)
values ('default')
on conflict (id) do nothing;
