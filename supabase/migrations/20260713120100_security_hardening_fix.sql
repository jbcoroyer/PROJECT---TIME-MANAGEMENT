-- Correctif : current_org_id() et is_admin() doivent rester exécutables par authenticated
-- (utilisées dans les expressions RLS). Les fonctions trigger-only restent révoquées.

grant execute on function public.current_org_id() to authenticated;
grant execute on function public.is_admin() to authenticated;

-- Bloquer l'appel RPC anonyme tout en gardant les policies fonctionnelles.
revoke all on function public.current_org_id() from anon;
revoke all on function public.is_admin() from anon;
