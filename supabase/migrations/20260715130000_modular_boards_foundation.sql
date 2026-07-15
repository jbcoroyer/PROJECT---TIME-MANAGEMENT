-- Fondations boards connectes
create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  name text not null, icon text, color text,
  position int not null default 0,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);
create index if not exists boards_organization_id_idx on public.boards (organization_id);
create table if not exists public.board_columns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  board_id uuid not null references public.boards (id) on delete cascade,
  label text not null, color text not null default '#94a3b8',
  position int not null default 0, wip_limit int,
  is_done boolean not null default false,
  unique (board_id, label)
);
create index if not exists board_columns_organization_id_idx on public.board_columns (organization_id);
create index if not exists board_columns_board_id_idx on public.board_columns (board_id);
create table if not exists public.board_fields (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  board_id uuid not null references public.boards (id) on delete cascade,
  key text not null, label text not null,
  type text not null check (type in ('text','number','select','status','date','person','checkbox','url')),
  position int not null default 0,
  config jsonb not null default '{}'::jsonb,
  unique (board_id, key)
);
create index if not exists board_fields_organization_id_idx on public.board_fields (organization_id);
create index if not exists board_fields_board_id_idx on public.board_fields (board_id);
alter table public.tasks add column if not exists board_id uuid references public.boards (id);
alter table public.tasks add column if not exists board_column_id uuid references public.board_columns (id);
alter table public.tasks add column if not exists custom_fields jsonb not null default '{}'::jsonb;
create index if not exists tasks_board_id_idx on public.tasks (board_id);
create index if not exists tasks_board_column_id_idx on public.tasks (board_column_id);
create index if not exists tasks_custom_fields_gin on public.tasks using gin (custom_fields);

grant select, insert, update, delete on public.boards to authenticated;
alter table public.boards enable row level security;
drop trigger if exists boards_enforce_org on public.boards;
create trigger boards_enforce_org before insert or update on public.boards for each row execute function public.enforce_row_organization_id();
drop policy if exists boards_select on public.boards;
create policy boards_select on public.boards for select to authenticated using (organization_id = public.current_org_id());
drop policy if exists boards_insert on public.boards;
create policy boards_insert on public.boards for insert to authenticated with check (organization_id = public.current_org_id());
drop policy if exists boards_update on public.boards;
create policy boards_update on public.boards for update to authenticated using (organization_id = public.current_org_id()) with check (organization_id = public.current_org_id());
drop policy if exists boards_delete on public.boards;
create policy boards_delete on public.boards for delete to authenticated using (organization_id = public.current_org_id());

grant select, insert, update, delete on public.board_columns to authenticated;
alter table public.board_columns enable row level security;
drop trigger if exists board_columns_enforce_org on public.board_columns;
create trigger board_columns_enforce_org before insert or update on public.board_columns for each row execute function public.enforce_row_organization_id();
drop policy if exists board_columns_select on public.board_columns;
create policy board_columns_select on public.board_columns for select to authenticated using (organization_id = public.current_org_id());
drop policy if exists board_columns_insert on public.board_columns;
create policy board_columns_insert on public.board_columns for insert to authenticated with check (organization_id = public.current_org_id());
drop policy if exists board_columns_update on public.board_columns;
create policy board_columns_update on public.board_columns for update to authenticated using (organization_id = public.current_org_id()) with check (organization_id = public.current_org_id());
drop policy if exists board_columns_delete on public.board_columns;
create policy board_columns_delete on public.board_columns for delete to authenticated using (organization_id = public.current_org_id());

grant select, insert, update, delete on public.board_fields to authenticated;
alter table public.board_fields enable row level security;
drop trigger if exists board_fields_enforce_org on public.board_fields;
create trigger board_fields_enforce_org before insert or update on public.board_fields for each row execute function public.enforce_row_organization_id();
drop policy if exists board_fields_select on public.board_fields;
create policy board_fields_select on public.board_fields for select to authenticated using (organization_id = public.current_org_id());
drop policy if exists board_fields_insert on public.board_fields;
create policy board_fields_insert on public.board_fields for insert to authenticated with check (organization_id = public.current_org_id());
drop policy if exists board_fields_update on public.board_fields;
create policy board_fields_update on public.board_fields for update to authenticated using (organization_id = public.current_org_id()) with check (organization_id = public.current_org_id());
drop policy if exists board_fields_delete on public.board_fields;
create policy board_fields_delete on public.board_fields for delete to authenticated using (organization_id = public.current_org_id());

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'board_columns'
  ) then
    alter publication supabase_realtime add table public.board_columns;
  end if;
end $$;


-- Seed : desactiver les triggers org le temps des backfills (pas de JWT en migration)
alter table public.boards disable trigger boards_enforce_org;
alter table public.board_columns disable trigger board_columns_enforce_org;

insert into public.boards (organization_id, name, position)
select o.id, 'Espace principal', 0 from public.organizations o
on conflict (organization_id, name) do nothing;

insert into public.board_columns (organization_id, board_id, label, color, position, is_done)
select wc.organization_id, b.id, wc.name, '#94a3b8', wc.sort_order, (wc.name = 'Terminé')
from public.workflow_columns wc
join public.boards b on b.organization_id = wc.organization_id and b.name = 'Espace principal'
on conflict (board_id, label) do nothing;

-- Repli si workflow_columns vide
insert into public.board_columns (organization_id, board_id, label, color, position, is_done)
select b.organization_id, b.id, col.label, '#94a3b8', col.pos, (col.label = 'Terminé')
from public.boards b
cross join (
  values ('À faire', 0), ('En cours', 1), ('En validation', 2), ('Terminé', 3)
) as col(label, pos)
where b.name = 'Espace principal'
on conflict (board_id, label) do nothing;

alter table public.boards enable trigger boards_enforce_org;
alter table public.board_columns enable trigger board_columns_enforce_org;

update public.tasks t
set board_id = sub.board_id, board_column_id = sub.board_column_id
from (
  select t2.id as task_id, b.id as board_id, bc.id as board_column_id
  from public.tasks t2
  join public.boards b on b.organization_id = t2.organization_id and b.name = 'Espace principal'
  join public.board_columns bc on bc.board_id = b.id
  left join public.workflow_columns wc on wc.id = t2.workflow_column_id
  where t2.board_id is null
    and bc.label = coalesce(wc.name, t2.column_id)
) sub
where t.id = sub.task_id;

update public.tasks t
set board_column_id = bc.id
from public.board_columns bc
where t.board_id = bc.board_id and t.board_column_id is null and t.column_id is not null and bc.label = t.column_id;

create or replace function public.resolve_task_board_references()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.board_id is null and new.organization_id is not null then
    select b.id into new.board_id from public.boards b
    where b.organization_id = new.organization_id and b.name = 'Espace principal' limit 1;
  end if;
  if new.board_column_id is null and new.board_id is not null and new.column_id is not null and btrim(new.column_id) <> '' then
    select bc.id into new.board_column_id from public.board_columns bc
    where bc.board_id = new.board_id and bc.label = new.column_id limit 1;
  end if;
  return new;
end;
$$;

drop trigger if exists tasks_resolve_board_references on public.tasks;
create trigger tasks_resolve_board_references before insert or update on public.tasks
  for each row execute function public.resolve_task_board_references();

create or replace function public.rename_board_column(p_column_id uuid, p_new_label text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_org_id uuid; v_board_id uuid; v_old_label text;
begin
  v_org_id := public.current_org_id();
  if v_org_id is null then raise exception 'Aucune organisation associée au profil utilisateur'; end if;
  p_new_label := btrim(p_new_label);
  if p_new_label is null or p_new_label = '' then raise exception 'Le libellé de colonne ne peut pas être vide'; end if;
  select bc.board_id, bc.label into v_board_id, v_old_label from public.board_columns bc
  where bc.id = p_column_id and bc.organization_id = v_org_id;
  if v_board_id is null then raise exception 'Colonne introuvable ou non autorisée'; end if;
  if v_old_label = p_new_label then return; end if;
  if exists (select 1 from public.board_columns bc where bc.board_id = v_board_id and bc.label = p_new_label and bc.id <> p_column_id) then
    raise exception 'Une colonne avec ce nom existe déjà sur ce tableau';
  end if;
  update public.board_columns set label = p_new_label where id = p_column_id;
  update public.tasks set column_id = p_new_label where board_id = v_board_id and column_id = v_old_label;
end;
$$;

create or replace function public.reassign_and_delete_board_column(p_column_id uuid, p_target_column_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_org_id uuid; v_board_id uuid; v_old_label text; v_target_label text;
begin
  v_org_id := public.current_org_id();
  if v_org_id is null then raise exception 'Aucune organisation associée au profil utilisateur'; end if;
  if p_column_id = p_target_column_id then raise exception 'La colonne cible doit être différente'; end if;
  select bc.board_id, bc.label into v_board_id, v_old_label from public.board_columns bc
  where bc.id = p_column_id and bc.organization_id = v_org_id;
  if v_board_id is null then raise exception 'Colonne source introuvable ou non autorisée'; end if;
  select bc.label into v_target_label from public.board_columns bc
  where bc.id = p_target_column_id and bc.board_id = v_board_id and bc.organization_id = v_org_id;
  if v_target_label is null then raise exception 'Colonne cible introuvable ou non autorisée'; end if;
  update public.tasks set board_column_id = p_target_column_id, column_id = v_target_label
  where board_id = v_board_id and column_id = v_old_label;
  delete from public.board_columns where id = p_column_id and organization_id = v_org_id;
end;
$$;

grant execute on function public.rename_board_column(uuid, text) to authenticated;
grant execute on function public.reassign_and_delete_board_column(uuid, uuid) to authenticated;



