-- V2 : votes idées partagés + commentaires entité (remplace localStorage si tables absentes côté client).

-- ─── idea_votes : un vote par utilisateur et par idée ───────────────────────
create table if not exists public.idea_votes (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.stock_ideas (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id),
  created_at timestamptz not null default now(),
  unique (idea_id, user_id)
);

create index if not exists idea_votes_idea_id_idx on public.idea_votes (idea_id);
create index if not exists idea_votes_organization_id_idx on public.idea_votes (organization_id);
create index if not exists idea_votes_user_id_idx on public.idea_votes (user_id);

grant select, insert, update, delete on public.idea_votes to authenticated;

alter table public.idea_votes enable row level security;

drop trigger if exists idea_votes_enforce_org on public.idea_votes;
create trigger idea_votes_enforce_org
  before insert or update on public.idea_votes
  for each row
  execute function public.enforce_row_organization_id();

drop policy if exists idea_votes_select on public.idea_votes;
create policy idea_votes_select on public.idea_votes
  for select to authenticated
  using (organization_id = public.current_org_id());

drop policy if exists idea_votes_insert on public.idea_votes;
create policy idea_votes_insert on public.idea_votes
  for insert to authenticated
  with check (
    organization_id = public.current_org_id()
    and user_id = auth.uid()
  );

drop policy if exists idea_votes_update on public.idea_votes;
create policy idea_votes_update on public.idea_votes
  for update to authenticated
  using (
    organization_id = public.current_org_id()
    and user_id = auth.uid()
  )
  with check (
    organization_id = public.current_org_id()
    and user_id = auth.uid()
  );

drop policy if exists idea_votes_delete on public.idea_votes;
create policy idea_votes_delete on public.idea_votes
  for delete to authenticated
  using (
    organization_id = public.current_org_id()
    and (user_id = auth.uid() or public.is_admin())
  );

-- ─── entity_comments : fils de commentaires par canal ───────────────────────
create table if not exists public.entity_comments (
  id uuid primary key default gen_random_uuid(),
  channel_key text not null,
  author_id uuid references auth.users (id) on delete set null,
  author_name text not null,
  body text not null,
  mentions text[] not null default '{}',
  created_at timestamptz not null default now(),
  organization_id uuid not null references public.organizations (id)
);

create index if not exists entity_comments_channel_idx
  on public.entity_comments (channel_key, created_at);
create index if not exists entity_comments_organization_id_idx
  on public.entity_comments (organization_id);

grant select, insert, update, delete on public.entity_comments to authenticated;

alter table public.entity_comments enable row level security;

drop trigger if exists entity_comments_enforce_org on public.entity_comments;
create trigger entity_comments_enforce_org
  before insert or update on public.entity_comments
  for each row
  execute function public.enforce_row_organization_id();

drop policy if exists entity_comments_select on public.entity_comments;
create policy entity_comments_select on public.entity_comments
  for select to authenticated
  using (organization_id = public.current_org_id());

drop policy if exists entity_comments_insert on public.entity_comments;
create policy entity_comments_insert on public.entity_comments
  for insert to authenticated
  with check (
    organization_id = public.current_org_id()
    and (author_id is null or author_id = auth.uid())
  );

drop policy if exists entity_comments_update on public.entity_comments;
create policy entity_comments_update on public.entity_comments
  for update to authenticated
  using (
    organization_id = public.current_org_id()
    and author_id = auth.uid()
  )
  with check (
    organization_id = public.current_org_id()
    and author_id = auth.uid()
  );

drop policy if exists entity_comments_delete on public.entity_comments;
create policy entity_comments_delete on public.entity_comments
  for delete to authenticated
  using (
    organization_id = public.current_org_id()
    and (author_id = auth.uid() or public.is_admin())
  );

notify pgrst, 'reload schema';
