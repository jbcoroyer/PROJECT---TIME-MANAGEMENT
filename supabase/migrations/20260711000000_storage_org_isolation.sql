-- Cloisonnement Storage par organisation (profiles.organization_id → current_org_id()).
-- Convention de chemin : {organization_id}/… (1er segment du chemin = UUID org).
--
-- ⚠️ Sur Supabase hébergé : exécuter via le session pooler (pas le SQL Editor).
--    Connexion : postgres.{project_ref} @ …pooler.supabase.com:5432
--    CLI : npx supabase db query --linked -f supabase/migrations/20260711000000_storage_org_isolation.sql

-- ─── 1. Buckets privés (accès via RLS + URLs signées) ───
update storage.buckets
set public = false
where id in (
  'idena-mark',
  'member-avatars',
  'company-logos',
  'event-documents',
  'social-post-visuals',
  'stock-plv-visuals'
);

-- ─── 2. Suppression des anciennes policies ───
drop policy if exists idena_mark_select_org on storage.objects;
drop policy if exists idena_mark_insert_org on storage.objects;
drop policy if exists idena_mark_update_org on storage.objects;
drop policy if exists idena_mark_delete_org on storage.objects;
drop policy if exists idena_mark_select_legacy_public on storage.objects;

-- Anciennes policies (underscores)
drop policy if exists idena_mark_public_read on storage.objects;
drop policy if exists idena_mark_auth_write on storage.objects;
drop policy if exists member_avatars_public_read on storage.objects;
drop policy if exists member_avatars_auth_write on storage.objects;
drop policy if exists company_logos_public_read on storage.objects;
drop policy if exists company_logos_auth_write on storage.objects;
drop policy if exists event_documents_public_read on storage.objects;
drop policy if exists event_documents_auth_write on storage.objects;
drop policy if exists social_post_visuals_public_read on storage.objects;
drop policy if exists social_post_visuals_auth_write on storage.objects;
drop policy if exists stock_plv_visuals_public_read on storage.objects;
drop policy if exists stock_plv_visuals_auth_write on storage.objects;

-- Anciennes policies (tirets — créées via Dashboard Storage)
drop policy if exists "idena-mark_public_read" on storage.objects;
drop policy if exists "idena-mark_auth_write" on storage.objects;
drop policy if exists "member-avatars_public_read" on storage.objects;
drop policy if exists "member-avatars_auth_write" on storage.objects;
drop policy if exists "company-logos_public_read" on storage.objects;
drop policy if exists "company-logos_auth_write" on storage.objects;
drop policy if exists "event-documents_public_read" on storage.objects;
drop policy if exists "event-documents_auth_write" on storage.objects;
drop policy if exists "social-post-visuals_public_read" on storage.objects;
drop policy if exists "social-post-visuals_auth_write" on storage.objects;
drop policy if exists "stock-plv-visuals_public_read" on storage.objects;
drop policy if exists "stock-plv-visuals_auth_write" on storage.objects;

-- Policies intermédiaires (migrations précédentes)
drop policy if exists member_avatars_select_org on storage.objects;
drop policy if exists member_avatars_insert_org on storage.objects;
drop policy if exists member_avatars_update_org on storage.objects;
drop policy if exists member_avatars_delete_org on storage.objects;
drop policy if exists company_logos_select_org on storage.objects;
drop policy if exists company_logos_insert_org on storage.objects;
drop policy if exists company_logos_update_org on storage.objects;
drop policy if exists company_logos_delete_org on storage.objects;
drop policy if exists event_documents_select_org on storage.objects;
drop policy if exists event_documents_insert_org on storage.objects;
drop policy if exists event_documents_update_org on storage.objects;
drop policy if exists event_documents_delete_org on storage.objects;
drop policy if exists social_post_visuals_select_org on storage.objects;
drop policy if exists social_post_visuals_insert_org on storage.objects;
drop policy if exists social_post_visuals_update_org on storage.objects;
drop policy if exists social_post_visuals_delete_org on storage.objects;
drop policy if exists stock_plv_visuals_select_org on storage.objects;
drop policy if exists stock_plv_visuals_insert_org on storage.objects;
drop policy if exists stock_plv_visuals_update_org on storage.objects;
drop policy if exists stock_plv_visuals_delete_org on storage.objects;
drop policy if exists idena_mark_select_member on storage.objects;
drop policy if exists idena_mark_insert_member on storage.objects;
drop policy if exists idena_mark_update_member on storage.objects;
drop policy if exists idena_mark_delete_member on storage.objects;

-- ─── 3. POLICIES — buckets métier (authenticated uniquement) ───
-- Règle : 1er segment du chemin = organization_id de l'utilisateur (current_org_id).

create policy member_avatars_select_org on storage.objects
  for select to authenticated
  using (
    bucket_id = 'member-avatars'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

create policy member_avatars_insert_org on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'member-avatars'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

create policy member_avatars_update_org on storage.objects
  for update to authenticated
  using (
    bucket_id = 'member-avatars'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  )
  with check (
    bucket_id = 'member-avatars'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

create policy member_avatars_delete_org on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'member-avatars'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

-- company-logos
create policy company_logos_select_org on storage.objects
  for select to authenticated
  using (
    bucket_id = 'company-logos'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

create policy company_logos_insert_org on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'company-logos'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

create policy company_logos_update_org on storage.objects
  for update to authenticated
  using (
    bucket_id = 'company-logos'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  )
  with check (
    bucket_id = 'company-logos'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

create policy company_logos_delete_org on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'company-logos'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

-- event-documents
create policy event_documents_select_org on storage.objects
  for select to authenticated
  using (
    bucket_id = 'event-documents'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

create policy event_documents_insert_org on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'event-documents'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

create policy event_documents_update_org on storage.objects
  for update to authenticated
  using (
    bucket_id = 'event-documents'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  )
  with check (
    bucket_id = 'event-documents'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

create policy event_documents_delete_org on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'event-documents'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

-- social-post-visuals
create policy social_post_visuals_select_org on storage.objects
  for select to authenticated
  using (
    bucket_id = 'social-post-visuals'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

create policy social_post_visuals_insert_org on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'social-post-visuals'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

create policy social_post_visuals_update_org on storage.objects
  for update to authenticated
  using (
    bucket_id = 'social-post-visuals'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  )
  with check (
    bucket_id = 'social-post-visuals'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

create policy social_post_visuals_delete_org on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'social-post-visuals'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

-- stock-plv-visuals
create policy stock_plv_visuals_select_org on storage.objects
  for select to authenticated
  using (
    bucket_id = 'stock-plv-visuals'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

create policy stock_plv_visuals_insert_org on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'stock-plv-visuals'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

create policy stock_plv_visuals_update_org on storage.objects
  for update to authenticated
  using (
    bucket_id = 'stock-plv-visuals'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  )
  with check (
    bucket_id = 'stock-plv-visuals'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

create policy stock_plv_visuals_delete_org on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'stock-plv-visuals'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

-- ─── 4. Bucket idena-mark (pictogramme) ───
-- Connectés : leur org. Public (anon) : org legacy uniquement (page de connexion).

create policy idena_mark_select_org on storage.objects
  for select to authenticated
  using (
    bucket_id = 'idena-mark'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

create policy idena_mark_insert_org on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'idena-mark'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

create policy idena_mark_update_org on storage.objects
  for update to authenticated
  using (
    bucket_id = 'idena-mark'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  )
  with check (
    bucket_id = 'idena-mark'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

create policy idena_mark_delete_org on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'idena-mark'
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

create policy idena_mark_select_legacy_public on storage.objects
  for select to public
  using (
    bucket_id = 'idena-mark'
    and (storage.foldername(name))[1] = '00000000-0000-0000-0000-000000000001'
  );
