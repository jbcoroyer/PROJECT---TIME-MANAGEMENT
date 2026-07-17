-- Onboarding stock : catégories personnalisables par organisation

alter table public.app_settings
  add column if not exists inventory_categories jsonb not null default '[]'::jsonb,
  add column if not exists stock_onboarding_completed boolean not null default false;

-- Organisations déjà configurées ou avec inventaire : pas de re-onboarding
alter table public.app_settings disable trigger app_settings_enforce_org;

update public.app_settings s
set stock_onboarding_completed = true
where stock_onboarding_completed = false
  and (
    s.is_configured = true
    or exists (
      select 1
      from public.inventory_items i
      where i.organization_id = s.organization_id
    )
  );

alter table public.app_settings enable trigger app_settings_enforce_org;

-- Assouplir la contrainte catégorie (slugs personnalisés)
alter table public.inventory_items
  drop constraint if exists inventory_items_category_check;

alter table public.inventory_items
  add constraint inventory_items_category_check
  check (char_length(trim(category)) > 0 and char_length(category) <= 80);
