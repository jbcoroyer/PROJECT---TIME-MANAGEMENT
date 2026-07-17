-- TÂCHE A : suppression définitive (DELETE) réservée aux admins sur tasks + proofs.
-- UPDATE volontairement non modifié (archivage is_archived / édition restent possibles).
-- TÂCHE C : promotion admin idempotente pour les comptes connus.
-- Réversible : restaurer une policy DELETE sans is_admin() si besoin.

-- ─── tasks : DELETE admin only ──────────────────────────────────────────────
drop policy if exists tasks_delete on public.tasks;
drop policy if exists tasks_delete_authenticated on public.tasks;
drop policy if exists "tasks_delete_authenticated" on public.tasks;

create policy tasks_delete on public.tasks
  for delete
  to authenticated
  using (
    organization_id = public.current_org_id()
    and public.is_admin()
  );

-- ─── proofs : DELETE admin only ─────────────────────────────────────────────
drop policy if exists proofs_delete on public.proofs;
drop policy if exists proofs_delete_authenticated on public.proofs;
drop policy if exists "proofs_delete_authenticated" on public.proofs;

create policy proofs_delete on public.proofs
  for delete
  to authenticated
  using (
    organization_id = public.current_org_id()
    and public.is_admin()
  );

-- ─── profiles.role = admin (contrainte profiles_role_check : admin | user) ──
-- N'invalide aucune donnée ; no-op si le compte n'existe pas encore.
update public.profiles p
set role = 'admin'
from auth.users u
where u.id = p.id
  and lower(u.email) in (
    'jbc@idena2000.fr',
    'jean-baptiste.coroyer@idena.fr'
  )
  and p.role is distinct from 'admin';

notify pgrst, 'reload schema';
