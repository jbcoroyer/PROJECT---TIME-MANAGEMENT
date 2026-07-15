import type { SupabaseClient } from "@supabase/supabase-js";
import type { CurrentUser } from "./useCurrentUser";
import { resolveUserDisplayName } from "./userDisplayName";

/** Nom affichable pour s'assigner une tâche quand l'équipe n'est pas encore configurée. */
export function resolveFallbackAssigneeName(
  user: Pick<CurrentUser, "teamMemberName" | "displayName" | "email"> | null | undefined,
): string | null {
  if (!user) return null;
  const fromMember = user.teamMemberName?.trim();
  if (fromMember) return fromMember;
  const fromDisplay = user.displayName?.trim();
  if (fromDisplay) return fromDisplay;
  const fromEmail = user.email?.split("@")[0]?.trim();
  return fromEmail || null;
}

/** Crée la fiche `team_members` manquante pour l'utilisateur connecté (premier projet / comptes legacy). */
export async function ensureCurrentUserTeamMember(
  supabase: SupabaseClient,
  user: Pick<
    CurrentUser,
    "id" | "email" | "organizationId" | "teamMemberId" | "teamMemberName" | "displayName"
  >,
): Promise<string | null> {
  const fallback = resolveFallbackAssigneeName(user);
  if (!fallback) return null;

  if (user.teamMemberId && user.teamMemberName?.trim()) {
    return user.teamMemberName.trim();
  }

  if (user.teamMemberId) {
    const { data: member } = await supabase
      .from("team_members")
      .select("id, display_name")
      .eq("id", user.teamMemberId)
      .maybeSingle();
    if (member?.display_name?.trim()) {
      return member.display_name.trim();
    }
  }

  if (!user.organizationId) return fallback;

  const displayName =
    resolveUserDisplayName({
      teamMemberName: user.teamMemberName,
      displayName: user.displayName,
      email: user.email,
    }) || fallback;

  const { data: created, error } = await supabase
    .from("team_members")
    .insert({
      display_name: displayName,
      is_active: true,
      organization_id: user.organizationId,
    })
    .select("id, display_name")
    .single();

  if (error || !created) return fallback;

  await supabase
    .from("profiles")
    .update({
      team_member_id: created.id,
      display_name: displayName,
    })
    .eq("id", user.id);

  return String(created.display_name ?? displayName);
}
