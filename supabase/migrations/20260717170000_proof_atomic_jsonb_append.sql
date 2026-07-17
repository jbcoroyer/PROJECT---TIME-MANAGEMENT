-- Append atomique sur les colonnes JSONB de public.proofs (commentaires, versions, approbateurs).
-- Évite les courses read-modify-write côté client.

drop function if exists public.append_proof_comment(uuid, jsonb);
drop function if exists public.append_proof_version(uuid, jsonb, integer);
drop function if exists public.append_proof_approver(uuid, jsonb);
drop function if exists public.append_proof_version(uuid, text, text);
drop function if exists public.set_proof_approver_decision(uuid, text, text);
drop function if exists public.derive_proof_status(jsonb, text);

create or replace function public.derive_proof_status(
  p_approvers jsonb,
  p_current_status text
)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  v_approvers jsonb := coalesce(p_approvers, '[]'::jsonb);
begin
  if jsonb_array_length(v_approvers) = 0 then
    if p_current_status = 'draft' then
      return 'draft';
    end if;
    return 'in_review';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(v_approvers) as elem(value)
    where coalesce(elem.value->>'decision', 'pending') = 'rejected'
  ) then
    return 'changes_requested';
  end if;

  if not exists (
    select 1
    from jsonb_array_elements(v_approvers) as elem(value)
    where coalesce(elem.value->>'decision', 'pending') <> 'approved'
  ) then
    return 'approved';
  end if;

  return 'in_review';
end;
$$;

create or replace function public.append_proof_comment(
  p_proof_id uuid,
  p_comment jsonb
)
returns table (
  proof_id uuid,
  comment jsonb,
  comments jsonb,
  current_version integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_row public.proofs%rowtype;
begin
  v_org_id := public.current_org_id();
  if v_org_id is null then
    raise exception 'Aucune organisation associée au profil utilisateur';
  end if;

  if p_comment is null or p_comment = 'null'::jsonb then
    raise exception 'Le commentaire ne peut pas être vide';
  end if;
  if coalesce(p_comment->>'id', '') = '' then
    raise exception 'Le commentaire doit avoir un identifiant';
  end if;

  update public.proofs as p
  set comments = coalesce(p.comments, '[]'::jsonb) || jsonb_build_array(p_comment)
  where p.id = p_proof_id
    and p.organization_id = v_org_id
  returning p.* into v_row;

  if v_row.id is null then
    raise exception 'Épreuve introuvable ou non autorisée';
  end if;

  proof_id := v_row.id;
  comment := p_comment;
  comments := v_row.comments;
  current_version := v_row.current_version;
  return next;
end;
$$;

create or replace function public.append_proof_version(
  p_proof_id uuid,
  p_visual_url text default null,
  p_note text default null
)
returns table (
  proof_id uuid,
  version jsonb,
  new_version integer,
  visual_url text,
  current_version integer,
  versions jsonb,
  approvers jsonb,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_row public.proofs%rowtype;
  v_new_version integer;
  v_visual text;
  v_version jsonb;
  v_approvers jsonb;
  v_now text;
begin
  v_org_id := public.current_org_id();
  if v_org_id is null then
    raise exception 'Aucune organisation associée au profil utilisateur';
  end if;

  select p.*
  into v_row
  from public.proofs as p
  where p.id = p_proof_id
    and p.organization_id = v_org_id
  for update;

  if v_row.id is null then
    raise exception 'Épreuve introuvable ou non autorisée';
  end if;

  v_new_version := coalesce(v_row.current_version, 1) + 1;
  v_visual := coalesce(nullif(btrim(p_visual_url), ''), v_row.visual_url);
  v_now := to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  v_version := jsonb_build_object(
    'n', v_new_version,
    'visualUrl', v_visual,
    'note', coalesce(nullif(btrim(p_note), ''), format('Version %s', v_new_version)),
    'createdAt', v_now
  );

  v_approvers := coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'name', elem.value->>'name',
          'decision', 'pending',
          'decidedAt', null
        )
      )
      from jsonb_array_elements(coalesce(v_row.approvers, '[]'::jsonb)) as elem(value)
    ),
    '[]'::jsonb
  );

  update public.proofs as p
  set
    current_version = v_new_version,
    visual_url = v_visual,
    status = 'in_review',
    approvers = v_approvers,
    versions = coalesce(p.versions, '[]'::jsonb) || jsonb_build_array(v_version)
  where p.id = p_proof_id
    and p.organization_id = v_org_id
  returning p.* into v_row;

  proof_id := v_row.id;
  version := v_version;
  new_version := v_new_version;
  visual_url := v_row.visual_url;
  current_version := v_row.current_version;
  versions := v_row.versions;
  approvers := v_row.approvers;
  status := v_row.status;
  return next;
end;
$$;

create or replace function public.set_proof_approver_decision(
  p_proof_id uuid,
  p_approver_name text,
  p_decision text
)
returns table (
  proof_id uuid,
  approver_name text,
  decision text,
  approvers jsonb,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_row public.proofs%rowtype;
  v_name text;
  v_decision text;
  v_now text;
  v_found boolean := false;
  v_approvers jsonb;
  v_status text;
begin
  v_org_id := public.current_org_id();
  if v_org_id is null then
    raise exception 'Aucune organisation associée au profil utilisateur';
  end if;

  v_name := btrim(p_approver_name);
  if v_name is null or v_name = '' then
    raise exception 'Le nom de l''approbateur est requis';
  end if;

  v_decision := btrim(p_decision);
  if v_decision not in ('approved', 'rejected') then
    raise exception 'Décision invalide (approved ou rejected attendu)';
  end if;

  select p.*
  into v_row
  from public.proofs as p
  where p.id = p_proof_id
    and p.organization_id = v_org_id
  for update;

  if v_row.id is null then
    raise exception 'Épreuve introuvable ou non autorisée';
  end if;

  v_now := to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');

  v_approvers := coalesce(
    (
      select jsonb_agg(
        case
          when elem.value->>'name' = v_name then
            jsonb_build_object(
              'name', elem.value->>'name',
              'decision', v_decision,
              'decidedAt', v_now
            )
          else elem.value
        end
      )
      from jsonb_array_elements(coalesce(v_row.approvers, '[]'::jsonb)) as elem(value)
    ),
    '[]'::jsonb
  );

  select exists (
    select 1
    from jsonb_array_elements(coalesce(v_row.approvers, '[]'::jsonb)) as elem(value)
    where elem.value->>'name' = v_name
  )
  into v_found;

  if not v_found then
    raise exception 'Approbateur introuvable sur cette épreuve';
  end if;

  v_status := public.derive_proof_status(v_approvers, v_row.status);

  update public.proofs as p
  set
    approvers = v_approvers,
    status = v_status
  where p.id = p_proof_id
    and p.organization_id = v_org_id
  returning p.* into v_row;

  proof_id := v_row.id;
  approver_name := v_name;
  decision := v_decision;
  approvers := v_row.approvers;
  status := v_row.status;
  return next;
end;
$$;

grant execute on function public.append_proof_comment(uuid, jsonb) to authenticated;
grant execute on function public.append_proof_version(uuid, text, text) to authenticated;
grant execute on function public.set_proof_approver_decision(uuid, text, text) to authenticated;
