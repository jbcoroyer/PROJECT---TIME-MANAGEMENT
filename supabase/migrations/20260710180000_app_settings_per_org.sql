-- app_settings : une ligne par organisation (id = organization_id::text).

alter table public.app_settings drop constraint if exists app_settings_organization_id_key;
alter table public.app_settings
  add constraint app_settings_organization_id_key unique (organization_id);

-- Désactive les triggers d'organisation le temps du backfill (connexion admin sans auth.uid()).
alter table public.app_settings disable trigger user;

update public.app_settings
set id = organization_id::text
where id = 'default' or id is distinct from organization_id::text;

alter table public.app_settings enable trigger user;
