import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isPlaceholderDisplayName,
  resolveDisplayNameFromMetadata,
} from "./userDisplayName";

/** Aligne profiles + team_members sur le nom réel (OAuth Google, correction legacy email). */
export async function syncUserDisplayName(
  supabase: SupabaseClient,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return;

  const resolved = resolveDisplayNameFromMetadata(user.user_metadata);
  if (!resolved || isPlaceholderDisplayName(resolved, user.email)) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, team_member_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.team_member_id) return;

  const currentName = (profile.display_name as string | null) ?? null;

  const { data: member } = await supabase
    .from("team_members")
    .select("display_name")
    .eq("id", profile.team_member_id as string)
    .maybeSingle();

  const memberName = (member?.display_name as string | null) ?? null;

  const needsProfile = isPlaceholderDisplayName(currentName, user.email);
  const needsMember = isPlaceholderDisplayName(memberName, user.email);

  if (!needsProfile && !needsMember) return;

  if (needsProfile) {
    await supabase.from("profiles").update({ display_name: resolved }).eq("id", user.id);
  }

  if (needsMember) {
    await supabase
      .from("team_members")
      .update({ display_name: resolved })
      .eq("id", profile.team_member_id as string);
  }
}
