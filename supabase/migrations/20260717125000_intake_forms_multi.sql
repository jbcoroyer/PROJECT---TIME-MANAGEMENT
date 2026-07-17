-- Autoriser plusieurs formulaires de demande par organisation.

alter table public.intake_forms
  drop constraint if exists intake_forms_org_unique;

create index if not exists intake_forms_org_created_idx
  on public.intake_forms (organization_id, created_at desc);
