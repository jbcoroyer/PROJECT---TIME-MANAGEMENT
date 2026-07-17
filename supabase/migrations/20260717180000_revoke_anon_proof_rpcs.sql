-- Empêcher l'appel anon des RPC proofs (SECURITY DEFINER).
revoke execute on function public.append_proof_comment(uuid, jsonb) from anon, public;
revoke execute on function public.append_proof_version(uuid, text, text) from anon, public;
revoke execute on function public.set_proof_approver_decision(uuid, text, text) from anon, public;

grant execute on function public.append_proof_comment(uuid, jsonb) to authenticated;
grant execute on function public.append_proof_version(uuid, text, text) to authenticated;
grant execute on function public.set_proof_approver_decision(uuid, text, text) to authenticated;
