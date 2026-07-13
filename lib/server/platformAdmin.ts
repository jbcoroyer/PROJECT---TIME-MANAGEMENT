import "server-only";

import { getServerOrgContext } from "./orgContext";
import { createServerSupabase } from "./supabaseServer";

function platformAdminEmails(): string[] {
  return (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function isPlatformAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return platformAdminEmails().includes(normalized);
}

export async function requirePlatformAdmin(): Promise<
  { ok: true; email: string } | { ok: false; error: string }
> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { ok: false, error: "Non authentifié." };
  }

  if (!isPlatformAdminEmail(user.email)) {
    return { ok: false, error: "Accès réservé aux administrateurs plateforme." };
  }

  return { ok: true, email: user.email };
}

export async function isCurrentUserPlatformAdmin(): Promise<boolean> {
  const ctx = await getServerOrgContext();
  if (!ctx) return false;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return isPlatformAdminEmail(user?.email);
}
