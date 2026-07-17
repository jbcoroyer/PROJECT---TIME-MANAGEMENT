-- RLS : DELETE réservé aux admins, SELECT/INSERT/UPDATE ouverts pour authenticated (mono-org).
-- Ne touche pas : stock_ideas (anon), intake_requests anon insert, survey_responses, outlook_*.

-- ─── Helper admin ───────────────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;
revoke all on function public.is_admin() from anon;

-- ─── Tables standard : org isolation, DELETE admin ──────────────────────────
do $$
declare
  t text;
  tables text[] := array[
    'team_members', 'companies', 'domains', 'workflow_columns',
    'events', 'projects', 'tasks', 'task_assignees',
    'expenses', 'social_posts', 'social_monthly_targets', 'stock_movements',
    'event_run_slots', 'event_material_needs', 'event_document_meta',
    'automation_rules', 'proofs', 'inventory_items', 'profiles',
    'dam_assets', 'objectives', 'key_results', 'event_retex',
    'intake_forms',
    'agenda_settings', 'agenda_appointments', 'agenda_appointment_notes',
    'agenda_appointment_requests'
  ];
begin
  foreach t in array tables loop
    execute format('drop policy if exists %I on public.%I', t || '_isolation', t);
    execute format('drop policy if exists %I on public.%I', t || '_all', t);

    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format(
      $sql$
        create policy %I on public.%I
          for select to authenticated
          using (organization_id = public.current_org_id())
      $sql$,
      t || '_select',
      t
    );

    execute format('drop policy if exists %I on public.%I', t || '_insert', t);
    execute format(
      $sql$
        create policy %I on public.%I
          for insert to authenticated
          with check (organization_id = public.current_org_id())
      $sql$,
      t || '_insert',
      t
    );

    execute format('drop policy if exists %I on public.%I', t || '_update', t);
    execute format(
      $sql$
        create policy %I on public.%I
          for update to authenticated
          using (organization_id = public.current_org_id())
          with check (organization_id = public.current_org_id())
      $sql$,
      t || '_update',
      t
    );

    execute format('drop policy if exists %I on public.%I', t || '_delete', t);
    execute format(
      $sql$
        create policy %I on public.%I
          for delete to authenticated
          using (
            organization_id = public.current_org_id()
            and public.is_admin()
          )
      $sql$,
      t || '_delete',
      t
    );
  end loop;
end $$;

-- ─── intake_requests : split isolation, conserver anon insert ───────────────
drop policy if exists intake_requests_isolation on public.intake_requests;
drop policy if exists intake_requests_all on public.intake_requests;

drop policy if exists intake_requests_select on public.intake_requests;
create policy intake_requests_select on public.intake_requests
  for select to authenticated
  using (organization_id = public.current_org_id());

drop policy if exists intake_requests_insert on public.intake_requests;
create policy intake_requests_insert on public.intake_requests
  for insert to authenticated
  with check (organization_id = public.current_org_id());

drop policy if exists intake_requests_update on public.intake_requests;
create policy intake_requests_update on public.intake_requests
  for update to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

drop policy if exists intake_requests_delete on public.intake_requests;
create policy intake_requests_delete on public.intake_requests
  for delete to authenticated
  using (organization_id = public.current_org_id() and public.is_admin());

-- intake_requests_anon_insert : inchangé (non recréé ici)

-- ─── app_settings : split write, conserver select anon legacy ───────────────
drop policy if exists app_settings_write on public.app_settings;

drop policy if exists app_settings_insert on public.app_settings;
create policy app_settings_insert on public.app_settings
  for insert to authenticated
  with check (organization_id = public.current_org_id());

drop policy if exists app_settings_update on public.app_settings;
create policy app_settings_update on public.app_settings
  for update to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

drop policy if exists app_settings_delete on public.app_settings;
create policy app_settings_delete on public.app_settings
  for delete to authenticated
  using (organization_id = public.current_org_id() and public.is_admin());

-- app_settings_select (anon legacy) et app_settings_select_auth : inchangés

-- ─── Boards modulaires : DELETE admin ───────────────────────────────────────
drop policy if exists boards_delete on public.boards;
create policy boards_delete on public.boards
  for delete to authenticated
  using (organization_id = public.current_org_id() and public.is_admin());

drop policy if exists board_columns_delete on public.board_columns;
create policy board_columns_delete on public.board_columns
  for delete to authenticated
  using (organization_id = public.current_org_id() and public.is_admin());

drop policy if exists board_fields_delete on public.board_fields;
create policy board_fields_delete on public.board_fields
  for delete to authenticated
  using (organization_id = public.current_org_id() and public.is_admin());

-- ─── LinkedIn metrics : ajout DELETE admin ──────────────────────────────────
drop policy if exists linkedin_metrics_delete on public.linkedin_company_metrics;
create policy linkedin_metrics_delete on public.linkedin_company_metrics
  for delete to authenticated
  using (
    public.is_admin()
    and (organization_id is null or organization_id = public.current_org_id())
  );

-- ─── Storage : DELETE admin par bucket ──────────────────────────────────────
drop policy if exists member_avatars_delete_org on storage.objects;
create policy member_avatars_delete_org on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'member-avatars'
    and (storage.foldername(name))[1] = public.current_org_id()::text
    and public.is_admin()
  );

drop policy if exists company_logos_delete_org on storage.objects;
create policy company_logos_delete_org on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'company-logos'
    and (storage.foldername(name))[1] = public.current_org_id()::text
    and public.is_admin()
  );

drop policy if exists event_documents_delete_org on storage.objects;
create policy event_documents_delete_org on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'event-documents'
    and (storage.foldername(name))[1] = public.current_org_id()::text
    and public.is_admin()
  );

drop policy if exists social_post_visuals_delete_org on storage.objects;
create policy social_post_visuals_delete_org on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'social-post-visuals'
    and (storage.foldername(name))[1] = public.current_org_id()::text
    and public.is_admin()
  );

drop policy if exists stock_plv_visuals_delete_org on storage.objects;
create policy stock_plv_visuals_delete_org on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'stock-plv-visuals'
    and (storage.foldername(name))[1] = public.current_org_id()::text
    and public.is_admin()
  );

drop policy if exists idena_mark_delete_org on storage.objects;
create policy idena_mark_delete_org on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'idena-mark'
    and (storage.foldername(name))[1] = public.current_org_id()::text
    and public.is_admin()
  );

notify pgrst, 'reload schema';
