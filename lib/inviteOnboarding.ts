import type { User } from "@supabase/supabase-js";

export function isInvitedUser(user: User | null | undefined): boolean {
  return user?.user_metadata?.invited === true;
}

export function hasCompletedInviteProfile(user: User | null | undefined): boolean {
  return user?.user_metadata?.invite_profile_complete === true;
}

export function needsInviteProfileCompletion(user: User | null | undefined): boolean {
  if (!user) return false;
  if (!isInvitedUser(user)) return false;
  return !hasCompletedInviteProfile(user);
}

export function splitDisplayName(displayName: string | null | undefined): {
  firstName: string;
  lastName: string;
} {
  const raw = (displayName ?? "").trim();
  if (!raw) return { firstName: "", lastName: "" };
  const parts = raw.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0] ?? "", lastName: "" };
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}
