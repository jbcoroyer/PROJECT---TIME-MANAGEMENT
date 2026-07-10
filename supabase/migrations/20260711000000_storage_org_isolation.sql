-- Cloisonnement Storage par organisation (profiles.organization_id → current_org_id()).
-- Convention de chemin : {organization_id}/… (1er segment du chemin = UUID org).
-- Remplace les anciennes policies « lecture publique + écriture authenticated globale ».

-- ─── Buckets privés : accès uniquement via RLS + URLs signées ───
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

-- ─── Suppression de toutes les policies storage historiques ───
do $$
declare
  b text;
  pol text;
begin
  foreach b in array array[
    'idena-mark', 'member-avatars', 'company-logos',
    'event-documents', 'social-post-visuals', 'stock-plv-visuals'
  ] loop
    foreach pol in array array[
      b || '_public_read',
      b || '_auth_write',
      b || '_select_member',
      b || '_insert_member',
      b || '_update_member',
      b || '_delete_member',
      b || '_select_org',
      b || '_insert_org',
      b || '_update_org',
      b || '_delete_org',
      b || '_select_legacy_public'
    ] loop
      execute format('drop policy if exists %I on storage.objects', pol);
    end loop;
  end loop;
end $$;

-- ─── Policies par bucket : SELECT / INSERT / UPDATE / DELETE ───
-- Règle : le 1er dossier du chemin doit correspondre à l'organisation de l'utilisateur connecté.

do $$
declare
  b text;
begin
  foreach b in array array[
    'member-avatars', 'company-logos',
    'event-documents', 'social-post-visuals', 'stock-plv-visuals'
  ] loop
    -- SELECT : lire uniquement les fichiers de son organisation
    execute format($sql$
      create policy %I on storage.objects
        for select to authenticated
        using (
          bucket_id = %L
          and (storage.foldername(name))[1]::uuid = public.current_org_id()
        )
    $sql$, b || '_select_org', b);

    -- INSERT : déposer uniquement dans le dossier de son organisation
    execute format($sql$
      create policy %I on storage.objects
        for insert to authenticated
        with check (
          bucket_id = %L
          and (storage.foldername(name))[1]::uuid = public.current_org_id()
        )
    $sql$, b || '_insert_org', b);

    -- UPDATE : modifier uniquement les fichiers de son organisation
    execute format($sql$
      create policy %I on storage.objects
        for update to authenticated
        using (
          bucket_id = %L
          and (storage.foldername(name))[1]::uuid = public.current_org_id()
        )
        with check (
          bucket_id = %L
          and (storage.foldername(name))[1]::uuid = public.current_org_id()
        )
    $sql$, b || '_update_org', b, b);

    -- DELETE : supprimer uniquement les fichiers de son organisation
    execute format($sql$
      create policy %I on storage.objects
        for delete to authenticated
        using (
          bucket_id = %L
          and (storage.foldername(name))[1]::uuid = public.current_org_id()
        )
    $sql$, b || '_delete_org', b);
  end loop;
end $$;

-- ─── Bucket idena-mark (pictogramme app) ───
-- Même cloisonnement pour les utilisateurs connectés…

create policy idena_mark_select_org on storage.objects
  for select to authenticated
  using (
    bucket_id = 'idena-mark'
    and (storage.foldername(name))[1]::uuid = public.current_org_id()
  );

create policy idena_mark_insert_org on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'idena-mark'
    and (storage.foldername(name))[1]::uuid = public.current_org_id()
  );

create policy idena_mark_update_org on storage.objects
  for update to authenticated
  using (
    bucket_id = 'idena-mark'
    and (storage.foldername(name))[1]::uuid = public.current_org_id()
  )
  with check (
    bucket_id = 'idena-mark'
    and (storage.foldername(name))[1]::uuid = public.current_org_id()
  );

create policy idena_mark_delete_org on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'idena-mark'
    and (storage.foldername(name))[1]::uuid = public.current_org_id()
  );

-- …et lecture publique limitée à l'organisation legacy (page de connexion avant auth).
create policy idena_mark_select_legacy_public on storage.objects
  for select to public
  using (
    bucket_id = 'idena-mark'
    and (storage.foldername(name))[1]::uuid = '00000000-0000-0000-0000-000000000001'::uuid
  );

comment on policy idena_mark_select_legacy_public on storage.objects is
  'Pictogramme visible sur la page publique de connexion (org legacy uniquement).';
