-- Phase 3 : élargir board_fields.type pour inclure 'relation' + Realtime.

alter table public.board_fields drop constraint if exists board_fields_type_check;
alter table public.board_fields add constraint board_fields_type_check
  check (
    type in (
      'text', 'number', 'select', 'status', 'date', 'person', 'checkbox', 'url', 'relation'
    )
  );

do $$ begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'board_fields'
  ) then
    alter publication supabase_realtime add table public.board_fields;
  end if;
end $$;
