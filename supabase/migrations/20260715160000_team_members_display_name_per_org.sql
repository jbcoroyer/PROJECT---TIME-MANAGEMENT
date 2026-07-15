-- B2C multi-tenant : le nom affiché doit être unique par organisation, pas globalement.
-- L'ancienne contrainte UNIQUE(display_name) bloquait les nouvelles inscriptions OAuth
-- quand un homonyme existait déjà dans une autre org (ex. après suppression auth.users).

alter table public.team_members
  drop constraint if exists team_members_display_name_key;

create unique index if not exists team_members_organization_id_display_name_key
  on public.team_members (organization_id, display_name);
