-- Cloisonnement Supabase Storage par organisation.
-- Convention de chemin : {organization_id}/… (1er segment = UUID d'organisation).
-- Vérifie l'appartenance via organization_members (synchronisé depuis profiles).

-- ─── Table organization_members (source de vérité pour les policies storage) ───

create table if not exists public.organization_members (
  user_id uuid not null references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (user_id, organization_id)
);

create index if not exists organization_members_org_id_idx
  on public.organization_members (organization_id);

-- Remplissage initial depuis les profils existants
insert into public.organization_members (user_id, organization_id, role)
select
  p.id,
  p.organization_id,
  case when p.role = 'admin' then 'admin' else 'member' end
from public.profiles p
where p.organization_id is not null
on conflict (user_id, organization_id) do update
  set role = excluded.role;

-- Synchronisation automatique profiles → organization_members
create or replace function public.sync_organization_member_from_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.organization_members where user_id = old.id;
    return old;
  end if;

  insert into public.organization_members (user_id, organization_id, role)
  values (
    new.id,
    new.organization_id,
    case when new.role = 'admin' then 'admin' else 'member' end
  )
  on conflict (user_id, organization_id) do update
    set role = excluded.role;

  if tg_op = 'UPDATE' and old.organization_id is distinct from new.organization_id then
    delete from public.organization_members
    where user_id = new.id and organization_id = old.organization_id;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_sync_organization_member on public.profiles;
create trigger profiles_sync_organization_member
  after insert or update or delete on public.profiles
  for each row
  execute function public.sync_organization_member_from_profile();

alter table public.organization_members enable row level security;

drop policy if exists organization_members_select_own on public.organization_members;
create policy organization_members_select_own on public.organization_members
  for select to authenticated
  using (user_id = auth.uid());

-- ─── Helper : l'utilisateur connecté est-il membre de cette organisation ? ───

create or replace function public.user_belongs_to_org(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.user_id = auth.uid()
      and om.organization_id = p_org_id
  );
$$;

-- ─── Helper : extrait l'organization_id du 1er segment du chemin storage ───

create or replace function public.storage_object_org_id(p_name text)
returns uuid
language sql
immutable
as $$
  select case
    when (storage.foldername(p_name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then (storage.foldername(p_name))[1]::uuid
    else null
  end;
$$;

-- ─── Buckets privés (accès via RLS + URLs signées) ───

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

-- ─── Suppression des anciennes policies (lecture publique + écriture globale) ───

do $$
declare
  b text;
  pol text;
begin
  foreach b in array array[
    'idena-mark', 'member-avatars', 'company-logos',
    'event-documents', 'social-post-visuals', 'stock-plv-visuals'
  ] loop
    foreach pol in array array[b || '_public_read', b || '_auth_write'] loop
      execute format('drop policy if exists %I on storage.objects', pol);
    end loop;
    -- Policies nommées par opération (idempotence)
    foreach pol in array array[
      b || '_select_member',
      b || '_insert_member',
      b || '_update_member',
      b || '_delete_member'
    ] loop
      execute format('drop policy if exists %I on storage.objects', pol);
    end loop;
  end loop;
end $$;

-- ─── Policies par bucket : SELECT / INSERT / UPDATE / DELETE ───
-- Règle commune : le 1er dossier du chemin doit être un UUID d'organisation
-- dont l'utilisateur connecté est membre (jointure organization_members).

do $$
declare
  b text;
begin
  foreach b in array array[
    'idena-mark', 'member-avatars', 'company-logos',
    'event-documents', 'social-post-visuals', 'stock-plv-visuals'
  ] loop
    -- SELECT : lire uniquement les fichiers de ses organisations
    execute format($sql$
      create policy %I on storage.objects
        for select to authenticated
        using (
          bucket_id = %L
          and public.storage_object_org_id(name) is not null
          and public.user_belongs_to_org(public.storage_object_org_id(name))
        )
    $sql$, b || '_select_member', b);

    -- INSERT : déposer uniquement dans le dossier de ses organisations
    execute format($sql$
      create policy %I on storage.objects
        for insert to authenticated
        with check (
          bucket_id = %L
          and public.storage_object_org_id(name) is not null
          and public.user_belongs_to_org(public.storage_object_org_id(name))
        )
    $sql$, b || '_insert_member', b);

    -- UPDATE : modifier uniquement les fichiers de ses organisations
    execute format($sql$
      create policy %I on storage.objects
        for update to authenticated
        using (
          bucket_id = %L
          and public.storage_object_org_id(name) is not null
          and public.user_belongs_to_org(public.storage_object_org_id(name))
        )
        with check (
          bucket_id = %L
          and public.storage_object_org_id(name) is not null
          and public.user_belongs_to_org(public.storage_object_org_id(name))
        )
    $sql$, b || '_update_member', b, b);

    -- DELETE : supprimer uniquement les fichiers de ses organisations
    execute format($sql$
      create policy %I on storage.objects
        for delete to authenticated
        using (
          bucket_id = %L
          and public.storage_object_org_id(name) is not null
          and public.user_belongs_to_org(public.storage_object_org_id(name))
        )
    $sql$, b || '_delete_member', b);
  end loop;
end $$;

comment on function public.user_belongs_to_org(uuid) is
  'Vérifie que auth.uid() est membre de l''organisation (table organization_members).';

comment on function public.storage_object_org_id(text) is
  'Retourne l''UUID du 1er segment du chemin storage, ou NULL si invalide.';
