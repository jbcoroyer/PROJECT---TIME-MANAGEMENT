-- P0 : durcissement sécurité — fonctions internes non exposées via PostgREST RPC.

-- search_path figé (advisor Supabase)
create or replace function public.slugify_org_name(p_name text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  v_slug text;
begin
  v_slug := lower(regexp_replace(coalesce(p_name, ''), '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := regexp_replace(v_slug, '^-+|-+$', '', 'g');
  v_slug := left(v_slug, 48);
  return coalesce(nullif(v_slug, ''), 'espace');
end;
$$;

create or replace function public.unique_org_slug(p_base text)
returns text
language plpgsql
set search_path = public
as $$
declare
  v_slug text;
  v_suffix int := 0;
begin
  v_slug := public.slugify_org_name(p_base);
  while exists (select 1 from public.organizations where slug = v_slug) loop
    v_suffix := v_suffix + 1;
    v_slug := left(public.slugify_org_name(p_base), 40) || '-' || v_suffix;
  end loop;
  return v_slug;
end;
$$;

-- Révoque l'exécution RPC pour les rôles exposés à l'API (les triggers continuent de fonctionner).
do $$
declare
  fn record;
begin
  for fn in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'current_org_id',
        'enforce_row_organization_id',
        'handle_new_user',
        'is_admin',
        'rls_auto_enable',
        'slugify_org_name',
        'unique_org_slug'
      )
  loop
    execute format('revoke all on function %s from public', fn.sig);
    execute format('revoke all on function %s from anon', fn.sig);
    execute format('revoke all on function %s from authenticated', fn.sig);
  end loop;
end $$;
