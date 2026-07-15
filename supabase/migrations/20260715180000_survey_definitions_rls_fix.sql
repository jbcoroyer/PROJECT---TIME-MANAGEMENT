-- Corrige la fuite cross-tenant sur survey_definitions (policy USING (true) introduite en B2C).
-- Lecture authentifiée : organisation courante uniquement.
-- Lecture publique anonyme : via service role dans les Server Actions (ID = secret).

drop policy if exists survey_definitions_select on public.survey_definitions;
drop policy if exists survey_definitions_select_auth on public.survey_definitions;

create policy survey_definitions_select_auth on public.survey_definitions
  for select to authenticated
  using (organization_id = public.current_org_id());

revoke select on public.survey_definitions from anon;

notify pgrst, 'reload schema';
